import type { ApplicationStatus, PrismaClient, UserRole } from "@prisma/client";

/** Only workers and employers may direct-message each other (product rule). */
export function canExchangeDirectMessagesByRole(a: UserRole, b: UserRole): boolean {
  if (a === "ADMIN" || b === "ADMIN") return false;
  return (a === "WORKER" && b === "EMPLOYER") || (a === "EMPLOYER" && b === "WORKER");
}

/** An application advanced to one of these statuses counts as mutual interest. */
export const MESSAGE_UNLOCK_STATUSES: ApplicationStatus[] = [
  "INTERESTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
];

/**
 * The single definition of a "match": the worker applied (showed interest) and
 * the employer advanced that application past "Pass" (showed interest back).
 * Messaging — on both sides — is only available once this is true.
 */
export async function employerWorkerMatched(
  prisma: PrismaClient,
  employerId: string,
  workerId: string,
): Promise<boolean> {
  const match = await prisma.application.findFirst({
    where: {
      workerId,
      status: { in: MESSAGE_UNLOCK_STATUSES },
      jobPosting: { employerId },
    },
    select: { id: true },
  });
  return Boolean(match);
}

/**
 * Whether `actor` may view or send messages with `peer`. Requires a valid
 * worker/employer pairing and a match between them.
 */
export async function canSendDirectMessage(
  prisma: PrismaClient,
  actorId: string,
  actorRole: UserRole,
  peerId: string,
  peerRole: UserRole,
): Promise<boolean> {
  if (!canExchangeDirectMessagesByRole(actorRole, peerRole)) return false;
  const employerId = actorRole === "EMPLOYER" ? actorId : peerId;
  const workerId = actorRole === "WORKER" ? actorId : peerId;
  return employerWorkerMatched(prisma, employerId, workerId);
}
