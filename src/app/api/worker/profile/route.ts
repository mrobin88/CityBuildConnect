import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "WORKER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    trade?: string;
    apprenticeYear?: number | null;
    unionLocal?: string | null;
    location?: string | null;
    bio?: string | null;
    availableFrom?: string | null;
  };

  const trade = body.trade?.trim() ?? "";
  const apprenticeYear =
    body.apprenticeYear == null || body.apprenticeYear === 0 ? null : Number(body.apprenticeYear);
  const unionLocal = body.unionLocal?.trim() || null;
  const location = body.location?.trim() || null;
  const bio = body.bio?.trim() || null;
  const availableFrom = body.availableFrom ? new Date(body.availableFrom) : null;

  if (!trade) {
    return NextResponse.json({ error: "Trade is required." }, { status: 400 });
  }

  await prisma.workerProfile.upsert({
    where: { userId: session.user.id },
    update: {
      trade,
      apprenticeYear,
      unionLocal,
      bio,
      availableFrom,
    },
    create: {
      userId: session.user.id,
      trade,
      apprenticeYear,
      unionLocal,
      bio,
      availableFrom,
      totalHours: 0,
    },
  });

  if (location) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { location },
    });
  }

  return NextResponse.json({ ok: true });
}
