"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectType } from "@prisma/client";

type Props = {
  initial: {
    companyName: string;
    licenseNumber: string | null;
    website: string | null;
    location: string | null;
    projectTypes: ProjectType[];
  };
};

const PROJECT_TYPE_OPTIONS: Array<{ value: ProjectType; label: string }> = [
  { value: ProjectType.COMMERCIAL, label: "Commercial" },
  { value: ProjectType.RESIDENTIAL, label: "Residential" },
  { value: ProjectType.PUBLIC_WORKS, label: "Public works" },
];

export function CompanyProfileForm({ initial }: Props) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [licenseNumber, setLicenseNumber] = useState(initial.licenseNumber ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [projectTypes, setProjectTypes] = useState<Set<ProjectType>>(new Set(initial.projectTypes));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleProjectType(value: ProjectType) {
    setProjectTypes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/employer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          licenseNumber: licenseNumber || null,
          website: website || null,
          location: location || null,
          projectTypes: [...projectTypes],
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save organization profile.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not save organization profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="cardBody" onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
      <label className="portfolioLabel">
        Organization name *
        <input
          className="inputField"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          maxLength={160}
          required
          disabled={saving}
        />
      </label>

      <label className="portfolioLabel">
        License / registration number
        <input
          className="inputField"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          maxLength={120}
          placeholder="Optional"
          disabled={saving}
        />
      </label>

      <label className="portfolioLabel">
        Website
        <input
          className="inputField"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          maxLength={300}
          placeholder="https://example.org"
          disabled={saving}
        />
      </label>

      <label className="portfolioLabel">
        Location
        <input
          className="inputField"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={120}
          placeholder="City, State"
          disabled={saving}
        />
      </label>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="muted" style={{ marginBottom: 6 }}>
          Project focus
        </legend>
        <div style={{ display: "grid", gap: 6 }}>
          {PROJECT_TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={projectTypes.has(opt.value)}
                onChange={() => toggleProjectType(opt.value)}
                disabled={saving}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="muted" style={{ fontSize: 12 }}>
        Logo upload is the next step and will be added to this page.
      </div>

      {error ? (
        <p style={{ color: "#b91c1c", fontSize: 12 }} role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btnPrimary" disabled={saving} style={{ width: "fit-content" }}>
        {saving ? "Saving..." : "Save organization profile"}
      </button>
    </form>
  );
}
