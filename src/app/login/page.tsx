"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn, getSession, getProviders } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { defaultHomeForRole } from "@/lib/routes";

export default function LoginPage() {
  const router = useRouter();
  const [devEmail, setDevEmail] = useState("");
  const [passwordEmail, setPasswordEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [passwordAvailable, setPasswordAvailable] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [devAvailable, setDevAvailable] = useState(false);
  const [magicLinkMessage, setMagicLinkMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProviders() {
      const providers = await getProviders();
      if (!active || !providers) return;
      setPasswordAvailable(Boolean(providers.password));
      setGoogleAvailable(Boolean(providers.google));
      setEmailAvailable(Boolean(providers.email));
      setDevAvailable(Boolean(providers["dev-credentials"]));
    }
    loadProviders();
    return () => {
      active = false;
    };
  }, []);

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setMagicLinkMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("password", {
        email: passwordEmail.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password.");
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
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDevSignIn(e: React.FormEvent) {
    e.preventDefault();
    setMagicLinkMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("dev-credentials", {
        email: devEmail.trim().toLowerCase(),
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

  async function handleMagicLinkSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMagicLinkMessage(null);
    setMagicLoading(true);
    try {
      const res = await signIn("email", {
        email: magicEmail.trim().toLowerCase(),
        callbackUrl: "/",
        redirect: false,
      });
      if (res?.error) {
        setError("Could not send sign-in email. Please try again.");
      } else {
        setMagicLinkMessage("Check your email for a sign-in link.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setMagicLoading(false);
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
          Use email and password to sign in. You can also request an email magic link when it is configured.
        </p>

        {passwordAvailable ? (
          <form onSubmit={handlePasswordSignIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Email</span>
              <input
                type="email"
                value={passwordEmail}
                onChange={(e) => setPasswordEmail(e.target.value)}
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
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--border-radius-md)",
                  border: "0.5px solid var(--color-border-tertiary)",
                  fontSize: 14,
                }}
              />
            </label>
            <button type="submit" className="btnPrimary" disabled={loading}>
              {loading ? "Signing in…" : "Continue"}
            </button>
            <p className="muted" style={{ fontSize: 12, margin: 0 }}>
              No account? <Link href="/signup">Create one</Link>
            </p>
          </form>
        ) : null}

        {error ? (
          <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 12 }} role="alert">
            {error}
          </p>
        ) : null}

        {devAvailable ? (
          <form onSubmit={handleDevSignIn} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Email (dev login)</span>
              <input
                type="email"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
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
            <button type="submit" className="btnPrimary" disabled={loading}>
              {loading ? "Signing in…" : "Continue with dev login"}
            </button>
          </form>
        ) : null}

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            Other sign-in options
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {googleAvailable ? (
              <button
                type="button"
                className="btnSecondary"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                style={{ width: "100%" }}
              >
                Continue with Google
              </button>
            ) : null}
            {emailAvailable ? (
              <form onSubmit={handleMagicLinkSignIn} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="you@company.org"
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--border-radius-md)",
                    border: "0.5px solid var(--color-border-tertiary)",
                    fontSize: 14,
                  }}
                />
                <button type="submit" className="btnSecondary" disabled={magicLoading} style={{ width: "100%" }}>
                  {magicLoading ? "Sending link…" : "Continue with email link"}
                </button>
                {magicLinkMessage ? (
                  <p style={{ fontSize: 12, color: "#166534" }} role="status">
                    {magicLinkMessage}
                  </p>
                ) : null}
              </form>
            ) : null}
            {!googleAvailable && !emailAvailable ? (
              <p className="muted" style={{ fontSize: 12 }}>
                OAuth and email login are not configured yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
