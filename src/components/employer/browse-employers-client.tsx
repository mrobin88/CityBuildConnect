"use client";

import { useMemo, useState } from "react";
import { TradeFilterChips } from "@/components/employer/trade-filter-chips";

export type BrowseWorkerRow = {
  userId: string;
  name: string | null;
  trade: string;
  apprenticeYear: number | null;
  totalHours: number;
  certNames: string[];
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

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

export function BrowseEmployersClient({ workers, jobs, stats, certPreview }: Props) {
  const [trade, setTrade] = useState("All trades");

  const filtered = useMemo(() => {
    if (trade === "All trades") return workers;
    return workers.filter((w) => w.trade.toLowerCase() === trade.toLowerCase());
  }, [workers, trade]);

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Browse apprentices</h1>
        <div className="topbarActions">
          <button type="button" className="btnSecondary">
            Filter
          </button>
          <button type="button" className="btnPrimary">
            + Post opening
          </button>
        </div>
      </header>

      <TradeFilterChips active={trade} onChange={setTrade} />

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

          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Apprentice roster</span>
              <span className="muted">Sorted by availability</span>
            </div>
            {filtered.length === 0 ? (
              <div className="cardBody muted">No workers match this trade yet.</div>
            ) : (
              filtered.map((w, i) => (
                <div key={w.userId} className="workerCard workerCardInteractive">
                  <div className={`avatar ${AVATAR_CLASS[i % AVATAR_CLASS.length]}`}>{initials(w.name)}</div>
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
                  <div className="workerHours">
                    <div className="hoursNum">{w.totalHours.toLocaleString()}</div>
                    <div>hrs logged</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="colSide">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Active job openings</span>
            </div>
            <div className="cardBody" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
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
