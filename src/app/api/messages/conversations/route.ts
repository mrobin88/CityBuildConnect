import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canExchangeDirectMessages } from "@/lib/message-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function peerLabel(u: {
  name: string | null;
  employerProfile: { companyName: string } | null;
  workerProfile: { trade: string } | null;
}): string {
  if (u.employerProfile?.companyName) return u.employerProfile.companyName;
  return u.name ?? u.workerProfile?.trade ?? "User";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.user.id;
  const myRole = session.user.role;
  if (myRole !== "WORKER" && myRole !== "EMPLOYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.message.findMany({
    where: { OR: [{ fromId: me }, { toId: me }] },
    orderBy: { createdAt: "desc" },
    take: 400,
    include: {
      from: {
        select: {
          id: true,
          name: true,
          role: true,
          employerProfile: { select: { companyName: true } },
          workerProfile: { select: { trade: true } },
        },
      },
      to: {
        select: {
          id: true,
          name: true,
          role: true,
          employerProfile: { select: { companyName: true } },
          workerProfile: { select: { trade: true } },
        },
      },
    },
  });

  const seen = new Set<string>();
  const conversations: {
    peerUserId: string;
    peerName: string;
    peerRole: string;
    lastPreview: string;
    lastAt: string;
    unreadCount: number;
  }[] = [];

  for (const m of rows) {
    const peerId = m.fromId === me ? m.toId : m.fromId;
    if (seen.has(peerId)) continue;
    const peer = m.fromId === me ? m.to : m.from;
    if (!canExchangeDirectMessages(myRole, peer.role)) continue;
    seen.add(peerId);

    const unreadCount = await prisma.message.count({
      where: { fromId: peerId, toId: me, read: false },
    });

    conversations.push({
      peerUserId: peerId,
      peerName: peerLabel(peer),
      peerRole: peer.role,
      lastPreview: m.body.replace(/\s+/g, " ").slice(0, 140),
      lastAt: m.createdAt.toISOString(),
      unreadCount,
    });
  }

  return NextResponse.json({ conversations });
}
