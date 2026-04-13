"use client";

import { signOut } from "next-auth/react";
import styles from "./sign-out-button.module.css";

export function SignOutButton() {
  return (
    <button type="button" className={styles.btn} onClick={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </button>
  );
}
