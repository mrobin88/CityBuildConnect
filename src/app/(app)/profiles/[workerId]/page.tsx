import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { certExpiryStatus } from "@/lib/cert-status";
import { defaultHomeForRole } from "@/lib/routes";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { workerId: string };
};

export default async function WorkerPublicProfilePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== "WORKER" && session.user.role !== "EMPLOYER") {
    redirect(defaultHomeForRole(session.user.role));
  }

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: params.workerId },
    include: {
      user: true,
      certifications: { orderBy: { expiryDate: "asc" } },
      jobSiteExperiences: { orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] },
      portfolioItems: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!profile) notFound();
  if (!profile.isPublic && session.user.id !== profile.userId) {
    notFound();
  }
  const workerPhotoSrc = profile.profilePhoto
    ? profile.profilePhoto.startsWith("http://") || profile.profilePhoto.startsWith("https://")
      ? profile.profilePhoto
      : `/api/worker/profile/${encodeURIComponent(profile.userId)}/photo`
    : null;

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">{profile.user.name ?? "Worker profile"}</h1>
      </header>

      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Worker snapshot</span>
              <span className="muted">{profile.trade}</span>
            </div>
            <div className="cardBody">
              {workerPhotoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={workerPhotoSrc}
                  alt={`${profile.user.name ?? "Worker"} profile photo`}
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border-tertiary)", marginBottom: 10 }}
                />
              ) : null}
              <div className="workerTrade">
                {profile.trade}
                {profile.apprenticeYear != null ? ` · Year ${profile.apprenticeYear}` : ""}
                {profile.unionLocal ? ` · ${profile.unionLocal}` : ""}
              </div>
              {profile.user.location ? <div className="muted" style={{ marginTop: 8 }}>{profile.user.location}</div> : null}
              {profile.bio ? (
                <p className="muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
                  {profile.bio}
                </p>
              ) : null}
              <div className="workerMeta" style={{ marginTop: 10 }}>
                <span className="tag tagBlue">{profile.totalHours.toLocaleString()} total hours</span>
                {profile.availableFrom ? (
                  <span className="tag tagGreen">
                    Available {profile.availableFrom.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Job-site history</span>
            </div>
            <div className="cardBody">
              {profile.jobSiteExperiences.length === 0 ? (
                <div className="muted">No job-site history added yet.</div>
              ) : (
                <ul className="jobSiteList">
                  {profile.jobSiteExperiences.map((s) => (
                    <li key={s.id} className="jobSiteCard">
                      <div className="workerName">{s.projectName}</div>
                      <div className="workerTrade" style={{ marginTop: 3 }}>
                        {[s.companyName, s.location].filter(Boolean).join(" · ") || "—"}
                      </div>
                      {s.roleOnSite ? <div className="muted" style={{ marginTop: 4 }}>{s.roleOnSite}</div> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="colSide">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Certifications</span>
            </div>
            <div className="cardBody" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {profile.certifications.length === 0 ? (
                <div className="muted">No certifications listed.</div>
              ) : (
                profile.certifications.map((c) => {
                  const st = certExpiryStatus(c.expiryDate);
                  return (
                    <div key={c.id} className="certItem">
                      <div className="certIcon">🪪</div>
                      <div>
                        <div className="certName">{c.name}</div>
                        <div className="certExp">
                          {c.expiryDate
                            ? `Exp. ${c.expiryDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
                            : "No expiry on file"}
                        </div>
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

          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Portfolio highlights</span>
            </div>
            <div className="cardBody">
              {profile.portfolioItems.length === 0 ? (
                <div className="muted">No portfolio entries yet.</div>
              ) : (
                <div className="portfolioGrid">
                  {profile.portfolioItems.slice(0, 6).map((p) => (
                    <div key={p.id} className="portfolioCard">
                      <div className="portfolioThumb">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/worker/portfolio/${p.id}/image`} alt="" className="portfolioImg" />
                        ) : (
                          <div className="portfolioPlaceholder">No photo</div>
                        )}
                      </div>
                      <div className="portfolioCardBody">
                        <div className="workerName">{p.title}</div>
                        {p.description ? <p className="muted" style={{ marginTop: 6 }}>{p.description}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
