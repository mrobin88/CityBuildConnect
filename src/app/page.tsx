import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { defaultHomeForRole } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role) {
    redirect(defaultHomeForRole(session.user.role));
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "20px 24px",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          background: "var(--color-background-primary)",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 18 }}>CityBuild Connect</div>
        <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 }}>Mission Hiring Hall</div>
      </header>
      <main style={{ flex: 1, padding: "32px 24px", maxWidth: 560 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Trades apprenticeship placement</h1>
        <p className="muted" style={{ lineHeight: 1.5, marginBottom: 20 }}>
          A LinkedIn-style hub for workers, contractors, and hall staff—profiles, cert wallet, browse & match, and
          hours tracking.
        </p>
        <Link className="btnPrimary" href="/login" style={{ display: "inline-block" }}>
          Sign in
        </Link>
      </main>
    </div>
  );
}
