import type { UserRole } from "@prisma/client";
import { Sidebar } from "@/components/layout/sidebar";
import styles from "./app-shell.module.css";

type AppShellProps = {
  role: UserRole;
  userLabel: string;
  children: React.ReactNode;
};

export function AppShell({ role, userLabel, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <Sidebar role={role} userLabel={userLabel} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
