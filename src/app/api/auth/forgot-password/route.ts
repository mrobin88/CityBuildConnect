import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appBaseUrl, renderActionEmail, sendMail } from "@/lib/mailer";
import { issueToken, PASSWORD_RESET_PREFIX, PASSWORD_RESET_TTL_MS } from "@/lib/auth-tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Neutral response used in every case to avoid revealing which emails exist.
const NEUTRAL = NextResponse.json({
  ok: true,
  message: "If an account with that email exists, a reset link is on its way.",
});

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = body.email?.toLowerCase().trim() ?? "";
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Reset only applies to password (credentials) accounts.
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: { provider: "credentials", providerAccountId: email },
      },
      include: { user: { select: { name: true } } },
    });

    if (!account) return NEUTRAL;

    const rawToken = await issueToken(`${PASSWORD_RESET_PREFIX}${email}`, PASSWORD_RESET_TTL_MS);
    const resetUrl = `${appBaseUrl()}/reset-password?email=${encodeURIComponent(email)}&token=${rawToken}`;
    const firstName = account.user.name?.split(" ")[0];

    const { html, text } = renderActionEmail({
      previewText: "Reset your Build Connect password.",
      heading: "Reset your password",
      bodyLines: [
        `${firstName ? `Hi ${firstName},` : "Hi,"}`,
        "We received a request to reset the password for your Build Connect account. Click the button below to choose a new password.",
        "This link expires in 1 hour and can only be used once.",
      ],
      buttonLabel: "Reset password",
      buttonUrl: resetUrl,
      footerNote:
        "If you didn't request a password reset, you can safely ignore this email — your password won't change.",
    });

    await sendMail({ to: email, subject: "Reset your Build Connect password", html, text });

    return NEUTRAL;
  } catch (error) {
    console.error("forgot_password_error", error);
    // Still neutral to the client; don't leak internals.
    return NEUTRAL;
  }
}
