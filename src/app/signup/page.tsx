"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { UserRole } from "@prisma/client";
import { defaultHomeForRole } from "@/lib/routes";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("WORKER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role,
        }),
      });

      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not create your account.");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login");
        return;
      }

      router.push(defaultHomeForRole(role));
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, marginTop: 48 }}>
        <Link href="/login" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          ← Back to sign in
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Create account</h1>
        <p className="muted" style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.45 }}>
          Create your CityBuild Connect account with email and password.
        </p>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>First name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              style={{
                padding: "10px 12px",
                borderRadius: "var(--border-radius-md)",
                border: "0.5px solid var(--color-border-tertiary)",
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Last name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              style={{
                padding: "10px 12px",
                borderRadius: "var(--border-radius-md)",
                border: "0.5px solid var(--color-border-tertiary)",
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.org"
              required
              style={{
                padding: "10px 12px",
                borderRadius: "var(--border-radius-md)",
                border: "0.5px solid var(--color-border-tertiary)",
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              style={{
                padding: "10px 12px",
                borderRadius: "var(--border-radius-md)",
                border: "0.5px solid var(--color-border-tertiary)",
                fontSize: 14,
              }}
            >
              <option value="WORKER">Worker / Apprentice</option>
              <option value="EMPLOYER">Employer / Company</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              placeholder="At least 8 characters"
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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
