import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/mailer";
import { consumeToken, EMAIL_VERIFY_PREFIX } from "@/lib/auth-tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.toLowerCase().trim() ?? "";
  const token = url.searchParams.get("token") ?? "";
  const base = appBaseUrl();

  if (!email || !token) {
    return NextResponse.redirect(`${base}/verify-email?status=invalid`);
  }

  const valid = await consumeToken(`${EMAIL_VERIFY_PREFIX}${email}`, token);
  if (!valid) {
    return NextResponse.redirect(`${base}/verify-email?status=invalid`);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return NextResponse.redirect(`${base}/verify-email?status=invalid`);
  }

  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });

  return NextResponse.redirect(`${base}/verify-email?status=success`);
}
