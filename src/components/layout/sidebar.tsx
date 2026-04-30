"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function menuLabel() {
    return menuOpen ? "Less" : "Menu";
  }

  return (
    <>
      <div className={styles.mobileTopBar}>
        <div className={styles.mobileBrandWrap}>
          <div className={styles.mobileBrand}>HingeLine</div>
          <div className={styles.mobileSub}>Mission Hiring Hall</div>
        </div>
        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-panel"
        >
          {menuLabel()} ☰
        </button>
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>HingeLine</div>
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
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <SignOutButton />
      </aside>

      {menuOpen ? (
        <div className={styles.mobileOverlay}>
          <div id="mobile-nav-panel" className={styles.mobilePanel}>
            <div className={styles.mobileRoleCard}>
              <div className={styles.mobileRoleLabel}>Signed in as</div>
              <div className={styles.mobileRoleValue}>{roleLabel(role)}</div>
              <div className={styles.mobileUser}>{userLabel}</div>
            </div>
            <nav className={styles.mobileNav} aria-label="Mobile main">
              {sections.map((section) => (
                <div key={section.heading}>
                  <div className={styles.mobileSection}>{section.heading}</div>
                  {section.items.map((item) => {
                    const active =
                      pathname === item.href ||
                      (pathname.startsWith(`${item.href}/`) && item.href !== "/admin");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`${styles.mobileItem} ${active ? styles.mobileItemActive : ""}`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            <div className={styles.mobileSignOutWrap}>
              <SignOutButton />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
