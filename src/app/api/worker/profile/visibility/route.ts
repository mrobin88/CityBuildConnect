import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.isPublic !== "boolean") {
    return NextResponse.json({ error: "isPublic must be boolean." }, { status: 400 });
  }

  const existing = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    select: { userId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Create your worker profile first." }, { status: 400 });
  }

  const updated = await prisma.workerProfile.update({
    where: { userId: session.user.id },
    data: { isPublic: body.isPublic },
    select: { isPublic: true },
  });

  return NextResponse.json({ isPublic: updated.isPublic });
}
