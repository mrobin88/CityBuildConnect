import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { BlobServiceClient } from "@azure/storage-blob";

const OBJECT_PREFIX = "certs";

export const ALLOWED_CERT_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_CERT_BYTES = 10 * 1024 * 1024;

function localRoot(): string {
  return process.env.LOCAL_CERT_UPLOAD_DIR ?? path.join(process.cwd(), "uploads", "certs");
}

function objectPath(workerId: string, certId: string, ext: string): string {
  return `${OBJECT_PREFIX}/${workerId}/${certId}.${ext}`;
}

function usesAzureBlob(): boolean {
  return Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING && process.env.AZURE_STORAGE_CONTAINER_CERTS);
}

export async function saveCertFile(
  workerId: string,
  certId: string,
  data: Buffer,
  mimeType: string,
  ext: string
): Promise<string> {
  const rel = objectPath(workerId, certId, ext);

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

export async function loadCertFile(documentUrl: string): Promise<{ data: Buffer; contentType: string; filename: string }> {
  if (documentUrl.startsWith("azure:")) {
    const rel = documentUrl.slice("azure:".length);
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_CERTS;
    if (!conn || !containerName) throw new Error("Azure storage not configured");
    const service = BlobServiceClient.fromConnectionString(conn);
    const blob = service.getContainerClient(containerName).getBlockBlobClient(rel);
    const download = await blob.downloadToBuffer();
    const props = await blob.getProperties();
    const base = path.basename(rel);
    return {
      data: download,
      contentType: props.contentType ?? "application/octet-stream",
      filename: base,
    };
  }

  if (documentUrl.startsWith("local:")) {
    const rel = documentUrl.slice("local:".length).replace(/^\/+/, "");
    const root = path.resolve(localRoot());
    const fullPath = path.resolve(root, rel);
    if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
      throw new Error("Invalid storage path");
    }
    const data = await readFile(fullPath);
    const ext = path.extname(rel).slice(1).toLowerCase();
    const mime =
      ext === "pdf"
        ? "application/pdf"
        : ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
    return { data, contentType: mime, filename: path.basename(rel) };
  }

  throw new Error("Unsupported document storage");
}
