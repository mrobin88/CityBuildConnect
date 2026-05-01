import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function AdminCohortsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect(defaultHomeForRole(session.user.role));

  const workers = await prisma.workerProfile.findMany({
    select: { trade: true, apprenticeYear: true, totalHours: true, unionLocal: true },
    orderBy: { trade: "asc" },
  });

  const byTrade = new Map<string, { count: number; avgHours: number; unionTagged: number }>();
  for (const worker of workers) {
    const key = worker.trade.trim() || "Unspecified";
    const current = byTrade.get(key) ?? { count: 0, avgHours: 0, unionTagged: 0 };
    current.count += 1;
    current.avgHours += worker.totalHours;
    if (worker.unionLocal) current.unionTagged += 1;
    byTrade.set(key, current);
  }

  const rows = Array.from(byTrade.entries())
    .map(([trade, value]) => ({
      trade,
      count: value.count,
      avgHours: Math.round(value.avgHours / Math.max(value.count, 1)),
      unionTagged: value.unionTagged,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Cohorts</h1>
      </header>
      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Worker cohort mix by trade</span>
              <span className="muted">{workers.length} workers</span>
            </div>
            <div className="cardBody" style={{ display: "grid", gap: 8 }}>
              {rows.length === 0 ? (
                <div className="muted">No worker cohort data yet.</div>
              ) : (
                rows.map((row) => (
                  <div key={row.trade} className="workerCard">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="workerName">{row.trade}</div>
                      <div className="muted">
                        Avg {row.avgHours.toLocaleString()}h · {row.unionTagged} with union local listed
                      </div>
                    </div>
                    <span className="tag tagBlue">{row.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
