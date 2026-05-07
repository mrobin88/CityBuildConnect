import sharp from "sharp";

const WEBP_QUALITY_STEPS = [82, 74, 66, 58, 50, 42, 36];
const MAX_WIDTH_STEPS = [2400, 2000, 1600, 1280, 1024, 800, 640];

export function isCompressibleImageMime(mimeType: string): boolean {
  return mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp";
}

export async function compressImageToMaxBytes(input: Buffer, maxBytes: number): Promise<Buffer | null> {
  if (input.length <= maxBytes) return input;

  let metadataWidth = 0;
  try {
    const metadata = await sharp(input).metadata();
    metadataWidth = metadata.width ?? 0;
  } catch {
    return null;
  }

  const widthCandidates = Array.from(new Set([metadataWidth, ...MAX_WIDTH_STEPS])).filter((w) => Number.isFinite(w) && w > 0);
  widthCandidates.sort((a, b) => b - a);

  for (const width of widthCandidates) {
    for (const quality of WEBP_QUALITY_STEPS) {
      const candidate = await sharp(input)
        .rotate()
        .resize({ width, withoutEnlargement: true, fit: "inside" })
        .webp({ quality, effort: 4 })
        .toBuffer();
      if (candidate.length <= maxBytes) return candidate;
    }
  }

  return null;
}
