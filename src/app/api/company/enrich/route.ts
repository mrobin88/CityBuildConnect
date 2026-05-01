import { NextResponse } from "next/server";
import {
  extractDomainFromInput,
  inferCompanyNameFromDomain,
  logoCandidatesForDomain,
} from "@/lib/company-enrichment";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query." }, { status: 400 });
  }

  const domain = extractDomainFromInput(query);
  if (!domain) {
    return NextResponse.json({ error: "Provide a valid company website, domain, or email." }, { status: 400 });
  }

  const website = `https://${domain}`;
  const companyName = inferCompanyNameFromDomain(domain);
  const logoCandidates = logoCandidatesForDomain(domain);

  return NextResponse.json({
    companyName,
    website,
    domain,
    logoCandidates,
    suggestedLogo: logoCandidates[0] ?? null,
  });
}
