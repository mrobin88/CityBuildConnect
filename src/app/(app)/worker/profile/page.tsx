import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { certExpiryStatus } from "@/lib/cert-status";
import { defaultHomeForRole } from "@/lib/routes";

export const dynamic = "force-dynamic";

const JOURNEY_HOURS_TARGET = 8000;

export default async function WorkerProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "WORKER") redirect(defaultHomeForRole(session.user.role));

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      certifications: { orderBy: { expiryDate: "asc" } },
    },
  });

  if (!profile) {
    return (
      <div className="pageStack">
        <header className="topbar">
          <h1 className="pageTitle">Worker profile</h1>
        </header>
        <div className="content">
          <div className="cardBody muted">No worker profile yet. Complete onboarding (coming soon).</div>
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((profile.totalHours / JOURNEY_HOURS_TARGET) * 100));

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Your profile</h1>
        <div className="topbarActions">
          <button type="button" className="btnSecondary">
            Edit
          </button>
          <button type="button" className="btnPrimary">
            Share profile
          </button>
        </div>
      </header>

      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Digital resume</span>
            </div>
            <div className="cardBody" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div className="avatar avBlue" style={{ width: 56, height: 56, fontSize: 18 }}>
                {(profile.user.name ?? "?")
                  .split(/\s+/)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="workerName" style={{ fontSize: 16 }}>
                  {profile.user.name}
                </div>
                <div className="workerTrade" style={{ marginTop: 4 }}>
                  {profile.trade}
                  {profile.apprenticeYear != null ? ` · Year ${profile.apprenticeYear}` : ""}
                  {profile.unionLocal ? ` · ${profile.unionLocal}` : ""}
                </div>
                {profile.user.location ? (
                  <div className="muted" style={{ marginTop: 6 }}>
                    {profile.user.location}
                  </div>
                ) : null}
                {profile.bio ? (
                  <p className="muted" style={{ marginTop: 10, lineHeight: 1.45 }}>
                    {profile.bio}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Hours toward journeyworker</span>
              <span className="muted">Target {JOURNEY_HOURS_TARGET.toLocaleString()} hrs (example: electrician)</span>
            </div>
            <div className="cardBody">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span className="workerName">{profile.totalHours.toLocaleString()} hrs logged</span>
                <span className="muted">{pct}%</span>
              </div>
              <div className="jobBarBg">
                <div className="jobBar" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="colSide">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Cert wallet</span>
            </div>
            <div className="cardBody" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {profile.certifications.length === 0 ? (
                <div className="muted">Upload certs to build trust with employers.</div>
              ) : (
                profile.certifications.map((c) => {
                  const st = certExpiryStatus(c.expiryDate);
                  const exp = c.expiryDate
                    ? `Exp. ${c.expiryDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
                    : "No expiry on file";
                  return (
                    <div key={c.id} className="certItem">
                      <div className="certIcon">🪪</div>
                      <div>
                        <div className="certName">{c.name}</div>
                        <div className="certExp">{exp}</div>
                        {c.verified ? (
                          <div className="muted" style={{ marginTop: 2 }}>
                            Verified
                          </div>
                        ) : null}
                      </div>
                      <div className="certStatus">
                        <div className={st === "green" ? "dotGreen" : "dotAmber"} />
                      </div>
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
