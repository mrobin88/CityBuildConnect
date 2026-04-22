import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "WORKER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const worker = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    select: { userId: true },
  });
  if (!worker) return NextResponse.json({ error: "Worker profile missing" }, { status: 400 });

  const job = await prisma.jobPosting.findUnique({
    where: { id: params.jobId },
    select: { id: true, status: true },
  });
  if (!job || job.status !== "OPEN") {
    return NextResponse.json({ error: "Job is no longer open" }, { status: 400 });
  }

  const application = await prisma.application.upsert({
    where: {
      workerId_jobPostingId: {
        workerId: worker.userId,
        jobPostingId: params.jobId,
      },
    },
    update: {
      status: "PENDING",
      updatedAt: new Date(),
    },
    create: {
      workerId: worker.userId,
      jobPostingId: params.jobId,
      status: "PENDING",
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, application });
}
