import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function EmployerContractsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "EMPLOYER") redirect(defaultHomeForRole(session.user.role));

  const hiredApps = await prisma.application.findMany({
    where: { status: "HIRED", jobPosting: { employerId: session.user.id } },
    include: {
      worker: {
        include: {
          user: { select: { name: true, email: true } },
          certifications: { where: { documentUrl: { not: null } }, orderBy: { updatedAt: "desc" }, take: 1 },
        },
      },
      jobPosting: { select: { title: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Documents</h1>
      </header>
      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Placement paperwork queue</span>
              <span className="muted">{hiredApps.length} hires</span>
            </div>
            <div className="cardBody" style={{ display: "grid", gap: 8 }}>
              {hiredApps.length === 0 ? (
                <div className="muted">No hired placements yet. Hire from job postings to start a document queue.</div>
              ) : (
                hiredApps.map((app) => {
                  const workerName = app.worker.user.name ?? app.worker.user.email ?? "Worker";
                  const certDoc = app.worker.certifications[0];
                  return (
                    <div key={app.id} className="workerCard">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="workerName">{workerName}</div>
                        <div className="muted">{app.jobPosting.title}</div>
                      </div>
                      {certDoc ? (
                        <Link href={`/api/worker/certifications/${certDoc.id}/file`} className="btnSecondary" target="_blank">
                          Latest cert doc
                        </Link>
                      ) : (
                        <span className="tag tagAmber">No file</span>
                      )}
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
