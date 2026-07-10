import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email-verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NEUTRAL = NextResponse.json({
  ok: true,
  message: "If your email needs confirmation, a new link is on its way.",
});

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = body.email?.toLowerCase().trim() ?? "";
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, emailVerified: true },
    });

    if (user && !user.emailVerified) {
      await sendVerificationEmail(email, user.name);
    }

    return NEUTRAL;
  } catch (error) {
    console.error("resend_verification_error", error);
    return NEUTRAL;
  }
}
