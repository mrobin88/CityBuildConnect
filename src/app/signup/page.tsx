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
    <div className="authShell">
      <div className="authCard">
        <Link href="/login" className="authBackLink">
          ← Back to sign in
        </Link>
        <h1 className="authTitle">Create account</h1>
        <p className="muted authLead">
          Create your CityBuild Connect account with email and password.
        </p>

        <form onSubmit={handleSignup} className="authForm">
          <label className="authLabel">
            <span>First name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="inputField"
            />
          </label>

          <label className="authLabel">
            <span>Last name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="inputField"
            />
          </label>

          <label className="authLabel">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.org"
              required
              className="inputField"
            />
          </label>

          <label className="authLabel">
            <span>Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="inputField"
            >
              <option value="WORKER">Worker / Apprentice</option>
              <option value="EMPLOYER">Employer / Company</option>
            </select>
          </label>

          <label className="authLabel">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              placeholder="At least 8 characters"
              className="inputField"
            />
          </label>

          {error ? (
            <p className="formError" role="alert">
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
