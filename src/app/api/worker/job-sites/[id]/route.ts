import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

function parseDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function assertOwnsJobSite(userId: string, id: string) {
  const row = await prisma.jobSiteExperience.findFirst({
    where: { id, workerId: userId },
  });
  return row;
}

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await assertOwnsJobSite(session.user.id, params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const projectName =
    body.projectName !== undefined ? String(body.projectName).trim() : existing.projectName;
  if (!projectName || projectName.length > 200) {
    return NextResponse.json({ error: "Invalid project name." }, { status: 400 });
  }

  const startDate = body.startDate !== undefined ? parseDate(body.startDate) : existing.startDate;
  const endDate = body.endDate !== undefined ? parseDate(body.endDate) : existing.endDate;
  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json({ error: "End date must be on or after start date." }, { status: 400 });
  }

  const updated = await prisma.jobSiteExperience.update({
    where: { id: params.id },
    data: {
      projectName,
      location: body.location !== undefined ? String(body.location).trim() || null : existing.location,
      companyName: body.companyName !== undefined ? String(body.companyName).trim() || null : existing.companyName,
      roleOnSite: body.roleOnSite !== undefined ? String(body.roleOnSite).trim() || null : existing.roleOnSite,
      startDate,
      endDate,
      notes: body.notes !== undefined ? String(body.notes).trim() || null : existing.notes,
      sortOrder:
        typeof body.sortOrder === "number" ? body.sortOrder : existing.sortOrder,
    },
  });

  return NextResponse.json({ jobSite: updated });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await assertOwnsJobSite(session.user.id, params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.jobSiteExperience.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
