"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { defaultHomeForRole } from "@/lib/routes";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDevSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("dev-credentials", {
        email: email.trim().toLowerCase(),
        redirect: false,
      });
      if (res?.error) {
        setError("Could not sign in. Seed the DB and use worker@citybuild.local, employer@citybuild.local, or admin@citybuild.local.");
        setLoading(false);
        return;
      }
      const session = await getSession();
      const role = session?.user?.role as UserRole | undefined;
      if (role) {
        router.push(defaultHomeForRole(role));
        router.refresh();
        return;
      }
      router.push("/");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400, marginTop: 48 }}>
        <Link href="/" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          ← Back
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Sign in</h1>
        <p className="muted" style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.45 }}>
          Use Google or email magic link when configured. For local development, use the seeded emails below with dev
          login.
        </p>

        <form onSubmit={handleDevSignIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Email (dev login)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="worker@citybuild.local"
              required
              style={{
                padding: "10px 12px",
                borderRadius: "var(--border-radius-md)",
                border: "0.5px solid var(--color-border-tertiary)",
                fontSize: 14,
              }}
            />
          </label>
          {error ? (
            <p style={{ fontSize: 12, color: "#b91c1c" }} role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btnPrimary" disabled={loading}>
            {loading ? "Signing in…" : "Continue with dev login"}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            OAuth & magic link
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              className="btnSecondary"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              style={{ width: "100%" }}
            >
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
