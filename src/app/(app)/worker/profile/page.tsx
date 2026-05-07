import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { certExpiryStatus } from "@/lib/cert-status";
import { defaultHomeForRole } from "@/lib/routes";
import { CertUploadForm } from "@/components/worker/cert-upload-form";
import { JobSitesManager, type JobSiteRow } from "@/components/worker/job-sites-manager";
import { PortfolioManager, type PortfolioRow } from "@/components/worker/portfolio-manager";
import { ProfileVisibilityToggle } from "@/components/worker/profile-visibility-toggle";
import { ShareProfileButton } from "@/components/worker/share-profile-button";
import { ProfilePhotoUploader } from "@/components/worker/profile-photo-uploader";

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
      jobSiteExperiences: { orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] },
      portfolioItems: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: { workSite: { select: { id: true, projectName: true } } },
      },
    },
  });

  if (!profile) {
    return (
      <div className="pageStack">
        <header className="topbar">
          <h1 className="pageTitle">Worker profile</h1>
        </header>
        <div className="content">
          <div className="card">
            <div className="cardBody" style={{ display: "grid", gap: 10 }}>
              <p className="muted">No worker profile yet. Set up your trade profile to start applying to jobs.</p>
              <Link href="/worker/profile/setup" className="btnPrimary" style={{ width: "fit-content" }}>
                Create profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((profile.totalHours / JOURNEY_HOURS_TARGET) * 100));

  const jobSitesPayload: JobSiteRow[] = profile.jobSiteExperiences.map((j) => ({
    id: j.id,
    projectName: j.projectName,
    location: j.location,
    companyName: j.companyName,
    roleOnSite: j.roleOnSite,
    startDate: j.startDate?.toISOString() ?? null,
    endDate: j.endDate?.toISOString() ?? null,
    notes: j.notes,
    sortOrder: j.sortOrder,
  }));

  const portfolioPayload: PortfolioRow[] = profile.portfolioItems.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    hasImage: Boolean(p.imageUrl),
    workSiteId: p.workSiteId,
    workSiteName: p.workSite?.projectName ?? null,
    sortOrder: p.sortOrder,
  }));

  const jobSiteOptions = profile.jobSiteExperiences.map((j) => ({ id: j.id, projectName: j.projectName }));
  const workerPhotoSrc = profile.profilePhoto
    ? profile.profilePhoto.startsWith("http://") || profile.profilePhoto.startsWith("https://")
      ? profile.profilePhoto
      : `/api/worker/profile/${encodeURIComponent(profile.userId)}/photo`
    : null;

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Your profile</h1>
        <div className="topbarActions">
          <Link href="/worker/profile/setup" className="btnSecondary">
            Edit
          </Link>
          {profile.isPublic ? <ShareProfileButton profileUrl={`/profiles/${session.user.id}`} /> : null}
        </div>
      </header>

      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Digital resume</span>
              <span className="tag tagGreen">Build Connect graduate profile</span>
            </div>
            <div className="cardBody" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              {workerPhotoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={workerPhotoSrc}
                  alt={`${profile.user.name ?? "Worker"} profile photo`}
                  style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border-tertiary)" }}
                />
              ) : (
                <div className="avatar avBlue" style={{ width: 56, height: 56, fontSize: 18 }}>
                  {(profile.user.name ?? "?")
                    .split(/\s+/)
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
              )}
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
                <div className="workerMeta" style={{ marginTop: 8 }}>
                  <span className="tag tagBlue">Pre-apprenticeship pathway</span>
                  <span className="tag tagGreen">Ready for the next call</span>
                  {profile.availableFrom ? (
                    <span className="tag tagAmber">
                      Available {profile.availableFrom.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="cardBody" style={{ paddingTop: 0 }}>
              <ProfilePhotoUploader currentPhoto={profile.profilePhoto} workerId={profile.userId} />
            </div>
            <div className="cardBody" style={{ paddingTop: 0 }}>
              <ProfileVisibilityToggle initialIsPublic={profile.isPublic} />
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

          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Job sites & projects</span>
              <span className="muted">Where you&apos;ve worked</span>
            </div>
            <div className="cardBody">
              <JobSitesManager initialSites={jobSitesPayload} />
            </div>
          </div>

          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Portfolio</span>
              <span className="muted">Show your best work</span>
            </div>
            <div className="cardBody">
              <PortfolioManager initialItems={portfolioPayload} jobSites={jobSiteOptions} />
            </div>
          </div>
        </div>

        <div className="colSide">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Cert wallet</span>
            </div>
            <div className="cardBody certWalletBody">
              {profile.certifications.length === 0 ? (
                <div className="muted certWalletHint">Upload certs so employers can verify you quickly.</div>
              ) : (
                profile.certifications.map((c) => {
                  const st = certExpiryStatus(c.expiryDate);
                  const exp = c.expiryDate
                    ? `Exp. ${c.expiryDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
                    : "No expiry on file";
                  return (
                    <div key={c.id} className="certItem">
                      <div className="certIcon">🪪</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="certName">{c.name}</div>
                        <div className="certExp">{exp}</div>
                        {c.documentUrl ? (
                          <a
                            className="certDocLink"
                            href={`/api/worker/certifications/${c.id}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View uploaded file
                          </a>
                        ) : null}
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
              <details className="certUploadDrawer" open={profile.certifications.length === 0}>
                <summary className="certUploadDrawerToggle">Add certification</summary>
                <CertUploadForm />
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
