import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_PORTFOLIO_MIME,
  MAX_PORTFOLIO_IMAGE_BYTES,
  loadPortfolioImage,
  savePortfolioImage,
} from "@/lib/portfolio-storage";
import { compressImageToMaxBytes, isCompressibleImageMime } from "@/lib/image-compression";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await prisma.portfolioItem.findFirst({
    where: { id: params.id, workerId: session.user.id },
  });
  if (!item?.imageUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { data, contentType, filename } = await loadPortfolioImage(item.imageUrl);
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
    return NextResponse.json({ error: "Could not read image" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await prisma.portfolioItem.findFirst({
    where: { id: params.id, workerId: session.user.id },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  const extFromName = (() => {
    const n = file.name.split(".").pop()?.toLowerCase();
    if (n === "jpg" || n === "jpeg") return { mime: "image/jpeg" as const, ext: "jpg" as const };
    if (n === "png") return { mime: "image/png" as const, ext: "png" as const };
    if (n === "webp") return { mime: "image/webp" as const, ext: "webp" as const };
    return null;
  })();

  const declared = file.type && file.type !== "application/octet-stream" ? file.type : null;
  let mimeType = declared ?? "application/octet-stream";
  let ext = ALLOWED_PORTFOLIO_MIME[mimeType];
  if (!ext && extFromName) {
    mimeType = extFromName.mime;
    ext = ALLOWED_PORTFOLIO_MIME[mimeType] ?? extFromName.ext;
  }
  if (!ext) {
    return NextResponse.json({ error: "Use JPEG, PNG, or WebP." }, { status: 400 });
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  let buffer = originalBuffer;
  if (buffer.length > MAX_PORTFOLIO_IMAGE_BYTES && isCompressibleImageMime(mimeType)) {
    const compressed = await compressImageToMaxBytes(buffer, MAX_PORTFOLIO_IMAGE_BYTES);
    if (compressed) {
      buffer = Buffer.from(compressed);
      mimeType = "image/webp";
      ext = "webp";
    }
  }
  if (buffer.length > MAX_PORTFOLIO_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image too large after compression (max 8 MB)." }, { status: 400 });
  }

  try {
    const imageUrl = await savePortfolioImage(session.user.id, item.id, buffer, mimeType, ext);
    const updated = await prisma.portfolioItem.update({
      where: { id: item.id },
      data: { imageUrl },
    });
    return NextResponse.json({ item: { id: updated.id, imageUrl: updated.imageUrl } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to store image." }, { status: 500 });
  }
}
