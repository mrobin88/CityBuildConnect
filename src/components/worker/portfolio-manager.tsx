"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type PortfolioRow = {
  id: string;
  title: string;
  description: string | null;
  hasImage: boolean;
  workSiteId: string | null;
  workSiteName: string | null;
  sortOrder: number;
};

type Props = {
  initialItems: PortfolioRow[];
  jobSites: { id: string; projectName: string }[];
};

export function PortfolioManager({ initialItems, jobSites }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    setPending(true);
    try {
      const ws = fd.get("workSiteId");
      const res = await fetch("/api/worker/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          description: fd.get("description") || null,
          workSiteId: ws && String(ws) ? String(ws) : null,
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

  async function uploadImage(itemId: string, file: File | null) {
    if (!file || file.size === 0) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    try {
      const res = await fetch(`/api/worker/portfolio/${encodeURIComponent(itemId)}/image`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Image upload failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    }
  }

  async function removeItem(id: string) {
    if (!confirm("Remove this portfolio entry?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/worker/portfolio/${encodeURIComponent(id)}`, { method: "DELETE" });
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

      {initialItems.length === 0 ? (
        <p className="muted" style={{ marginBottom: 12, lineHeight: 1.45 }}>
          Build a visual portfolio of work you&apos;re proud of—rough-ins, finished installs, safety setups, and more.
        </p>
      ) : (
        <div className="portfolioGrid">
          {initialItems.map((p) => (
            <div key={p.id} className="portfolioCard">
              <div className="portfolioThumb">
                {p.hasImage ? (
                  // Authenticated API route; next/image not applicable
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/worker/portfolio/${p.id}/image`} alt="" className="portfolioImg" />
                ) : (
                  <div className="portfolioPlaceholder">No photo</div>
                )}
              </div>
              <div className="portfolioCardBody">
                <div className="workerName">{p.title}</div>
                {p.workSiteName ? (
                  <div className="muted" style={{ marginTop: 4 }}>
                    {p.workSiteName}
                  </div>
                ) : null}
                {p.description ? (
                  <p className="muted" style={{ marginTop: 8, lineHeight: 1.45 }}>
                    {p.description}
                  </p>
                ) : null}
                <label className="portfolioFileRow">
                  <span className="btnSecondary" style={{ fontSize: 11, padding: "5px 10px" }}>
                    {p.hasImage ? "Replace photo" : "Add photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="portfolioFileInput"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      e.target.value = "";
                      void uploadImage(p.id, f);
                    }}
                  />
                </label>
                <button type="button" className="btnSecondary" style={{ marginTop: 8, fontSize: 11 }} onClick={() => void removeItem(p.id)}>
                  Remove entry
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="jobSiteAddForm" onSubmit={(e) => void addItem(e)}>
        <div className="cardTitle" style={{ marginBottom: 8, marginTop: initialItems.length ? 16 : 0 }}>
          Add portfolio piece
        </div>
        <label className="portfolioLabel">
          Title *
          <input name="title" required maxLength={200} className="certUploadInput" disabled={pending} />
        </label>
        <label className="portfolioLabel">
          Link to job site (optional)
          <select name="workSiteId" className="certUploadInput" disabled={pending}>
            <option value="">— None —</option>
            {jobSites.map((j) => (
              <option key={j.id} value={j.id}>
                {j.projectName}
              </option>
            ))}
          </select>
        </label>
        <label className="portfolioLabel">
          Description
          <textarea name="description" rows={3} className="msgTextarea" style={{ minHeight: 72 }} disabled={pending} />
        </label>
        <button type="submit" className="btnPrimary" disabled={pending} style={{ marginTop: 8 }}>
          {pending ? "Saving…" : "Add to portfolio"}
        </button>
      </form>
    </div>
  );
}
