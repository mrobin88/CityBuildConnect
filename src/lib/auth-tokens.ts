import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const PASSWORD_RESET_PREFIX = "reset:";
export const EMAIL_VERIFY_PREFIX = "verify:";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
export const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Issues a single-use token for the given namespaced identifier. Any existing
 * tokens for that identifier are cleared first, so only the latest link works.
 * Stores a SHA-256 hash of the token; returns the raw token for the email link.
 */
export async function issueToken(identifier: string, ttlMs: number): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  const expires = new Date(Date.now() + ttlMs);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });

  return rawToken;
}

/**
 * Validates and consumes a token. Returns true only when a matching,
 * unexpired token exists; the token is deleted so it cannot be reused.
 */
export async function consumeToken(identifier: string, rawToken: string): Promise<boolean> {
  if (!rawToken) return false;
  const token = hashToken(rawToken);

  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token },
  });

  if (!record) return false;

  await prisma.verificationToken.deleteMany({ where: { identifier } });

  if (record.expires.getTime() < Date.now()) return false;

  return true;
}
