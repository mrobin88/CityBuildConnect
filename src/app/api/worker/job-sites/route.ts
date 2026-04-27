import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function parseDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.workerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Create a worker profile first." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const projectName = String(body.projectName ?? "").trim();
  if (!projectName || projectName.length > 200) {
    return NextResponse.json({ error: "Project name is required (max 200 characters)." }, { status: 400 });
  }

  const startDate = parseDate(body.startDate);
  const endDate = parseDate(body.endDate);
  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json({ error: "End date must be on or after start date." }, { status: 400 });
  }

  const row = await prisma.jobSiteExperience.create({
    data: {
      workerId: session.user.id,
      projectName,
      location: String(body.location ?? "").trim() || null,
      companyName: String(body.companyName ?? "").trim() || null,
      roleOnSite: String(body.roleOnSite ?? "").trim() || null,
      startDate,
      endDate,
      notes: String(body.notes ?? "").trim() || null,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  });

  return NextResponse.json({ jobSite: row });
}
