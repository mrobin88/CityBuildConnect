import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canExchangeDirectMessages } from "@/lib/message-policy";
import { notifyNewDirectMessageSms } from "@/lib/twilio-notify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY = 8000;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const myRole = session.user.role;
  if (myRole !== "WORKER" && myRole !== "EMPLOYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const toUserId = typeof body === "object" && body && "toUserId" in body ? String((body as { toUserId: unknown }).toUserId) : "";
  const text =
    typeof body === "object" && body && "body" in body ? String((body as { body: unknown }).body).trim() : "";

  if (!toUserId || toUserId === session.user.id) {
    return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
  }
  if (!text || text.length > MAX_BODY) {
    return NextResponse.json({ error: `Message required (max ${MAX_BODY} characters).` }, { status: 400 });
  }

  const peer = await prisma.user.findUnique({
    where: { id: toUserId },
    select: {
      id: true,
      role: true,
      name: true,
      phone: true,
      employerProfile: { select: { companyName: true } },
      workerProfile: { select: { trade: true } },
    },
  });

  if (!peer || !canExchangeDirectMessages(myRole, peer.role)) {
    return NextResponse.json({ error: "Cannot message this user" }, { status: 403 });
  }

  const msg = await prisma.message.create({
    data: {
      fromId: session.user.id,
      toId: toUserId,
      body: text,
      read: false,
    },
    select: { id: true, createdAt: true },
  });

  const sender = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      employerProfile: { select: { companyName: true } },
      workerProfile: { select: { trade: true } },
    },
  });

  const senderDisplay =
    sender?.employerProfile?.companyName ??
    sender?.name ??
    sender?.workerProfile?.trade ??
    "Someone";

  await notifyNewDirectMessageSms({
    recipientPhone: peer.phone,
    senderDisplayName: senderDisplay,
    preview: text,
  });

  return NextResponse.json({
    message: { id: msg.id, createdAt: msg.createdAt.toISOString() },
  });
}
