import { PrismaClient, UserRole, JobPostingStatus, ProjectType } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_EMAILS = ["worker@buildconnect.local", "employer@buildconnect.local", "admin@buildconnect.local"] as const;

async function clearSeedUsers() {
  const users = await prisma.user.findMany({
    where: { email: { in: [...SEED_EMAILS] } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;

  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  await prisma.account.deleteMany({ where: { userId: { in: ids } } });
  await prisma.message.deleteMany({
    where: { OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] },
  });
  await prisma.hoursLog.deleteMany({
    where: { OR: [{ workerId: { in: ids } }, { employerId: { in: ids } }] },
  });
  await prisma.application.deleteMany({ where: { workerId: { in: ids } } });
  await prisma.jobPosting.deleteMany({ where: { employerId: { in: ids } } });
  await prisma.certification.deleteMany({ where: { workerId: { in: ids } } });
  await prisma.portfolioItem.deleteMany({ where: { workerId: { in: ids } } });
  await prisma.jobSiteExperience.deleteMany({ where: { workerId: { in: ids } } });
  await prisma.workerProfile.deleteMany({ where: { userId: { in: ids } } });
  await prisma.employerProfile.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await clearSeedUsers();

  const worker = await prisma.user.create({
    data: {
      email: "worker@buildconnect.local",
      name: "Jose Medina",
      phone: "(415) 555-0101",
      location: "San Francisco, CA",
      role: UserRole.WORKER,
      workerProfile: {
        create: {
          trade: "Electrical",
          apprenticeYear: 2,
          totalHours: 2140,
          unionLocal: "IBEW 6",
          bio: "Second-year electrical apprentice focused on commercial conduit and panel work.",
          certifications: {
            create: [
              {
                name: "OSHA 30",
                issuingBody: "OSHA",
                issueDate: new Date("2023-01-15"),
                expiryDate: new Date("2026-12-31"),
                verified: true,
              },
              {
                name: "Scaffold Safety",
                issuingBody: "SAIA",
                issueDate: new Date("2024-06-01"),
                expiryDate: new Date("2025-03-15"),
                verified: false,
              },
              {
                name: "NFPA 70E",
                issuingBody: "NFPA",
                issueDate: new Date("2024-08-10"),
                expiryDate: new Date("2026-08-10"),
                verified: true,
              },
            ],
          },
          jobSiteExperiences: {
            create: [
              {
                projectName: "Mission Rock — Building C",
                location: "Mission Bay, San Francisco, CA",
                companyName: "Turner Construction",
                roleOnSite: "Electrical apprentice (temp power & rough-in)",
                startDate: new Date("2024-03-01"),
                endDate: new Date("2024-11-30"),
                notes: "High-rise mixed-use; conduit runs and panel rough-in.",
                sortOrder: 0,
              },
              {
                projectName: "Civic Center seismic retrofit",
                location: "Civic Center, San Francisco",
                companyName: "Swinerton",
                roleOnSite: "Material handling & rough-in support",
                startDate: new Date("2023-06-01"),
                endDate: new Date("2024-02-28"),
                sortOrder: 1,
              },
            ],
          },
        },
      },
    },
    include: { workerProfile: true },
  });

  const wid = worker.workerProfile?.userId;
  if (wid) {
    const firstSite = await prisma.jobSiteExperience.findFirst({
      where: { workerId: wid },
      orderBy: { sortOrder: "asc" },
    });
    if (firstSite) {
      await prisma.portfolioItem.create({
        data: {
          workerId: wid,
          workSiteId: firstSite.id,
          title: "Panel rough-in — Building C",
          description: "Commercial service rough-in; EMT runs to MDP and tenant panels.",
          sortOrder: 0,
        },
      });
    }
  }

  const employer = await prisma.user.create({
    data: {
      email: "employer@buildconnect.local",
      name: "Turner Construction (demo)",
      phone: "(415) 555-0202",
      location: "SoMa, San Francisco",
      role: UserRole.EMPLOYER,
      employerProfile: {
        create: {
          companyName: "Turner Construction",
          licenseNumber: "CA-1234567",
          projectTypes: [ProjectType.COMMERCIAL, ProjectType.PUBLIC_WORKS],
          website: "https://example.com",
        },
      },
    },
    include: { employerProfile: true },
  });

  await prisma.user.create({
    data: {
      email: "admin@buildconnect.local",
      name: "Mission Hiring Hall Admin",
      phone: "(415) 555-0303",
      location: "Mission District, SF",
      role: UserRole.ADMIN,
    },
  });

  const ep = employer.employerProfile;
  if (!ep) throw new Error("Employer profile missing");

  await prisma.jobPosting.createMany({
    data: [
      {
        employerId: ep.userId,
        title: "Electrical apprentice",
        trade: "Electrical",
        location: "SoMa",
        hoursPerWeek: 40,
        openSlots: 10,
        description: "Commercial high-rise; conduit, panels, temp power.",
        status: JobPostingStatus.OPEN,
      },
      {
        employerId: ep.userId,
        title: "Ironworker – structural",
        trade: "Ironwork",
        location: "Mission Bay",
        hoursPerWeek: 40,
        openSlots: 8,
        description: "Structural steel, rigging experience a plus.",
        status: JobPostingStatus.OPEN,
      },
    ],
  });

  const electricalJob = await prisma.jobPosting.findFirst({
    where: { employerId: ep.userId, trade: "Electrical" },
  });

  if (electricalJob && worker.workerProfile) {
    await prisma.hoursLog.create({
      data: {
        workerId: worker.workerProfile.userId,
        employerId: ep.userId,
        jobId: electricalJob.id,
        date: new Date(),
        hours: 8,
        notes: "Panel rough-in",
        verified: true,
      },
    });
  }

  console.log("Seed complete:", [...SEED_EMAILS].join(", "));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
