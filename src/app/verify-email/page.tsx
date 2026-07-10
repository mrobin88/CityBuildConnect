"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyEmailResult() {
  const params = useSearchParams();
  const status = params.get("status");
  const success = status === "success";

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      setMessage(body.message ?? "If your email needs confirmation, a new link is on its way.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <h1 className="authTitle">Email confirmed</h1>
        <p className="formSuccess" role="status">
          Your email address is verified. You&apos;re all set.
        </p>
        <Link href="/login" className="btnPrimary" style={{ textAlign: "center" }}>
          Continue to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="authTitle">Confirmation link expired</h1>
      <p className="muted authLead">
        This confirmation link is invalid or has expired. Enter your email and we&apos;ll send a new one.
      </p>

      {message ? (
        <p className="formSuccess" role="status">
          {message}
        </p>
      ) : (
        <form onSubmit={handleResend} className="authForm">
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
            {loading ? "Sending…" : "Resend confirmation email"}
          </button>
        </form>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="authShell">
      <div className="authCard">
        <Link href="/login" className="authBackLink">
          ← Back to sign in
        </Link>
        <Suspense fallback={<p className="muted authLead">Loading…</p>}>
          <VerifyEmailResult />
        </Suspense>
      </div>
    </div>
  );
}
