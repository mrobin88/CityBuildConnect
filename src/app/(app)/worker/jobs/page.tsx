import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";
import { WorkerJobsClient, type WorkerJobRow } from "@/components/worker/worker-jobs-client";

export default function WorkerJobsPage() {
  return <WorkerJobsData />;
}

async function WorkerJobsData() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "WORKER") redirect(defaultHomeForRole(session.user.role));

  const jobsRaw = await prisma.jobPosting.findMany({
    where: { status: "OPEN" },
    include: {
      employer: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const existingApps = await prisma.application.findMany({
    where: { workerId: session.user.id },
    select: { jobPostingId: true, status: true },
  });
  const appByJob = new Map(existingApps.map((a) => [a.jobPostingId, a.status]));

  const jobs: WorkerJobRow[] = jobsRaw.map((j) => ({
    id: j.id,
    title: j.title,
    trade: j.trade,
    location: j.location,
    companyName: j.employer.companyName ?? j.employer.user.name ?? "Employer",
    hoursPerWeek: j.hoursPerWeek,
    openSlots: j.openSlots,
    startDateLabel: j.startDate ? j.startDate.toLocaleDateString() : null,
    description: j.description,
    applicationStatus: appByJob.get(j.id) ?? null,
  }));

  return <WorkerJobsClient jobs={jobs} />;
}
