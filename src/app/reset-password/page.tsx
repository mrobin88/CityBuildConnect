"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const missingLink = !email || !token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not reset your password.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (missingLink) {
    return (
      <>
        <h1 className="authTitle">Reset link problem</h1>
        <p className="muted authLead">
          This reset link is missing information or has already been used.
        </p>
        <Link href="/forgot-password" className="btnPrimary" style={{ textAlign: "center" }}>
          Request a new link
        </Link>
      </>
    );
  }

  if (done) {
    return (
      <>
        <h1 className="authTitle">Password updated</h1>
        <p className="formSuccess" role="status">
          Your password has been reset. Redirecting you to sign in…
        </p>
        <Link href="/login">Go to sign in now</Link>
      </>
    );
  }

  return (
    <>
      <h1 className="authTitle">Choose a new password</h1>
      <p className="muted authLead">Setting a new password for {email}.</p>

      <form onSubmit={handleSubmit} className="authForm">
        <label className="authLabel">
          <span>New password</span>
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

        <label className="authLabel">
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
            placeholder="Re-enter your password"
            className="inputField"
          />
        </label>

        {error ? (
          <p className="formError" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btnPrimary" disabled={loading}>
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="authShell">
      <div className="authCard">
        <Link href="/login" className="authBackLink">
          ← Back to sign in
        </Link>
        <Suspense fallback={<p className="muted authLead">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
