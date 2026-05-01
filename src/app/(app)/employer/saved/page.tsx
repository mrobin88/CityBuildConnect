import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function EmployerSavedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "EMPLOYER") redirect(defaultHomeForRole(session.user.role));

  const saved = await prisma.employerRosterEntry.findMany({
    where: { employerId: session.user.id, archived: false },
    include: {
      worker: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Talent list</h1>
      </header>
      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Saved workers</span>
              <span className="muted">{saved.length} saved</span>
            </div>
            <div className="cardBody" style={{ display: "grid", gap: 8 }}>
              {saved.length === 0 ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div className="muted">No saved workers yet.</div>
                  <Link href="/employer/browse" className="btnPrimary" style={{ width: "fit-content" }}>
                    Browse workers
                  </Link>
                </div>
              ) : (
                saved.map((entry) => (
                  <Link key={entry.id} href={`/profiles/${entry.workerId}`} className="workerCard workerCardInteractive">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="workerName">{entry.worker.user.name ?? entry.worker.user.email ?? "Worker"}</div>
                      <div className="workerTrade">
                        {entry.worker.trade} · {entry.worker.totalHours.toLocaleString()}h logged
                      </div>
                      {entry.tags.length > 0 ? (
                        <div className="muted" style={{ marginTop: 4 }}>
                          Tags: {entry.tags.join(", ")}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
