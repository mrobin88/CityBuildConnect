import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ApplicationStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedStatuses: ApplicationStatus[] = [
  "INTERESTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "DECLINED",
];

export async function POST(req: Request, { params }: { params: { applicationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "EMPLOYER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { status?: ApplicationStatus };
  if (!body.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: { jobPosting: { select: { employerId: true } } },
  });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  if (application.jobPosting.employerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.application.update({
    where: { id: params.applicationId },
    data: { status: body.status },
  });

  return NextResponse.json({ ok: true });
}
