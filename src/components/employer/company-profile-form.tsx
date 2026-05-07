"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectType } from "@prisma/client";

type Props = {
  initial: {
    companyName: string;
    licenseNumber: string | null;
    website: string | null;
    logo: string | null;
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
  const [logo, setLogo] = useState(initial.logo ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [lookupInput, setLookupInput] = useState(initial.website ?? initial.companyName ?? "");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [projectTypes, setProjectTypes] = useState<Set<ProjectType>>(new Set(initial.projectTypes));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const logoPreviewSrc = logo.startsWith("local:") || logo.startsWith("azure:") ? "/api/employer/profile/logo" : logo;

  function toggleProjectType(value: ProjectType) {
    setProjectTypes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function runCompanyLookup() {
    if (!lookupInput.trim()) {
      return;
    }
    setLookupBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/company/enrich?q=${encodeURIComponent(lookupInput.trim())}`, { method: "GET" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        companyName?: string;
        website?: string;
        suggestedLogo?: string | null;
      };
      if (!res.ok) {
        setError("Could not look up company details.");
        return;
      }
      if (data.companyName) setCompanyName(data.companyName);
      if (data.website) setWebsite(data.website);
      if (data.suggestedLogo) setLogo(data.suggestedLogo);
    } catch {
      setError("Could not look up company details.");
    } finally {
      setLookupBusy(false);
    }
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
          logo: logo || null,
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

  async function uploadLogoFile() {
    if (!logoFile) return;
    setError(null);
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.set("file", logoFile);
      const res = await fetch("/api/employer/profile/logo", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; logo?: string };
      if (!res.ok || !data.logo) {
        setError(data.error ?? "Could not upload logo image.");
        return;
      }
      setLogo(data.logo);
      setLogoFile(null);
    } catch {
      setError("Could not upload logo image.");
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <form className="cardBody" onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="inputField"
            style={{ flex: 1, minWidth: 220 }}
            type="search"
            value={lookupInput}
            onChange={(e) => setLookupInput(e.target.value)}
            placeholder="Search by website, domain, or email"
            disabled={saving || lookupBusy}
          />
          <button type="button" className="btnSecondary" onClick={() => void runCompanyLookup()} disabled={saving || lookupBusy}>
            {lookupBusy ? "Finding..." : "Autofill"}
          </button>
        </div>
      </fieldset>

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
        License number (optional)
        <input
          className="inputField"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          maxLength={120}
          disabled={saving}
        />
      </label>

      <label className="portfolioLabel">
        Website / domain
        <input
          className="inputField"
          type="search"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          maxLength={300}
          placeholder="Search or paste website/domain"
          disabled={saving}
        />
      </label>

      <label className="portfolioLabel">
        Logo URL
        <input
          className="inputField"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          maxLength={500}
          placeholder="https://logo.clearbit.com/example.com"
          disabled={saving}
        />
      </label>

      <div className="portfolioLabel" style={{ display: "grid", gap: 6 }}>
        <span>Upload logo image</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="inputField"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            disabled={saving || uploadingLogo}
          />
          <button
            type="button"
            className="btnSecondary"
            onClick={() => void uploadLogoFile()}
            disabled={!logoFile || saving || uploadingLogo}
          >
            {uploadingLogo ? "Uploading..." : "Upload logo"}
          </button>
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          JPEG, PNG, or WebP up to 6 MB.
        </div>
      </div>

      {logo ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoPreviewSrc} alt="Company logo preview" style={{ width: 42, height: 42, borderRadius: 6, objectFit: "contain", background: "#fff", border: "1px solid var(--color-border-tertiary)" }} />
          <span className="muted">Logo preview</span>
        </div>
      ) : null}

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
