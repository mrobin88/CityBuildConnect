import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";

export default function EmployerCrewPage() {
  return <EmployerCrewData />;
}

async function EmployerCrewData() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "EMPLOYER") redirect(defaultHomeForRole(session.user.role));

  const hired = await prisma.application.findMany({
    where: { status: "HIRED", jobPosting: { employerId: session.user.id } },
    include: {
      worker: { include: { user: true } },
      jobPosting: { select: { title: true, location: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Active crew</h1>
      </header>
      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Hired workers</span>
              <span className="muted">{hired.length} active placements</span>
            </div>
            <div className="cardBody">
              {hired.length === 0 ? (
                <p className="muted">No hired workers yet. Move applicants to HIRED from My postings.</p>
              ) : (
                hired.map((entry) => (
                  <div key={entry.id} className="workerCard" style={{ paddingInline: 0 }}>
                    <div className="workerInfo">
                      <div className="workerName">{entry.worker.user.name ?? entry.worker.user.email ?? "Worker"}</div>
                      <div className="workerTrade">
                        {entry.worker.trade} · {entry.jobPosting.title} · {entry.jobPosting.location}
                      </div>
                    </div>
                    <div className="workerHours">
                      <div className="hoursNum">{entry.worker.totalHours.toLocaleString()}</div>
                      <div>hrs logged</div>
                    </div>
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
