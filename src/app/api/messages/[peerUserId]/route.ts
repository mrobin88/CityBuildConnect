import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canExchangeDirectMessagesByRole, canSendDirectMessage } from "@/lib/message-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { peerUserId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.user.id;
  const myRole = session.user.role;
  if (myRole !== "WORKER" && myRole !== "EMPLOYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const peerUserId = params.peerUserId;
  if (!peerUserId || peerUserId === me) {
    return NextResponse.json({ error: "Invalid peer" }, { status: 400 });
  }

  const peer = await prisma.user.findUnique({
    where: { id: peerUserId },
    select: {
      id: true,
      name: true,
      role: true,
      employerProfile: { select: { companyName: true } },
      workerProfile: { select: { trade: true } },
    },
  });

  if (!peer || !canExchangeDirectMessagesByRole(myRole, peer.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const peerName =
    peer.employerProfile?.companyName ?? peer.name ?? peer.workerProfile?.trade ?? "User";

  if (!(await canSendDirectMessage(prisma, me, myRole, peer.id, peer.role))) {
    return NextResponse.json({
      peer: { id: peer.id, name: peerName, role: peer.role },
      locked: true,
      reason: "Messaging opens once you and this person have both shown interest.",
      messages: [],
    });
  }

  await prisma.message.updateMany({
    where: { fromId: peerUserId, toId: me, read: false },
    data: { read: true },
  });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { fromId: me, toId: peerUserId },
        { fromId: peerUserId, toId: me },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      fromId: true,
      toId: true,
      body: true,
      read: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    peer: { id: peer.id, name: peerName, role: peer.role },
    locked: false,
    messages: messages.map((m) => ({
      id: m.id,
      fromMe: m.fromId === me,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
