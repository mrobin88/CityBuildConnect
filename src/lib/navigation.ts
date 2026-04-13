import type { UserRole } from "@prisma/client";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export type NavSection = { heading: string; items: NavItem[] };

const workerNav: NavSection[] = [
  {
    heading: "Career",
    items: [
      { href: "/worker/profile", label: "Profile & cert wallet", icon: "👤" },
      { href: "/worker/jobs", label: "Browse openings", icon: "📋" },
      { href: "/worker/hours", label: "Hours tracker", icon: "📊" },
    ],
  },
  {
    heading: "Connect",
    items: [{ href: "/worker/messages", label: "Messages", icon: "💬" }],
  },
];

const employerNav: NavSection[] = [
  {
    heading: "Discover",
    items: [
      { href: "/employer/browse", label: "Browse workers", icon: "🔍" },
      { href: "/employer/postings", label: "My postings", icon: "📋" },
      { href: "/employer/saved", label: "Saved profiles", icon: "⭐" },
    ],
  },
  {
    heading: "Manage",
    items: [
      { href: "/employer/crew", label: "Active crew", icon: "👷" },
      { href: "/employer/hours", label: "Hours tracker", icon: "📊" },
      { href: "/employer/contracts", label: "Contracts", icon: "📄" },
    ],
  },
  {
    heading: "Account",
    items: [
      { href: "/employer/company", label: "Company profile", icon: "🏢" },
      { href: "/employer/settings", label: "Settings", icon: "⚙️" },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    heading: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: "📈" },
      { href: "/admin/cohorts", label: "Cohorts", icon: "👥" },
      { href: "/admin/certs", label: "Cert monitoring", icon: "🪪" },
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
