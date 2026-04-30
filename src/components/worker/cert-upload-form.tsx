"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CertUploadForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setMessage({ type: "err", text: "Choose a PDF or image file." });
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/worker/certifications/upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Upload failed." });
        return;
      }
      setMessage({ type: "ok", text: "Certification uploaded." });
      form.reset();
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Network error." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 12, width: "100%", minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>Upload a cert</div>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="muted" style={{ fontSize: 11 }}>
          Name (e.g. OSHA 30)
        </span>
        <input
          name="name"
          required
          maxLength={120}
          className="certUploadInput"
          placeholder="OSHA 30"
          disabled={pending}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="muted" style={{ fontSize: 11 }}>
          Issuing body (optional)
        </span>
        <input name="issuingBody" maxLength={120} className="certUploadInput" placeholder="OSHA" disabled={pending} />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="muted" style={{ fontSize: 11 }}>
            Issue date
          </span>
          <input name="issueDate" type="date" className="certUploadInput" disabled={pending} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="muted" style={{ fontSize: 11 }}>
            Expiry date
          </span>
          <input name="expiryDate" type="date" className="certUploadInput" disabled={pending} />
        </label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="muted" style={{ fontSize: 11 }}>
          File (PDF, JPEG, PNG, WebP — max 10 MB)
        </span>
        <input
          name="file"
          type="file"
          className="certUploadFileInput"
          accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
          required
          disabled={pending}
        />
      </label>
      {message ? (
        <p style={{ fontSize: 12, color: message.type === "ok" ? "#166534" : "#b91c1c" }} role="status">
          {message.text}
        </p>
      ) : null}
      <button type="submit" className="btnPrimary" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Uploading…" : "Upload certification"}
      </button>
    </form>
  );
}
