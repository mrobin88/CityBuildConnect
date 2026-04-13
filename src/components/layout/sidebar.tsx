"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { navForRole, roleLabel } from "@/lib/navigation";
import { SignOutButton } from "@/components/layout/sign-out-button";
import styles from "./sidebar.module.css";

type SidebarProps = {
  role: UserRole;
  userLabel: string;
};

export function Sidebar({ role, userLabel }: SidebarProps) {
  const pathname = usePathname();
  const sections = navForRole(role);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>CityBuild</div>
        <div className={styles.logoSub}>Mission Hiring Hall</div>
      </div>

      <div className={styles.roleBadge}>
        <div className={styles.roleLabel}>Signed in as</div>
        <div className={styles.roleValue}>{roleLabel(role)}</div>
        <div className={styles.userEmail}>{userLabel}</div>
      </div>

      <nav className={styles.nav} aria-label="Main">
        {sections.map((section) => (
          <div key={section.heading}>
            <div className={styles.navSection}>{section.heading}</div>
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (pathname.startsWith(`${item.href}/`) && item.href !== "/admin");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                >
                  <span className={styles.navIcon} aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <SignOutButton />
    </aside>
  );
}
