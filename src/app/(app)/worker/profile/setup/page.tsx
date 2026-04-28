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
              <input
                className="inputField"
                placeholder="Trade (Electrical, Plumbing, Ironwork...)"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                required
              />
              <input
                className="inputField"
                type="number"
                min={1}
                max={8}
                placeholder="Apprentice year (optional)"
                value={apprenticeYear}
                onChange={(e) => setApprenticeYear(e.target.value)}
              />
              <input
                className="inputField"
                placeholder="Union local (optional)"
                value={unionLocal}
                onChange={(e) => setUnionLocal(e.target.value)}
              />
              <input
                className="inputField"
                placeholder="City / location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <label className="muted" style={{ display: "grid", gap: 4 }}>
                Available from
                <input
                  className="inputField"
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                />
              </label>
              <textarea
                className="inputField"
                rows={5}
                placeholder="Short bio and work goals (optional)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
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
