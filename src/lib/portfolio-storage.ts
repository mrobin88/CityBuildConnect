import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { BlobServiceClient } from "@azure/storage-blob";

const PREFIX = "portfolio";

export const ALLOWED_PORTFOLIO_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_PORTFOLIO_IMAGE_BYTES = 8 * 1024 * 1024;

function localRoot(): string {
  return process.env.LOCAL_PORTFOLIO_UPLOAD_DIR ?? path.join(process.cwd(), "uploads", "portfolio");
}

function objectPath(workerId: string, itemId: string, ext: string): string {
  return `${PREFIX}/${workerId}/${itemId}.${ext}`;
}

function usesAzureBlob(): boolean {
  return Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING && process.env.AZURE_STORAGE_CONTAINER_CERTS);
}

export async function savePortfolioImage(
  workerId: string,
  itemId: string,
  data: Buffer,
  mimeType: string,
  ext: string
): Promise<string> {
  const rel = objectPath(workerId, itemId, ext);

  if (usesAzureBlob()) {
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_CERTS!;
    const service = BlobServiceClient.fromConnectionString(conn);
    const container = service.getContainerClient(containerName);
    await container.createIfNotExists();
    const blob = container.getBlockBlobClient(rel);
    await blob.uploadData(data, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });
    return `azure:${rel}`;
  }

  const root = localRoot();
  const fullPath = path.join(root, rel);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, data);
  return `local:${rel}`;
}

export async function loadPortfolioImage(imageUrl: string): Promise<{ data: Buffer; contentType: string; filename: string }> {
  if (imageUrl.startsWith("azure:")) {
    const rel = imageUrl.slice("azure:".length);
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_CERTS;
    if (!conn || !containerName) throw new Error("Azure storage not configured");
    const service = BlobServiceClient.fromConnectionString(conn);
    const blob = service.getContainerClient(containerName).getBlockBlobClient(rel);
    const download = await blob.downloadToBuffer();
    const props = await blob.getProperties();
    return {
      data: download,
      contentType: props.contentType ?? "image/jpeg",
      filename: path.basename(rel),
    };
  }

  if (imageUrl.startsWith("local:")) {
    const rel = imageUrl.slice("local:".length).replace(/^\/+/, "");
    const root = path.resolve(localRoot());
    const fullPath = path.resolve(root, rel);
    if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
      throw new Error("Invalid storage path");
    }
    const data = await readFile(fullPath);
    const ext = path.extname(rel).slice(1).toLowerCase();
    const mime =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return { data, contentType: mime, filename: path.basename(rel) };
  }

  throw new Error("Unsupported image storage");
}
