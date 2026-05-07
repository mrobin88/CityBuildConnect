import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compressImageToMaxBytes, isCompressibleImageMime } from "@/lib/image-compression";
import {
  ALLOWED_PROFILE_IMAGE_MIME,
  MAX_PROFILE_IMAGE_BYTES,
  loadProfileImage,
  saveEmployerLogo,
} from "@/lib/profile-image-storage";

export const runtime = "nodejs";

function fallbackExtFromFilename(filename: string): { mime: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" } | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return { mime: "image/jpeg", ext: "jpg" };
  if (ext === "png") return { mime: "image/png", ext: "png" };
  if (ext === "webp") return { mime: "image/webp", ext: "webp" };
  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    select: { logo: true },
  });

  if (!profile?.logo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (profile.logo.startsWith("http://") || profile.logo.startsWith("https://")) {
    return NextResponse.redirect(profile.logo);
  }

  try {
    const { data, contentType, filename } = await loadProfileImage(profile.logo);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not read logo image" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    select: { userId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Create your company profile first." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Image file required." }, { status: 400 });
  }

  const extFromName = fallbackExtFromFilename(file.name);
  const declared = file.type && file.type !== "application/octet-stream" ? file.type : null;
  let mimeType = declared ?? "application/octet-stream";
  let ext = ALLOWED_PROFILE_IMAGE_MIME[mimeType];
  if (!ext && extFromName) {
    mimeType = extFromName.mime;
    ext = ALLOWED_PROFILE_IMAGE_MIME[mimeType] ?? extFromName.ext;
  }
  if (!ext) {
    return NextResponse.json({ error: "Use JPEG, PNG, or WebP." }, { status: 400 });
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  let buffer = originalBuffer;
  if (buffer.length > MAX_PROFILE_IMAGE_BYTES && isCompressibleImageMime(mimeType)) {
    const compressed = await compressImageToMaxBytes(buffer, MAX_PROFILE_IMAGE_BYTES);
    if (compressed) {
      buffer = Buffer.from(compressed);
      mimeType = "image/webp";
      ext = "webp";
    }
  }
  if (buffer.length > MAX_PROFILE_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image too large after compression (max 6 MB)." }, { status: 400 });
  }

  try {
    const logo = await saveEmployerLogo(session.user.id, buffer, mimeType, ext);
    await prisma.employerProfile.update({
      where: { userId: session.user.id },
      data: { logo },
    });
    return NextResponse.json({ logo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to store logo." }, { status: 500 });
  }
}
