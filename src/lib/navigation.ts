import type { UserRole } from "@prisma/client";

export type NavItem = {
  href: string;
  label: string;
};

export type NavSection = { heading: string; items: NavItem[] };

const workerNav: NavSection[] = [
  {
    heading: "Career",
    items: [
      { href: "/worker/profile", label: "Profile & cert wallet" },
      { href: "/worker/hours", label: "Hours tracker" },
      { href: "/worker/jobs", label: "Browse openings" },
    ],
  },
  {
    heading: "Connect",
    items: [{ href: "/worker/messages", label: "Messages" }],
  },
];

const employerNav: NavSection[] = [
  {
    heading: "Hiring",
    items: [
      { href: "/employer/postings", label: "Job postings" },
      { href: "/employer/browse", label: "Worker directory" },
    ],
  },
  {
    heading: "Connect",
    items: [{ href: "/employer/messages", label: "Messages" }],
  },
  {
    heading: "Manage",
    items: [
      { href: "/employer/hours", label: "Activity log" },
      { href: "/employer/contracts", label: "Documents" },
    ],
  },
  {
    heading: "Account",
    items: [
      { href: "/employer/company", label: "Organization profile" },
      { href: "/employer/settings", label: "Settings" },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    heading: "Operations",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/cohorts", label: "Cohorts" },
      { href: "/admin/certs", label: "Cert monitoring" },
    ],
  },
];

export function navForRole(role: UserRole): NavSection[] {
  switch (role) {
    case "WORKER":
      return workerNav;
    case "EMPLOYER":
      return employerNav;
    case "ADMIN":
      return adminNav;
    default:
      return workerNav;
  }
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "WORKER":
      return "Worker";
    case "EMPLOYER":
      return "Employer";
    case "ADMIN":
      return "Admin";
    default:
      return "User";
  }
}
