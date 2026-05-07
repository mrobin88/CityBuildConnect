"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TradeFilterChips } from "@/components/employer/trade-filter-chips";

export type BrowseWorkerRow = {
  userId: string;
  name: string | null;
  trade: string;
  apprenticeYear: number | null;
  totalHours: number;
  certNames: string[];
  profilePhoto: string | null;
};

export type BrowseJobRow = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  openSlots: number;
  filledPct: number;
  filledLabel: string;
};

export type BrowseStats = {
  availableWorkers: number;
  placementsYtd: number;
  avgHours: number;
};

type Props = {
  workers: BrowseWorkerRow[];
  jobs: BrowseJobRow[];
  stats: BrowseStats;
  certPreview: { name: string; expiryLabel: string; status: "green" | "amber" }[];
};

const AVATAR_CLASS = ["avBlue", "avTeal", "avAmber", "avPurple"] as const;
const PAGE_SIZE = 12;

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

function workerPhotoSrc(profilePhoto: string | null, userId: string): string | null {
  if (!profilePhoto) return null;
  if (profilePhoto.startsWith("http://") || profilePhoto.startsWith("https://")) return profilePhoto;
  return `/api/worker/profile/${encodeURIComponent(userId)}/photo`;
}

export function BrowseEmployersClient({ workers, jobs, stats, certPreview }: Props) {
  const router = useRouter();
  const [trade, setTrade] = useState("All trades");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return workers.filter((w) => {
      const tradeMatch = trade === "All trades" || w.trade.toLowerCase() === trade.toLowerCase();
      if (!tradeMatch) return false;
      if (!lower) return true;
      const certMatch = w.certNames.some((c) => c.toLowerCase().includes(lower));
      return (
        (w.name ?? "").toLowerCase().includes(lower) ||
        w.trade.toLowerCase().includes(lower) ||
        certMatch
      );
    });
  }, [workers, trade, query]);

  const visibleWorkers = filtered.slice(0, visibleCount);
  const hasMoreWorkers = visibleWorkers.length < filtered.length;
  const featuredWorker = visibleWorkers[0];
  const featuredWorkerPhoto = featuredWorker ? workerPhotoSrc(featuredWorker.profilePhoto, featuredWorker.userId) : null;

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Find people ready to work</h1>
        <div className="topbarActions">
          <button type="button" className="btnSecondary" onClick={() => searchRef.current?.focus()}>
            Filter
          </button>
          <Link href="/employer/postings#new-posting" className="btnPrimary">
            + Post opening
          </Link>
        </div>
      </header>

      <TradeFilterChips
        active={trade}
        onChange={(next) => {
          setTrade(next);
          setVisibleCount(PAGE_SIZE);
        }}
      />

      <div className="content">
        <div className="colMain">
          <div className="statRow">
            <div className="stat">
              <div className="statLabel">Available workers</div>
              <div className="statValue">{stats.availableWorkers}</div>
              <div className="statDelta">In directory</div>
            </div>
            <div className="stat">
              <div className="statLabel">Placements YTD</div>
              <div className="statValue">{stats.placementsYtd}</div>
              <div className="statDelta">Applications marked hired</div>
            </div>
            <div className="stat">
              <div className="statLabel">Avg hours logged</div>
              <div className="statValue">{stats.avgHours.toLocaleString()}</div>
              <div className="statDelta">Across roster</div>
            </div>
          </div>

          {featuredWorker ? (
            <div className="card">
              <div className="cardHeader">
                <span className="cardTitle">Worker spotlight</span>
                <span className="muted">Someone ready for a real shot</span>
              </div>
              <div className="cardBody" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {featuredWorkerPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featuredWorkerPhoto}
                    alt=""
                    style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border-tertiary)" }}
                  />
                ) : (
                  <div className={`avatar ${AVATAR_CLASS[0]}`} style={{ width: 48, height: 48 }}>
                    {initials(featuredWorker.name)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div className="workerName" style={{ fontSize: 15 }}>
                    {featuredWorker.name ?? "Worker"}
                  </div>
                  <div className="workerTrade" style={{ marginTop: 2 }}>
                    {featuredWorker.trade}
                    {featuredWorker.apprenticeYear != null ? ` · Year ${featuredWorker.apprenticeYear}` : ""}
                    {" · "}
                    {featuredWorker.totalHours.toLocaleString()} hours
                  </div>
                  <div className="workerMeta" style={{ marginTop: 6 }}>
                    <span className="tag tagGreen">Available now</span>
                    {featuredWorker.certNames.slice(0, 2).map((c) => (
                      <span key={c} className="tag tagBlue">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                  <Link
                    href={`/employer/messages?with=${encodeURIComponent(featuredWorker.userId)}`}
                    className="btnSecondary"
                    style={{ fontSize: 12, padding: "7px 12px", textDecoration: "none", textAlign: "center" }}
                  >
                    Message
                  </Link>
                  <Link
                    href={`/profiles/${encodeURIComponent(featuredWorker.userId)}`}
                    className="btnSecondary"
                    style={{ fontSize: 12, padding: "7px 12px", textDecoration: "none", textAlign: "center" }}
                  >
                    View profile
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Worker directory</span>
              <span className="muted">{filtered.length} results</span>
            </div>
            <div className="cardBody" style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Search by name, trade, or cert..."
                className="inputField"
              />
            </div>
            {filtered.length === 0 ? (
              <div className="cardBody muted">No workers match this trade yet. Try widening filters to find more people ready to jump in.</div>
            ) : (
              visibleWorkers.map((w, i) => (
                <div
                  key={w.userId}
                  className="workerCard workerCardInteractive"
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/profiles/${encodeURIComponent(w.userId)}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/profiles/${encodeURIComponent(w.userId)}`);
                    }
                  }}
                >
                  {workerPhotoSrc(w.profilePhoto, w.userId) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={workerPhotoSrc(w.profilePhoto, w.userId) ?? ""}
                      alt=""
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border-tertiary)" }}
                    />
                  ) : (
                    <div className={`avatar ${AVATAR_CLASS[i % AVATAR_CLASS.length]}`}>{initials(w.name)}</div>
                  )}
                  <div className="workerInfo">
                    <div className="workerName">{w.name ?? "Worker"}</div>
                    <div className="workerTrade">
                      {w.trade}
                      {w.apprenticeYear != null ? ` · Year ${w.apprenticeYear}` : ""}
                    </div>
                    <div className="workerMeta">
                      <span className="tag tagGreen">Available</span>
                      {w.certNames.slice(0, 3).map((c) => (
                        <span key={c} className="tag tagBlue">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <div className="workerHours">
                      <div className="hoursNum">{w.totalHours.toLocaleString()}</div>
                      <div>hrs logged</div>
                    </div>
                    <Link
                      href={`/employer/messages?with=${encodeURIComponent(w.userId)}`}
                      className="btnSecondary"
                      style={{ fontSize: 11, padding: "5px 10px", textDecoration: "none", textAlign: "center" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Message
                    </Link>
                  </div>
                </div>
              ))
            )}
            {hasMoreWorkers ? (
              <div className="cardBody" style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                <button type="button" className="btnSecondary" style={{ width: "100%" }} onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
                  Load more candidates
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="colSide">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Active job openings</span>
            </div>
            <div className="cardBody" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {jobs.length === 0 ? <div className="muted">No open roles yet.</div> : null}
              {jobs.map((j) => (
                <div key={j.id} className="jobItem">
                  <div className="jobTitle">{j.title}</div>
                  <div className="jobCo">
                    {j.companyName} · {j.location}
                  </div>
                  <div className="jobBarBg">
                    <div className="jobBar" style={{ width: `${j.filledPct}%` }} />
                  </div>
                  <div className="muted" style={{ marginTop: 3 }}>
                    {j.filledLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Cert wallet preview</span>
            </div>
            <div className="cardBody" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {certPreview.map((c) => (
                <div key={c.name} className="certItem">
                  <div className="certIcon">🪪</div>
                  <div>
                    <div className="certName">{c.name}</div>
                    <div className="certExp">{c.expiryLabel}</div>
                  </div>
                  <div className="certStatus">
                    <div className={c.status === "green" ? "dotGreen" : "dotAmber"} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
