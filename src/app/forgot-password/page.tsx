"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      setMessage(body.message ?? "If an account with that email exists, a reset link is on its way.");
    } catch {
      setError("Something went wrong. Please try again.");
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
        <h1 className="authTitle">Reset your password</h1>
        <p className="muted authLead">
          Enter the email you use for Build Connect and we&apos;ll send you a link to set a new password.
        </p>

        {message ? (
          <p className="formSuccess" role="status">
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="authForm">
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

            {error ? (
              <p className="formError" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btnPrimary" disabled={loading}>
              {loading ? "Sending link…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
