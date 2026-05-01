import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { defaultHomeForRole } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function EmployerSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "EMPLOYER") redirect(defaultHomeForRole(session.user.role));

  const integrations = [
    { label: "Google OAuth", ok: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) },
    { label: "Magic link email", ok: Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM) },
    { label: "SMS alerts", ok: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) },
    { label: "Cloud file storage", ok: Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING) },
  ];

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Settings</h1>
      </header>
      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Account</span>
            </div>
            <div className="cardBody" style={{ display: "grid", gap: 10 }}>
              <div className="muted">Signed in as {session.user.email ?? "employer"}.</div>
              <Link href="/employer/company" className="btnSecondary" style={{ width: "fit-content" }}>
                Edit organization profile
              </Link>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardHeader">
              <span className="cardTitle">Integration readiness</span>
            </div>
            <div className="cardBody" style={{ display: "grid", gap: 8 }}>
              {integrations.map((item) => (
                <div key={item.label} className="workerCard">
                  <div style={{ flex: 1 }}>{item.label}</div>
                  <span className={`tag ${item.ok ? "tagGreen" : "tagAmber"}`}>{item.ok ? "Configured" : "Needs setup"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
