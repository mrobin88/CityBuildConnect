import type { ApplicationStatus, PrismaClient, UserRole } from "@prisma/client";

/** Only workers and employers may direct-message each other (product rule). */
export function canExchangeDirectMessagesByRole(a: UserRole, b: UserRole): boolean {
  if (a === "ADMIN" || b === "ADMIN") return false;
  return (a === "WORKER" && b === "EMPLOYER") || (a === "EMPLOYER" && b === "WORKER");
}

const MESSAGE_UNLOCK_STATUSES: ApplicationStatus[] = ["INTERESTED", "INTERVIEW", "OFFER", "HIRED"];

/**
 * Messaging is unlocked only after employer shows positive intent.
 * This prevents cold-message spam from either side.
 */
export async function canExchangeDirectMessages(
  prisma: PrismaClient,
  aUserId: string,
  aRole: UserRole,
  bUserId: string,
  bRole: UserRole
): Promise<boolean> {
  if (!canExchangeDirectMessagesByRole(aRole, bRole)) return false;

  const workerId = aRole === "WORKER" ? aUserId : bUserId;
  const employerId = aRole === "EMPLOYER" ? aUserId : bUserId;
  const unlocked = await prisma.application.findFirst({
    where: {
      workerId,
      status: { in: MESSAGE_UNLOCK_STATUSES },
      jobPosting: { employerId },
    },
    select: { id: true },
  });
  return Boolean(unlocked);
}
