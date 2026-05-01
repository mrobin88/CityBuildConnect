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
        setError(
          "Could not sign in. Seed the DB and use worker@buildconnect.local, employer@buildconnect.local, or admin@buildconnect.local."
        );
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
    <div className="authShell">
      <div className="authCard">
        <Link href="/" className="authBackLink">
          ← Back
        </Link>
        <h1 className="authTitle">Sign in to Build Connect</h1>
        <p className="muted authLead">Use email and password to sign in to the Build Connect network.</p>

        {passwordAvailable ? (
          <form onSubmit={handlePasswordSignIn} className="authForm">
            <label className="authLabel">
              <span>Email</span>
              <input
                type="email"
                value={passwordEmail}
                onChange={(e) => setPasswordEmail(e.target.value)}
                placeholder="you@company.org"
                required
                className="inputField"
              />
            </label>
            <label className="authLabel">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="inputField"
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
          <p className="formError" role="alert">
            {error}
          </p>
        ) : null}

        {devAvailable ? (
          <form onSubmit={handleDevSignIn} className="authForm authSection">
            <label className="authLabel">
              <span>Email (dev login)</span>
              <input
                type="email"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder="worker@buildconnect.local"
                required
                className="inputField"
              />
            </label>
            <button type="submit" className="btnPrimary" disabled={loading}>
              {loading ? "Signing in…" : "Continue with dev login"}
            </button>
          </form>
        ) : null}

        <div className="authSection">
          <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            Other sign-in options
          </p>
          <div className="authForm">
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
              <form onSubmit={handleMagicLinkSignIn} className="authForm">
                <input
                  type="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="you@company.org"
                  required
                  className="inputField"
                />
                <button type="submit" className="btnSecondary" disabled={magicLoading} style={{ width: "100%" }}>
                  {magicLoading ? "Sending link…" : "Continue with email link"}
                </button>
                {magicLinkMessage ? (
                  <p className="formSuccess" role="status">
                    {magicLinkMessage}
                  </p>
                ) : null}
              </form>
            ) : null}
            {!googleAvailable && !emailAvailable ? (
              <p className="muted" style={{ fontSize: 12 }}>
                Additional sign-in methods are currently disabled for this environment.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
