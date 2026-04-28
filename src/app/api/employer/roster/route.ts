import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const workerId = String(body.workerId ?? "").trim();
  if (!workerId) return NextResponse.json({ error: "workerId is required." }, { status: 400 });

  const workerExists = await prisma.workerProfile.findUnique({
    where: { userId: workerId },
    select: { userId: true },
  });
  if (!workerExists) {
    return NextResponse.json({ error: "Worker not found." }, { status: 404 });
  }

  const row = await prisma.employerRosterEntry.upsert({
    where: {
      employerId_workerId: {
        employerId: session.user.id,
        workerId,
      },
    },
    update: {},
    create: {
      employerId: session.user.id,
      workerId,
    },
  });

  return NextResponse.json({ rosterEntry: row });
}
