"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type RosterRow = {
  workerId: string;
  workerName: string;
  workerTrade: string;
  totalHours: number;
  latestPlacementLabel: string | null;
  placementCount: number;
  contactStatus: string;
  tags: string[];
  privateNotes: string | null;
  lastContactAt: string | null;
};

type Props = {
  initialRows: RosterRow[];
};

const STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "OUTREACH", label: "Outreach" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
] as const;

function toTagsInput(tags: string[]): string {
  return tags.join(", ");
}

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function RosterManager({ initialRows }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState<string | null>(null);
  const [busyWorkerId, setBusyWorkerId] = useState<string | null>(null);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.contactStatus, (counts.get(row.contactStatus) ?? 0) + 1);
    }
    return counts;
  }, [rows]);

  async function saveRow(workerId: string, payload: { contactStatus: string; tags: string[]; privateNotes: string | null; lastContactAt: string | null }) {
    setError(null);
    setBusyWorkerId(workerId);
    try {
      const res = await fetch(`/api/employer/roster/${encodeURIComponent(workerId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        rosterEntry?: { contactStatus: string; tags: string[]; privateNotes: string | null; lastContactAt: string | null };
      };

      if (!res.ok || !data.rosterEntry) {
        setError(data.error ?? "Could not save roster details.");
        return;
      }

      setRows((prev) =>
        prev.map((row) =>
          row.workerId === workerId
            ? {
                ...row,
                contactStatus: data.rosterEntry?.contactStatus ?? row.contactStatus,
                tags: data.rosterEntry?.tags ?? row.tags,
                privateNotes: data.rosterEntry?.privateNotes ?? row.privateNotes,
                lastContactAt: data.rosterEntry?.lastContactAt ?? row.lastContactAt,
              }
            : row
        )
      );
    } catch {
      setError("Could not save roster details.");
    } finally {
      setBusyWorkerId(null);
    }
  }

  if (rows.length === 0) {
    return <p className="muted">No workers in your roster yet. Add candidates from Browse workers or hire from Job postings.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="workerMeta">
        <span className="tag tagBlue">{rows.length} people in roster</span>
        <span className="tag tagGray">New: {statusCounts.get("NEW") ?? 0}</span>
        <span className="tag tagGray">Contacted: {statusCounts.get("CONTACTED") ?? 0}</span>
        <span className="tag tagGray">Active: {statusCounts.get("ACTIVE") ?? 0}</span>
      </div>

      {error ? (
        <p style={{ color: "#b91c1c", fontSize: 12 }} role="alert">
          {error}
        </p>
      ) : null}

      {rows.map((row) => (
        <RosterCard key={row.workerId} row={row} busy={busyWorkerId === row.workerId} onSave={saveRow} />
      ))}
    </div>
  );
}

function RosterCard({
  row,
  busy,
  onSave,
}: {
  row: RosterRow;
  busy: boolean;
  onSave: (workerId: string, payload: { contactStatus: string; tags: string[]; privateNotes: string | null; lastContactAt: string | null }) => Promise<void>;
}) {
  const [contactStatus, setContactStatus] = useState(row.contactStatus);
  const [tagsInput, setTagsInput] = useState(toTagsInput(row.tags));
  const [notes, setNotes] = useState(row.privateNotes ?? "");
  const [lastContactAt, setLastContactAt] = useState(row.lastContactAt ? row.lastContactAt.slice(0, 10) : "");

  return (
    <div className="workerCard" style={{ alignItems: "stretch" }}>
      <div className="workerInfo" style={{ minWidth: 0 }}>
        <div className="workerName">{row.workerName}</div>
        <div className="workerTrade" style={{ marginTop: 2 }}>
          {row.workerTrade} · {row.totalHours.toLocaleString()} hrs logged
        </div>
        <div className="workerMeta" style={{ marginTop: 6 }}>
          <span className="tag tagGray">{row.placementCount} hired placement{row.placementCount === 1 ? "" : "s"}</span>
          {row.latestPlacementLabel ? <span className="tag tagBlue">{row.latestPlacementLabel}</span> : null}
        </div>

        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span className="muted">Contact status</span>
            <select className="inputField" value={contactStatus} onChange={(e) => setContactStatus(e.target.value)} disabled={busy}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span className="muted">Tags (comma separated)</span>
            <input
              className="inputField"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="reliable, safety-focused, union-ready"
              disabled={busy}
            />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span className="muted">Last contact date</span>
            <input className="inputField" type="date" value={lastContactAt} onChange={(e) => setLastContactAt(e.target.value)} disabled={busy} />
          </label>

          <label style={{ display: "grid", gap: 4 }}>
            <span className="muted">Private notes</span>
            <textarea
              className="msgTextarea"
              rows={3}
              style={{ minHeight: 74 }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes visible only to your organization."
              disabled={busy}
            />
          </label>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 148 }}>
        <Link href={`/employer/messages?with=${encodeURIComponent(row.workerId)}`} className="btnSecondary" style={{ textDecoration: "none", textAlign: "center" }}>
          Message
        </Link>
        <Link href={`/profiles/${encodeURIComponent(row.workerId)}`} className="btnSecondary" style={{ textDecoration: "none", textAlign: "center" }}>
          View profile
        </Link>
        <button
          type="button"
          className="btnPrimary"
          onClick={() =>
            onSave(row.workerId, {
              contactStatus,
              tags: parseTags(tagsInput),
              privateNotes: notes.trim() || null,
              lastContactAt: lastContactAt ? new Date(lastContactAt).toISOString() : null,
            })
          }
          disabled={busy}
        >
          {busy ? "Saving..." : "Save details"}
        </button>
      </div>
    </div>
  );
}
