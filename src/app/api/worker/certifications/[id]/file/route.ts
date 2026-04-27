import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadCertFile } from "@/lib/cert-storage";

export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;

  const cert = await prisma.certification.findUnique({
    where: { id },
    include: { worker: { select: { userId: true } } },
  });

  if (!cert || cert.worker.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!cert.documentUrl) {
    return NextResponse.json({ error: "No document on file" }, { status: 404 });
  }

  try {
    const { data, contentType, filename } = await loadCertFile(cert.documentUrl);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not read file" }, { status: 500 });
  }
}
