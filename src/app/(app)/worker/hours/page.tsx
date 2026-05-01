import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function WorkerHoursPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "WORKER") redirect(defaultHomeForRole(session.user.role));

  const [logs, totals] = await Promise.all([
    prisma.hoursLog.findMany({
      where: { workerId: session.user.id },
      include: {
        employer: { include: { user: { select: { name: true } } } },
        job: { select: { title: true, location: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
    prisma.hoursLog.aggregate({
      where: { workerId: session.user.id },
      _sum: { hours: true },
      _count: { id: true },
    }),
  ]);

  const verifiedHours = logs.filter((row) => row.verified).reduce((sum, row) => sum + row.hours, 0);
  const pendingHours = logs.filter((row) => !row.verified).reduce((sum, row) => sum + row.hours, 0);

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Hours tracker</h1>
      </header>
      <div className="content">
        <div className="colMain">
          <div className="statRow">
            <div className="stat">
              <div className="statLabel">Total logged</div>
              <div className="statValue">{Math.round((totals._sum.hours ?? 0) * 10) / 10}h</div>
            </div>
            <div className="stat">
              <div className="statLabel">Verified</div>
              <div className="statValue">{Math.round(verifiedHours * 10) / 10}h</div>
            </div>
            <div className="stat">
              <div className="statLabel">Pending</div>
              <div className="statValue">{Math.round(pendingHours * 10) / 10}h</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardHeader">
              <span className="cardTitle">Recent entries</span>
              <span className="muted">{totals._count.id} records</span>
            </div>
            <div className="cardBody" style={{ display: "grid", gap: 8 }}>
              {logs.length === 0 ? (
                <div className="muted">No hours logged yet.</div>
              ) : (
                logs.map((row) => {
                  const employer = row.employer.companyName ?? row.employer.user.name ?? "Employer";
                  return (
                    <div key={row.id} className="workerCard">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="workerName">
                          {row.hours}h · {employer}
                        </div>
                        <div className="muted">
                          {row.job ? `${row.job.title} · ${row.job.location}` : "General shift"} ·{" "}
                          {row.date.toLocaleDateString()}
                        </div>
                        {row.notes ? <div className="muted">{row.notes}</div> : null}
                      </div>
                      <span className={`tag ${row.verified ? "tagGreen" : "tagAmber"}`}>
                        {row.verified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
