import type { UserRole } from "@prisma/client";

/** Only workers and employers may direct-message each other (product rule). */
export function canExchangeDirectMessages(a: UserRole, b: UserRole): boolean {
  if (a === "ADMIN" || b === "ADMIN") return false;
  return (a === "WORKER" && b === "EMPLOYER") || (a === "EMPLOYER" && b === "WORKER");
}
