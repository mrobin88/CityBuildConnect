const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "protonmail.com",
  "aol.com",
]);

function toTitleWords(input: string): string {
  return input
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

export function extractDomainFromInput(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  if (raw.includes("@")) {
    const domainFromEmail = raw.split("@").pop()?.trim() ?? "";
    return domainFromEmail || null;
  }

  try {
    const maybeUrl = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const hostname = new URL(maybeUrl).hostname.toLowerCase();
    return hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export function inferCompanyNameFromDomain(domain: string): string {
  const root = domain.replace(/^www\./, "").split(".")[0] ?? "";
  const cleaned = root.replace(/[^a-z0-9-]+/gi, " ").trim();
  return toTitleWords(cleaned) || "Company";
}

export function logoCandidatesForDomain(domain: string): string[] {
  const clean = domain.replace(/^www\./, "").trim().toLowerCase();
  if (!clean) return [];
  return [
    `https://logo.clearbit.com/${clean}`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=128`,
  ];
}

export function inferEmployerBootstrapFromEmail(email: string): {
  companyName: string;
  website: string | null;
  logo: string | null;
  domain: string | null;
} {
  const domain = extractDomainFromInput(email);
  if (!domain) {
    return { companyName: "New Employer", website: null, logo: null, domain: null };
  }

  if (GENERIC_EMAIL_DOMAINS.has(domain)) {
    return { companyName: "New Employer", website: null, logo: null, domain };
  }

  return {
    companyName: inferCompanyNameFromDomain(domain),
    website: `https://${domain}`,
    logo: logoCandidatesForDomain(domain)[0] ?? null,
    domain,
  };
}
