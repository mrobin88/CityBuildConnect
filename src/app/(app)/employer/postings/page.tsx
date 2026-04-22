import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";
import {
  EmployerPostingsClient,
  type EmployerApplicationRow,
  type EmployerPostingRow,
} from "@/components/employer/employer-postings-client";

export default function EmployerPostingsPage() {
  return <EmployerPostingsData />;
}

async function EmployerPostingsData() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "EMPLOYER") redirect(defaultHomeForRole(session.user.role));

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      jobPostings: {
        include: {
          applications: {
            include: {
              worker: {
                include: {
                  user: true,
                  certifications: { take: 4, orderBy: { name: "asc" } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!employer) {
    return (
      <div className="pageStack">
        <header className="topbar">
          <h1 className="pageTitle">My postings</h1>
        </header>
        <div className="content">
          <div className="card">
            <div className="cardBody muted">Create your company profile to post jobs.</div>
          </div>
        </div>
      </div>
    );
  }

  const postings: EmployerPostingRow[] = employer.jobPostings.map((p) => {
    const applications: EmployerApplicationRow[] = p.applications.map((a) => ({
      id: a.id,
      status: a.status,
      workerName: a.worker.user.name ?? a.worker.user.email ?? "Worker",
      trade: a.worker.trade,
      totalHours: a.worker.totalHours,
      certNames: a.worker.certifications.map((c) => c.name),
      createdAtLabel: a.createdAt.toLocaleDateString(),
    }));

    return {
      id: p.id,
      title: p.title,
      trade: p.trade,
      location: p.location,
      openSlots: p.openSlots,
      hoursPerWeek: p.hoursPerWeek,
      status: p.status,
      applicantCount: applications.length,
      createdAtLabel: p.createdAt.toLocaleDateString(),
      applications,
    };
  });

  return <EmployerPostingsClient postings={postings} />;
}
