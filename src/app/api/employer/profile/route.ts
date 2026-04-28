import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ProjectType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PROJECT_TYPE_VALUES = new Set<string>(Object.values(ProjectType));

function normalizeOptionalString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function normalizeProjectTypes(value: unknown): ProjectType[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set<ProjectType>();
  for (const entry of value) {
    if (typeof entry === "string" && PROJECT_TYPE_VALUES.has(entry)) {
      unique.add(entry as ProjectType);
    }
  }
  return [...unique];
}

function isValidHttpUrl(value: string | null): boolean {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile, user] = await Promise.all([
    prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        companyName: true,
        licenseNumber: true,
        website: true,
        projectTypes: true,
        logo: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { location: true },
    }),
  ]);

  return NextResponse.json({
    profile: {
      companyName: profile?.companyName ?? "",
      licenseNumber: profile?.licenseNumber ?? null,
      website: profile?.website ?? null,
      projectTypes: profile?.projectTypes ?? [],
      logo: profile?.logo ?? null,
      location: user?.location ?? null,
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const companyName = normalizeOptionalString(body.companyName, 160);
  const licenseNumber = normalizeOptionalString(body.licenseNumber, 120);
  const website = normalizeOptionalString(body.website, 300);
  const location = normalizeOptionalString(body.location, 120);
  const projectTypes = normalizeProjectTypes(body.projectTypes);

  if (!companyName) {
    return NextResponse.json({ error: "Organization name is required." }, { status: 400 });
  }

  if (!isValidHttpUrl(website)) {
    return NextResponse.json({ error: "Website must start with http:// or https://" }, { status: 400 });
  }

  await Promise.all([
    prisma.employerProfile.upsert({
      where: { userId: session.user.id },
      update: {
        companyName,
        licenseNumber,
        website,
        projectTypes,
      },
      create: {
        userId: session.user.id,
        companyName,
        licenseNumber,
        website,
        projectTypes,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { location },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
