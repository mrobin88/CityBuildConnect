import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "EMPLOYER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    select: { userId: true },
  });
  if (!employer) return NextResponse.json({ error: "Employer profile missing" }, { status: 400 });

  const body = (await req.json()) as {
    title?: string;
    trade?: string;
    location?: string;
    openSlots?: number;
    hoursPerWeek?: number | null;
    description?: string;
    startDate?: string | null;
  };

  const title = body.title?.trim() ?? "";
  const trade = body.trade?.trim() ?? "";
  const location = body.location?.trim() ?? "";
  const openSlots = Number(body.openSlots ?? 1);
  const hoursPerWeek = body.hoursPerWeek == null ? null : Number(body.hoursPerWeek);
  const description = body.description?.trim() ?? null;
  const startDate = body.startDate ? new Date(body.startDate) : null;

  if (!title || !trade || !location) {
    return NextResponse.json({ error: "Title, trade, and location are required." }, { status: 400 });
  }
  if (!Number.isFinite(openSlots) || openSlots < 1) {
    return NextResponse.json({ error: "Open slots must be at least 1." }, { status: 400 });
  }
  if (hoursPerWeek != null && (!Number.isFinite(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 80)) {
    return NextResponse.json({ error: "Hours per week must be between 1 and 80." }, { status: 400 });
  }

  const job = await prisma.jobPosting.create({
    data: {
      employerId: employer.userId,
      title,
      trade,
      location,
      openSlots,
      hoursPerWeek,
      description,
      startDate,
      status: "OPEN",
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, jobId: job.id });
}
