import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect(defaultHomeForRole(session.user.role));

  const [workerCount, employerCount, openJobs, hiredCount, unreadMessages] = await Promise.all([
    prisma.workerProfile.count(),
    prisma.employerProfile.count(),
    prisma.jobPosting.count({ where: { status: "OPEN" } }),
    prisma.application.count({ where: { status: "HIRED" } }),
    prisma.message.count({ where: { read: false } }),
  ]);

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Admin dashboard</h1>
      </header>
      <div className="content">
        <div className="colMain">
          <div className="statRow">
            <div className="stat">
              <div className="statLabel">Workers</div>
              <div className="statValue">{workerCount}</div>
            </div>
            <div className="stat">
              <div className="statLabel">Employers</div>
              <div className="statValue">{employerCount}</div>
            </div>
            <div className="stat">
              <div className="statLabel">Open jobs</div>
              <div className="statValue">{openJobs}</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardHeader">
              <span className="cardTitle">Operations pulse</span>
            </div>
            <div className="cardBody" style={{ display: "grid", gap: 10 }}>
              <div className="workerCard">
                <div style={{ flex: 1 }}>Total hires completed</div>
                <span className="tag tagGreen">{hiredCount}</span>
              </div>
              <div className="workerCard">
                <div style={{ flex: 1 }}>Unread messages</div>
                <span className={`tag ${unreadMessages > 0 ? "tagAmber" : "tagGreen"}`}>{unreadMessages}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/admin/certs" className="btnSecondary">
                  Review cert monitoring
                </Link>
                <Link href="/admin/cohorts" className="btnSecondary">
                  Review cohorts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
