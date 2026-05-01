import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function AdminCertsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect(defaultHomeForRole(session.user.role));

  const today = new Date();
  const inNinetyDays = new Date(today);
  inNinetyDays.setDate(inNinetyDays.getDate() + 90);

  const certs = await prisma.certification.findMany({
    where: {
      OR: [{ expiryDate: { lte: inNinetyDays } }, { documentUrl: null }],
    },
    include: { worker: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: [{ expiryDate: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Cert monitoring</h1>
      </header>
      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Expiring or missing-document certs</span>
              <span className="muted">{certs.length} flagged</span>
            </div>
            <div className="cardBody" style={{ display: "grid", gap: 8 }}>
              {certs.length === 0 ? (
                <div className="muted">No expiring or missing-document certs right now.</div>
              ) : (
                certs.map((cert) => {
                  const owner = cert.worker.user.name ?? cert.worker.user.email ?? "Worker";
                  const expLabel = cert.expiryDate ? cert.expiryDate.toLocaleDateString() : "No expiry on file";
                  const expiresSoon = cert.expiryDate ? cert.expiryDate <= inNinetyDays : false;
                  return (
                    <div key={cert.id} className="workerCard">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="workerName">
                          {cert.name} · {owner}
                        </div>
                        <div className="muted">Expiry: {expLabel}</div>
                      </div>
                      {cert.documentUrl ? (
                        <Link href={`/api/worker/certifications/${cert.id}/file`} className="btnSecondary" target="_blank">
                          File
                        </Link>
                      ) : (
                        <span className="tag tagAmber">Missing file</span>
                      )}
                      {expiresSoon ? <span className="tag tagAmber">Expiring</span> : <span className="tag tagBlue">Review</span>}
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
