import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BODY = 8000;

type Ctx = { params: { messageId: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "WORKER" && session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messageId = params.messageId;
  if (!messageId) return NextResponse.json({ error: "Invalid message id" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body === "object" && body && "body" in body ? String((body as { body: unknown }).body).trim() : "";
  if (!text || text.length > MAX_BODY) {
    return NextResponse.json({ error: `Message required (max ${MAX_BODY} characters).` }, { status: 400 });
  }

  const existing = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, fromId: true },
  });
  if (!existing) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  if (existing.fromId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.message.update({
    where: { id: messageId },
    data: { body: text },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "WORKER" && session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messageId = params.messageId;
  if (!messageId) return NextResponse.json({ error: "Invalid message id" }, { status: 400 });

  const existing = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, fromId: true },
  });
  if (!existing) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  if (existing.fromId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.message.delete({ where: { id: messageId } });
  return NextResponse.json({ ok: true });
}
