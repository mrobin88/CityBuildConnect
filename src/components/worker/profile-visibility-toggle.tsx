"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialIsPublic: boolean;
};

export function ProfileVisibilityToggle({ initialIsPublic }: Props) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: boolean) {
    setIsPublic(next);
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/worker/profile/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; isPublic?: boolean };
      if (!res.ok) {
        setIsPublic((prev) => !prev);
        setError(data.error ?? "Could not save visibility.");
        return;
      }
      setIsPublic(data.isPublic ?? next);
      router.refresh();
    } catch {
      setIsPublic((prev) => !prev);
      setError("Could not save visibility.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={isPublic} onChange={(e) => void onChange(e.target.checked)} disabled={saving} />
        <span>{isPublic ? "Profile is public in worker directory" : "Profile is private (not listed)"}</span>
      </label>
      <div className="muted" style={{ fontSize: 12 }}>
        Private profiles are hidden from worker browse results and direct employer profile views.
      </div>
      {error ? (
        <p style={{ color: "#b91c1c", fontSize: 12 }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
