import type { UserRole } from "@prisma/client";

export function defaultHomeForRole(role: UserRole): string {
  switch (role) {
    case "WORKER":
      return "/worker/profile";
    case "EMPLOYER":
      return "/employer/postings";
    case "ADMIN":
      return "/admin";
    default:
      return "/";
  }
}
