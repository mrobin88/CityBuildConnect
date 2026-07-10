import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { consumeToken, PASSWORD_RESET_PREFIX } from "@/lib/auth-tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      token?: string;
      password?: string;
    };

    const email = body.email?.toLowerCase().trim() ?? "";
    const token = body.token ?? "";
    const password = body.password ?? "";

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const valid = await consumeToken(`${PASSWORD_RESET_PREFIX}${email}`, token);
    if (!valid) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 },
      );
    }

    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: { provider: "credentials", providerAccountId: email },
      },
      select: { id: true, userId: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 },
      );
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { access_token: hashPassword(password) },
    });

    // Proving control of the inbox also verifies the email address.
    await prisma.user.update({
      where: { id: account.userId },
      data: { emailVerified: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("reset_password_error", error);
    return NextResponse.json({ error: "Unable to reset password right now." }, { status: 500 });
  }
}
