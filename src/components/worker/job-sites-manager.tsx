"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type JobSiteRow = {
  id: string;
  projectName: string;
  location: string | null;
  companyName: string | null;
  roleOnSite: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  sortOrder: number;
};

type Props = { initialSites: JobSiteRow[] };

export function JobSitesManager({ initialSites }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function addSite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/worker/job-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: fd.get("projectName"),
          location: fd.get("location") || null,
          companyName: fd.get("companyName") || null,
          roleOnSite: fd.get("roleOnSite") || null,
          startDate: fd.get("startDate") || null,
          endDate: fd.get("endDate") || null,
          notes: fd.get("notes") || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Could not save.");
        return;
      }
      form.reset();
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  async function removeSite(id: string) {
    if (!confirm("Remove this job site from your profile?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/worker/job-sites/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Delete failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    }
  }

  return (
    <div>
      {error ? (
        <p style={{ color: "#b91c1c", fontSize: 12, marginBottom: 8 }} role="alert">
          {error}
        </p>
      ) : null}

      {initialSites.length === 0 ? (
        <p className="muted" style={{ marginBottom: 12, lineHeight: 1.45 }}>
          Add projects and job sites you&apos;ve worked on so employers see your field experience.
        </p>
      ) : (
        <ul className="jobSiteList">
          {initialSites.map((s) => (
            <li key={s.id} className="jobSiteCard">
              <div className="workerName">{s.projectName}</div>
              <div className="workerTrade" style={{ marginTop: 4 }}>
                {[s.companyName, s.location].filter(Boolean).join(" · ") || "—"}
              </div>
              {s.roleOnSite ? <div className="muted" style={{ marginTop: 4 }}>{s.roleOnSite}</div> : null}
              <div className="muted" style={{ marginTop: 4 }}>
                {formatRange(s.startDate, s.endDate)}
              </div>
              {s.notes ? (
                <p className="muted" style={{ marginTop: 8, lineHeight: 1.45 }}>
                  {s.notes}
                </p>
              ) : null}
              <button type="button" className="btnSecondary" style={{ marginTop: 10, fontSize: 11 }} onClick={() => void removeSite(s.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="jobSiteAddForm" onSubmit={(e) => void addSite(e)}>
        <div className="cardTitle" style={{ marginBottom: 8, marginTop: initialSites.length ? 16 : 0 }}>
          Add job site
        </div>
        <label className="portfolioLabel">
          Project / site name *
          <input name="projectName" required maxLength={200} className="certUploadInput" disabled={pending} />
        </label>
        <label className="portfolioLabel">
          Location
          <input name="location" maxLength={200} className="certUploadInput" disabled={pending} />
        </label>
        <label className="portfolioLabel">
          Company / GC
          <input name="companyName" maxLength={200} className="certUploadInput" disabled={pending} />
        </label>
        <label className="portfolioLabel">
          Your role on site
          <input name="roleOnSite" maxLength={200} className="certUploadInput" disabled={pending} />
        </label>
        <div className="portfolioTwoCol">
          <label className="portfolioLabel">
            Start
            <input name="startDate" type="date" className="certUploadInput" disabled={pending} />
          </label>
          <label className="portfolioLabel">
            End
            <input name="endDate" type="date" className="certUploadInput" disabled={pending} />
          </label>
        </div>
        <label className="portfolioLabel">
          Notes
          <textarea name="notes" rows={2} className="msgTextarea" style={{ minHeight: 56 }} disabled={pending} />
        </label>
        <button type="submit" className="btnPrimary" disabled={pending} style={{ marginTop: 8 }}>
          {pending ? "Saving…" : "Add job site"}
        </button>
      </form>
    </div>
  );
}

function formatRange(start: string | null, end: string | null): string {
  if (!start && !end) return "Dates not set";
  const a = start ? new Date(start).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "?";
  const b = end ? new Date(end).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "Present";
  return `${a} – ${b}`;
}
