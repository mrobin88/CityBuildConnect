import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

  const title = String(body.title ?? "").trim();
  if (!title || title.length > 200) {
    return NextResponse.json({ error: "Title is required (max 200 characters)." }, { status: 400 });
  }

  let workSiteId: string | null = null;
  if (body.workSiteId != null && String(body.workSiteId).trim()) {
    const ws = String(body.workSiteId).trim();
    const site = await prisma.jobSiteExperience.findFirst({
      where: { id: ws, workerId: session.user.id },
    });
    if (!site) return NextResponse.json({ error: "Invalid job site." }, { status: 400 });
    workSiteId = site.id;
  }

  const row = await prisma.portfolioItem.create({
    data: {
      workerId: session.user.id,
      workSiteId,
      title,
      description: String(body.description ?? "").trim() || null,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  });

  return NextResponse.json({ item: row });
}
