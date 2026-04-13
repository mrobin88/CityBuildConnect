import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { certExpiryStatus } from "@/lib/cert-status";
import { defaultHomeForRole } from "@/lib/routes";
import {
  BrowseEmployersClient,
  type BrowseJobRow,
  type BrowseStats,
  type BrowseWorkerRow,
} from "@/components/employer/browse-employers-client";

export const dynamic = "force-dynamic";

export default async function EmployerBrowsePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "EMPLOYER") redirect(defaultHomeForRole(session.user.role));

  const [workersRaw, jobsRaw, placementsYtd, hoursAgg] = await Promise.all([
    prisma.workerProfile.findMany({
      include: {
        user: { select: { name: true } },
        certifications: { take: 4, orderBy: { name: "asc" } },
      },
      orderBy: { totalHours: "desc" },
    }),
    prisma.jobPosting.findMany({
      where: { status: "OPEN" },
      include: {
        employer: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.application.count({
      where: { status: "HIRED", createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } },
    }),
    prisma.workerProfile.aggregate({ _avg: { totalHours: true } }),
  ]);

  const workers: BrowseWorkerRow[] = workersRaw.map((w) => ({
    userId: w.userId,
    name: w.user.name,
    trade: w.trade,
    apprenticeYear: w.apprenticeYear,
    totalHours: w.totalHours,
    certNames: w.certifications.map((c) => c.name),
  }));

  const jobs: BrowseJobRow[] = await Promise.all(
    jobsRaw.map(async (j) => {
      const hired = await prisma.application.count({
        where: { jobPostingId: j.id, status: "HIRED" },
      });
      const totalSlots = Math.max(j.openSlots + hired, j.openSlots, 1);
      const filledPct = Math.round((hired / totalSlots) * 100);
      const companyName = j.employer.companyName ?? j.employer.user.name ?? "Employer";
      return {
        id: j.id,
        title: j.title,
        companyName,
        location: j.location,
        openSlots: j.openSlots,
        filledPct: Math.min(100, Math.max(5, filledPct)),
        filledLabel: `${hired} of ${totalSlots} positions filled`,
      };
    })
  );

  const stats: BrowseStats = {
    availableWorkers: workersRaw.length,
    placementsYtd,
    avgHours: Math.round(hoursAgg._avg.totalHours ?? 0),
  };

  const previewSource =
    workersRaw[0]?.certifications && workersRaw[0].certifications.length > 0
      ? workersRaw[0].certifications.slice(0, 3)
      : [];

  const certPreview =
    previewSource.length > 0
      ? previewSource.map((c) => ({
          name: c.name,
          expiryLabel: c.expiryDate
            ? `Exp. ${c.expiryDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
            : "No expiry",
          status: certExpiryStatus(c.expiryDate),
        }))
      : [
          { name: "OSHA 30", expiryLabel: "Exp. Dec 2026", status: "green" as const },
          { name: "Scaffold Safety", expiryLabel: "Exp. Mar 2025", status: "amber" as const },
          { name: "NFPA 70E", expiryLabel: "Exp. Aug 2026", status: "green" as const },
        ];

  return <BrowseEmployersClient workers={workers} jobs={jobs} stats={stats} certPreview={certPreview} />;
}
