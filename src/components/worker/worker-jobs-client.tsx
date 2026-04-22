"use client";

import { useMemo, useState } from "react";

export type WorkerJobRow = {
  id: string;
  title: string;
  trade: string;
  location: string;
  companyName: string;
  hoursPerWeek: number | null;
  openSlots: number;
  startDateLabel: string | null;
  description: string | null;
};

type Props = {
  jobs: WorkerJobRow[];
};

const PAGE_SIZE = 10;

export function WorkerJobsClient({ jobs }: Props) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return jobs;
    return jobs.filter((j) => {
      return (
        j.title.toLowerCase().includes(lower) ||
        j.trade.toLowerCase().includes(lower) ||
        j.location.toLowerCase().includes(lower) ||
        j.companyName.toLowerCase().includes(lower)
      );
    });
  }, [jobs, query]);

  const visibleJobs = filtered.slice(0, visibleCount);
  const hasMore = visibleJobs.length < filtered.length;

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Open jobs</h1>
        <div className="topbarActions">
          <button type="button" className="btnSecondary">
            Saved jobs
          </button>
        </div>
      </header>

      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Find your next site placement</span>
              <span className="muted">{filtered.length} openings</span>
            </div>
            <div className="cardBody" style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <input
                className="inputField"
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Search by trade, company, or location..."
              />
            </div>

            {visibleJobs.length === 0 ? (
              <div className="cardBody muted">No jobs match your search yet.</div>
            ) : (
              visibleJobs.map((job) => (
                <div key={job.id} className="workerCard workerCardInteractive" style={{ alignItems: "center" }}>
                  <div className="avatar avPurple">{job.trade.slice(0, 2).toUpperCase()}</div>
                  <div className="workerInfo">
                    <div className="workerName">{job.title}</div>
                    <div className="workerTrade">
                      {job.companyName} · {job.location}
                    </div>
                    <div className="workerMeta">
                      <span className="tag tagGreen">{job.trade}</span>
                      <span className="tag tagGray">{job.openSlots} open slots</span>
                      {job.hoursPerWeek != null ? <span className="tag tagBlue">{job.hoursPerWeek} hrs/week</span> : null}
                      {job.startDateLabel ? <span className="tag tagAmber">Starts {job.startDateLabel}</span> : null}
                    </div>
                    {job.description ? (
                      <p className="muted" style={{ marginTop: 6, lineHeight: 1.4 }}>
                        {job.description.length > 140 ? `${job.description.slice(0, 140)}...` : job.description}
                      </p>
                    ) : null}
                  </div>
                  <button type="button" className="btnPrimary">
                    Apply
                  </button>
                </div>
              ))
            )}

            {hasMore ? (
              <div className="cardBody" style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                <button type="button" className="btnSecondary" style={{ width: "100%" }} onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Load more openings
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="colSide">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Quick tips</span>
            </div>
            <div className="cardBody">
              <p className="muted" style={{ lineHeight: 1.45 }}>
                Keep your cert wallet current and profile complete. Employers prioritize candidates with verified certs and updated
                availability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
