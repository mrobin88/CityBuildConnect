"use client";

import { useMemo, useState } from "react";
import type { ApplicationStatus, JobPostingStatus } from "@prisma/client";

export type EmployerApplicationRow = {
  id: string;
  status: ApplicationStatus;
  workerName: string;
  trade: string;
  totalHours: number;
  certNames: string[];
  createdAtLabel: string;
};

export type EmployerPostingRow = {
  id: string;
  title: string;
  trade: string;
  location: string;
  openSlots: number;
  hoursPerWeek: number | null;
  status: JobPostingStatus;
  applicantCount: number;
  createdAtLabel: string;
  applications: EmployerApplicationRow[];
};

type Props = {
  postings: EmployerPostingRow[];
};

const statusActions: ApplicationStatus[] = ["INTERESTED", "INTERVIEW", "OFFER", "HIRED", "DECLINED"];

export function EmployerPostingsClient({ postings }: Props) {
  const [items, setItems] = useState(postings);
  const [createBusy, setCreateBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [trade, setTrade] = useState("");
  const [location, setLocation] = useState("");
  const [openSlots, setOpenSlots] = useState("1");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [description, setDescription] = useState("");

  const summary = useMemo(() => {
    const openPostings = items.filter((p) => p.status === "OPEN").length;
    const applicants = items.reduce((sum, p) => sum + p.applicantCount, 0);
    const hired = items.reduce(
      (sum, p) => sum + p.applications.filter((a) => a.status === "HIRED").length,
      0
    );
    return { openPostings, applicants, hired };
  }, [items]);

  async function createPosting(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreateBusy(true);
    try {
      const res = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          trade,
          location,
          openSlots: Number(openSlots),
          hoursPerWeek: Number(hoursPerWeek),
          description,
        }),
      });
      const data = (await res.json()) as { error?: string; jobId?: string };
      if (!res.ok || !data.jobId) {
        setError(data.error ?? "Could not create posting.");
        return;
      }

      setItems((prev) => [
        {
          id: data.jobId!,
          title,
          trade,
          location,
          openSlots: Number(openSlots),
          hoursPerWeek: Number(hoursPerWeek),
          status: "OPEN",
          applicantCount: 0,
          createdAtLabel: new Date().toLocaleDateString(),
          applications: [],
        },
        ...prev,
      ]);

      setTitle("");
      setTrade("");
      setLocation("");
      setOpenSlots("1");
      setHoursPerWeek("40");
      setDescription("");
    } catch {
      setError("Could not create posting.");
    } finally {
      setCreateBusy(false);
    }
  }

  async function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    setError(null);
    setStatusBusyId(applicationId);
    try {
      const res = await fetch(`/api/employer/applications/${applicationId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not update status.");
        return;
      }

      setItems((prev) =>
        prev.map((posting) => ({
          ...posting,
          applications: posting.applications.map((app) =>
            app.id === applicationId ? { ...app, status } : app
          ),
        }))
      );
    } catch {
      setError("Could not update status.");
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">My postings</h1>
      </header>

      <div className="content">
        <div className="colMain">
          <div className="statRow">
            <div className="stat">
              <div className="statLabel">Open postings</div>
              <div className="statValue">{summary.openPostings}</div>
            </div>
            <div className="stat">
              <div className="statLabel">Applicants</div>
              <div className="statValue">{summary.applicants}</div>
            </div>
            <div className="stat">
              <div className="statLabel">Hired</div>
              <div className="statValue">{summary.hired}</div>
            </div>
          </div>

          {error ? (
            <div className="card">
              <div className="cardBody">
                <p style={{ fontSize: 12, color: "#b91c1c" }}>{error}</p>
              </div>
            </div>
          ) : null}

          {items.length === 0 ? (
            <div className="card">
              <div className="cardBody muted">No postings yet. Create your first opening to start hiring.</div>
            </div>
          ) : (
            items.map((posting) => (
              <div className="card" key={posting.id}>
                <div className="cardHeader">
                  <span className="cardTitle">
                    {posting.title} · {posting.trade}
                  </span>
                  <span className="muted">
                    {posting.location} · {posting.applicantCount} applicants
                  </span>
                </div>
                <div className="cardBody">
                  <div className="workerMeta" style={{ marginBottom: 10 }}>
                    <span className="tag tagGray">{posting.openSlots} open slots</span>
                    {posting.hoursPerWeek != null ? (
                      <span className="tag tagBlue">{posting.hoursPerWeek} hrs/week</span>
                    ) : null}
                    <span className="tag tagGreen">{posting.status}</span>
                    <span className="tag tagAmber">Posted {posting.createdAtLabel}</span>
                  </div>

                  {posting.applications.length === 0 ? (
                    <p className="muted">No applicants yet.</p>
                  ) : (
                    posting.applications.map((app) => (
                      <div key={app.id} className="workerCard" style={{ paddingInline: 0 }}>
                        <div className="workerInfo">
                          <div className="workerName">{app.workerName}</div>
                          <div className="workerTrade">
                            {app.trade} · {app.totalHours.toLocaleString()} hrs · Applied {app.createdAtLabel}
                          </div>
                          <div className="workerMeta">
                            <span className="tag tagBlue">Status: {app.status}</span>
                            {app.certNames.slice(0, 3).map((cert) => (
                              <span className="tag tagGray" key={cert}>
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {statusActions.map((status) => (
                            <button
                              key={status}
                              type="button"
                              className="btnSecondary"
                              disabled={app.status === status || statusBusyId === app.id}
                              onClick={() => updateApplicationStatus(app.id, status)}
                            >
                              {status.toLowerCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="colSide">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Create opening</span>
            </div>
            <form className="cardBody" onSubmit={createPosting} style={{ display: "grid", gap: 8 }}>
              <input className="inputField" placeholder="Job title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <input className="inputField" placeholder="Trade (Electrical, Plumbing...)" value={trade} onChange={(e) => setTrade(e.target.value)} required />
              <input className="inputField" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
              <input className="inputField" type="number" min={1} value={openSlots} onChange={(e) => setOpenSlots(e.target.value)} required />
              <input className="inputField" type="number" min={1} max={80} value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} />
              <textarea
                className="inputField"
                placeholder="Role details and requirements"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <button type="submit" className="btnPrimary" disabled={createBusy}>
                {createBusy ? "Posting..." : "Post opening"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
