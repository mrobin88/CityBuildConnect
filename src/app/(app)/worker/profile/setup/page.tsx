"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkerProfileSetupPage() {
  const router = useRouter();
  const [trade, setTrade] = useState("");
  const [apprenticeYear, setApprenticeYear] = useState("");
  const [unionLocal, setUnionLocal] = useState("");
  const [location, setLocation] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/worker/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade,
          apprenticeYear: apprenticeYear ? Number(apprenticeYear) : null,
          unionLocal: unionLocal || null,
          location: location || null,
          availableFrom: availableFrom || null,
          bio: bio || null,
          isPublic,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save profile.");
        return;
      }
      if (profileImageFile) {
        const fd = new FormData();
        fd.set("file", profileImageFile);
        const photoRes = await fetch("/api/worker/profile/photo", {
          method: "POST",
          body: fd,
        });
        const photoData = (await photoRes.json().catch(() => ({}))) as { error?: string };
        if (!photoRes.ok) {
          setError(photoData.error ?? "Profile saved, but photo upload failed.");
          return;
        }
      }
      router.push("/worker/profile");
      router.refresh();
    } catch {
      setError("Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Set up your worker profile</h1>
      </header>

      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Profile details</span>
            </div>
            <form className="cardBody" onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
              <label className="portfolioLabel">
                Trade *
                <input
                  className="inputField"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  placeholder="Electrical, Plumbing, Ironwork..."
                  required
                  disabled={saving}
                />
              </label>
              <label className="portfolioLabel">
                Apprentice year
                <input
                  className="inputField"
                  type="number"
                  min={1}
                  max={8}
                  value={apprenticeYear}
                  onChange={(e) => setApprenticeYear(e.target.value)}
                  disabled={saving}
                />
              </label>
              <label className="portfolioLabel">
                Union local
                <input
                  className="inputField"
                  value={unionLocal}
                  onChange={(e) => setUnionLocal(e.target.value)}
                  disabled={saving}
                />
              </label>
              <label className="portfolioLabel">
                City / location
                <input
                  className="inputField"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                  disabled={saving}
                />
              </label>
              <label className="portfolioLabel">
                Available from
                <input
                  className="inputField"
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  disabled={saving}
                />
              </label>
              <label className="portfolioLabel">
                Short bio and work goals
                <textarea
                  className="inputField"
                  rows={5}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={saving}
                />
              </label>
              <label className="portfolioLabel">
                Profile photo
                <input
                  className="inputField"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setProfileImageFile(e.target.files?.[0] ?? null)}
                  disabled={saving}
                />
                <span className="muted" style={{ fontSize: 12 }}>
                  JPEG, PNG, or WebP up to 6 MB.
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} disabled={saving} />
                <span>List my profile in worker directory</span>
              </label>
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                You can change this later in your profile settings.
              </p>

              {error ? <p style={{ color: "#b91c1c", fontSize: 12 }}>{error}</p> : null}

              <button type="submit" className="btnPrimary" disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
