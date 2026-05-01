import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";
import { CompanyProfileForm } from "@/components/employer/company-profile-form";

export default function EmployerCompanyPage() {
  return <EmployerCompanyProfileData />;
}

async function EmployerCompanyProfileData() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "EMPLOYER") redirect(defaultHomeForRole(session.user.role));

  const [profile, user] = await Promise.all([
    prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        companyName: true,
        licenseNumber: true,
        website: true,
        logo: true,
        projectTypes: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, location: true },
    }),
  ]);

  const initial = {
    companyName: profile?.companyName ?? user?.name ?? "",
    licenseNumber: profile?.licenseNumber ?? null,
    website: profile?.website ?? null,
    logo: profile?.logo ?? null,
    location: user?.location ?? null,
    projectTypes: profile?.projectTypes ?? [],
  };

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Organization profile</h1>
      </header>
      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">Public organization details</span>
            </div>
            <CompanyProfileForm initial={initial} />
          </div>
        </div>
      </div>
    </div>
  );
}
