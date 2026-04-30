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
    <div className="marketingShell">
      <header className="marketingHeader">
        <div>
          <div className="marketingBrand fxHingeBlink">HingeLine</div>
          <div className="marketingSub">Union Workforce Signal Network</div>
        </div>
        <div className="marketingActions">
          <Link className="btnSecondary" href="/signup">
            Create account
          </Link>
          <Link className="btnPrimary" href="/login">
            Sign in
          </Link>
        </div>
      </header>

      <main className="marketingMain">
        <section className="marketingHero">
          <p className="marketingKicker">Union workforce platform</p>
          <h1 className="marketingTitle">
            Connect skilled workers with the right job site, faster, with a sharper field ops signal.
          </h1>
          <p className="marketingLead">
            HingeLine gives employers a focused talent pipeline and gives workers a portable profile with certs, hours,
            portfolio, and messaging.
          </p>
          <div className="marketingActions">
            <Link className="btnPrimary" href="/signup">
              Get started
            </Link>
            <Link className="btnSecondary" href="/login">
              I already have an account
            </Link>
          </div>
        </section>

        <section className="marketingGrid">
          <article className="marketingCard">
            <h2>For employers</h2>
            <p>Post openings, browse candidate profiles, message workers, and manage applicant pipelines.</p>
          </article>
          <article className="marketingCard">
            <h2>For workers</h2>
            <p>Build a resume with trade history, cert wallet, project portfolio, and verified hours progress.</p>
          </article>
          <article className="marketingCard">
            <h2>For hiring halls</h2>
            <p>Coordinate placements with role-based access, compliance visibility, and standardized records.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
