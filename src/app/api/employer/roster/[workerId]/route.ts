import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_TAGS = 10;
const MAX_TAG_LEN = 32;

function normalizeContactStatus(value: unknown): string {
  const status = String(value ?? "").trim().toUpperCase();
  if (!status) return "NEW";
  if (status.length > 24) return "NEW";
  return status;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .map((raw) => String(raw ?? "").trim().toLowerCase())
    .filter(Boolean)
    .map((v) => v.replace(/\s+/g, "-").slice(0, MAX_TAG_LEN));
  return [...new Set(cleaned)].slice(0, MAX_TAGS);
}

function normalizeOptionalText(value: unknown, maxLen: number): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return text.slice(0, maxLen);
}

function normalizeOptionalDate(value: unknown): Date | null {
  if (!value) return null;
  const iso = String(value).trim();
  if (!iso) return null;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(req: Request, { params }: { params: { workerId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workerId = params.workerId;
  if (!workerId) return NextResponse.json({ error: "workerId is required." }, { status: 400 });

  const workerExists = await prisma.workerProfile.findUnique({
    where: { userId: workerId },
    select: { userId: true },
  });
  if (!workerExists) return NextResponse.json({ error: "Worker not found." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contactStatus = normalizeContactStatus(body.contactStatus);
  const tags = normalizeTags(body.tags);
  const privateNotes = normalizeOptionalText(body.privateNotes, 5000);
  const lastContactAt = normalizeOptionalDate(body.lastContactAt);

  const row = await prisma.employerRosterEntry.upsert({
    where: {
      employerId_workerId: {
        employerId: session.user.id,
        workerId,
      },
    },
    update: {
      contactStatus,
      tags,
      privateNotes,
      lastContactAt,
      archived: false,
    },
    create: {
      employerId: session.user.id,
      workerId,
      contactStatus,
      tags,
      privateNotes,
      lastContactAt,
    },
  });

  return NextResponse.json({ rosterEntry: row });
}
