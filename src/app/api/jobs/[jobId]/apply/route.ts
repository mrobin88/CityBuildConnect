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
    select: { userId: true, trade: true, certifications: { select: { id: true, expiryDate: true }, take: 20 } },
  });
  if (!worker) return NextResponse.json({ error: "Worker profile missing" }, { status: 400 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { location: true },
  });
  if (!worker.trade.trim() || !user?.location?.trim()) {
    return NextResponse.json(
      { error: "Complete your profile (trade and location) before applying." },
      { status: 400 }
    );
  }
  const now = new Date();
  const hasCurrentCert = worker.certifications.some((c) => !c.expiryDate || c.expiryDate >= now);
  if (!hasCurrentCert) {
    return NextResponse.json(
      { error: "Add at least one current certification before applying." },
      { status: 400 }
    );
  }

  const job = await prisma.jobPosting.findUnique({
    where: { id: params.jobId },
    select: { id: true, status: true, employerId: true },
  });
  if (!job || job.status !== "OPEN") {
    return NextResponse.json({ error: "Job is no longer open" }, { status: 400 });
  }

  const dailyCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dailyApplications = await prisma.application.count({
    where: { workerId: worker.userId, createdAt: { gte: dailyCutoff } },
  });
  if (dailyApplications >= 5) {
    return NextResponse.json(
      { error: "Application limit reached (5 per day). Try again tomorrow." },
      { status: 429 }
    );
  }

  const employerCooldownCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentAtEmployer = await prisma.application.findFirst({
    where: {
      workerId: worker.userId,
      createdAt: { gte: employerCooldownCutoff },
      jobPosting: { employerId: job.employerId },
    },
    select: { id: true },
  });
  if (recentAtEmployer) {
    return NextResponse.json(
      { error: "You can only apply once per company every 7 days." },
      { status: 429 }
    );
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
