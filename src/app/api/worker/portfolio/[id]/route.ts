import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

async function assertOwnsPortfolio(userId: string, id: string) {
  return prisma.portfolioItem.findFirst({ where: { id, workerId: userId } });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await assertOwnsPortfolio(session.user.id, params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.title !== undefined ? String(body.title).trim() : existing.title;
  if (!title || title.length > 200) {
    return NextResponse.json({ error: "Invalid title." }, { status: 400 });
  }

  let workSiteId: string | null | undefined = undefined;
  if (body.workSiteId !== undefined) {
    if (body.workSiteId == null || String(body.workSiteId).trim() === "") {
      workSiteId = null;
    } else {
      const ws = String(body.workSiteId).trim();
      const site = await prisma.jobSiteExperience.findFirst({
        where: { id: ws, workerId: session.user.id },
      });
      if (!site) return NextResponse.json({ error: "Invalid job site." }, { status: 400 });
      workSiteId = site.id;
    }
  }

  const updated = await prisma.portfolioItem.update({
    where: { id: params.id },
    data: {
      title,
      description: body.description !== undefined ? String(body.description).trim() || null : existing.description,
      sortOrder:
        typeof body.sortOrder === "number" ? body.sortOrder : existing.sortOrder,
      ...(workSiteId !== undefined ? { workSiteId } : {}),
    },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await assertOwnsPortfolio(session.user.id, params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.portfolioItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
