"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  currentPhoto: string | null;
  workerId: string;
};

function profilePhotoSrc(photo: string | null, workerId: string): string | null {
  if (!photo) return null;
  if (photo.startsWith("local:") || photo.startsWith("azure:")) {
    return `/api/worker/profile/${encodeURIComponent(workerId)}/photo`;
  }
  return photo;
}

export function ProfilePhotoUploader({ currentPhoto, workerId }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const src = profilePhotoSrc(currentPhoto, workerId);

  async function onUpload() {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/worker/profile/photo", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not upload profile photo.");
        return;
      }
      setFile(null);
      router.refresh();
    } catch {
      setError("Could not upload profile photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Profile photo"
            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border-tertiary)" }}
          />
        ) : (
          <span className="muted" style={{ fontSize: 12 }}>
            No profile photo
          </span>
        )}
        <input
          className="inputField"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={uploading}
        />
        <button type="button" className="btnSecondary" onClick={() => void onUpload()} disabled={!file || uploading}>
          {uploading ? "Uploading..." : "Upload photo"}
        </button>
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        JPEG, PNG, or WebP up to 6 MB.
      </div>
      {error ? (
        <div role="alert" style={{ color: "#b91c1c", fontSize: 12 }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
