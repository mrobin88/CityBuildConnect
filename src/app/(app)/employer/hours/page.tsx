import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function EmployerHoursPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "EMPLOYER") redirect(defaultHomeForRole(session.user.role));

  const [logs, totals] = await Promise.all([
    prisma.hoursLog.findMany({
      where: { employerId: session.user.id },
      include: {
        worker: { include: { user: { select: { name: true, email: true } } } },
        job: { select: { title: true, location: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    prisma.hoursLog.aggregate({
      where: { employerId: session.user.id },
      _sum: { hours: true },
      _count: { id: true },
    }),
  ]);

  const pendingCount = logs.filter((l) => !l.verified).length;

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Activity log</h1>
      </header>
      <div className="content">
        <div className="colMain">
          <div className="statRow">
            <div className="stat">
              <div className="statLabel">Logged hours</div>
              <div className="statValue">{Math.round((totals._sum.hours ?? 0) * 10) / 10}h</div>
            </div>
            <div className="stat">
              <div className="statLabel">Entries</div>
              <div className="statValue">{totals._count.id}</div>
            </div>
            <div className="stat">
              <div className="statLabel">Pending verify</div>
              <div className="statValue">{pendingCount}</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardHeader">
              <span className="cardTitle">Worker time entries</span>
            </div>
            <div className="cardBody" style={{ display: "grid", gap: 8 }}>
              {logs.length === 0 ? (
                <div className="muted">No time entries yet.</div>
              ) : (
                logs.map((row) => {
                  const workerName = row.worker.user.name ?? row.worker.user.email ?? "Worker";
                  return (
                    <div key={row.id} className="workerCard">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="workerName">
                          {workerName} · {row.hours}h
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
