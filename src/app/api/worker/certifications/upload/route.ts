import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALLOWED_CERT_MIME, MAX_CERT_BYTES, saveCertFile } from "@/lib/cert-storage";

export const runtime = "nodejs";

function parseOptionalDate(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workerId = session.user.id;

  const profile = await prisma.workerProfile.findUnique({ where: { userId: workerId } });
  if (!profile) {
    return NextResponse.json({ error: "Worker profile required before uploading certs." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const name = String(formData.get("name") ?? "").trim();
  const issuingBody = String(formData.get("issuingBody") ?? "").trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Certification name is required." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  if (file.size > MAX_CERT_BYTES) {
    return NextResponse.json({ error: `File too large (max ${MAX_CERT_BYTES / (1024 * 1024)} MB).` }, { status: 400 });
  }

  const extFromName = (() => {
    const n = file.name.split(".").pop()?.toLowerCase();
    if (n === "pdf") return { mime: "application/pdf" as const, ext: "pdf" as const };
    if (n === "jpg" || n === "jpeg") return { mime: "image/jpeg" as const, ext: "jpg" as const };
    if (n === "png") return { mime: "image/png" as const, ext: "png" as const };
    if (n === "webp") return { mime: "image/webp" as const, ext: "webp" as const };
    return null;
  })();

  const declared = file.type && file.type !== "application/octet-stream" ? file.type : null;
  let mimeType = declared ?? "application/octet-stream";
  let ext = ALLOWED_CERT_MIME[mimeType];
  if (!ext && extFromName) {
    mimeType = extFromName.mime;
    ext = ALLOWED_CERT_MIME[mimeType] ?? extFromName.ext;
  }
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PDF, JPEG, PNG, or WebP." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const issueDate = parseOptionalDate(formData.get("issueDate"));
  const expiryDate = parseOptionalDate(formData.get("expiryDate"));

  const cert = await prisma.certification.create({
    data: {
      workerId,
      name,
      issuingBody,
      issueDate,
      expiryDate,
      documentUrl: null,
      verified: false,
    },
  });

  try {
    const documentUrl = await saveCertFile(workerId, cert.id, buffer, mimeType, ext);
    const updated = await prisma.certification.update({
      where: { id: cert.id },
      data: { documentUrl },
    });
    return NextResponse.json({
      certification: {
        id: updated.id,
        name: updated.name,
        documentUrl: updated.documentUrl,
      },
    });
  } catch (e) {
    await prisma.certification.delete({ where: { id: cert.id } }).catch(() => {});
    console.error(e);
    return NextResponse.json({ error: "Failed to store file. Check storage configuration." }, { status: 500 });
  }
}
