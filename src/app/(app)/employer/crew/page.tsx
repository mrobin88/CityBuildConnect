import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultHomeForRole } from "@/lib/routes";
import { RosterManager, type RosterRow } from "@/components/employer/roster-manager";

export default function EmployerCrewPage() {
  return <EmployerCrewData />;
}

async function EmployerCrewData() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "EMPLOYER") redirect(defaultHomeForRole(session.user.role));

  const [hired, rosterEntries] = await Promise.all([
    prisma.application.findMany({
      where: { status: "HIRED", jobPosting: { employerId: session.user.id } },
      include: {
        worker: { include: { user: true } },
        jobPosting: { select: { title: true, location: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.employerRosterEntry.findMany({
      where: { employerId: session.user.id, archived: false },
      include: {
        worker: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 300,
    }),
  ]);

  const placementsByWorker = new Map<
    string,
    {
      count: number;
      latestPlacementLabel: string | null;
      workerName: string;
      workerTrade: string;
      totalHours: number;
    }
  >();

  for (const entry of hired) {
    const workerId = entry.workerId;
    const existing = placementsByWorker.get(workerId);
    const workerName = entry.worker.user.name ?? entry.worker.user.email ?? "Worker";
    const placementLabel = `${entry.jobPosting.title} · ${entry.jobPosting.location}`;

    if (existing) {
      existing.count += 1;
    } else {
      placementsByWorker.set(workerId, {
        count: 1,
        latestPlacementLabel: placementLabel,
        workerName,
        workerTrade: entry.worker.trade,
        totalHours: entry.worker.totalHours,
      });
    }
  }

  const rowsFromEntries: RosterRow[] = rosterEntries.map((row) => {
    const placement = placementsByWorker.get(row.workerId);
    return {
      workerId: row.workerId,
      workerName: row.worker.user.name ?? row.worker.user.email ?? "Worker",
      workerTrade: row.worker.trade,
      totalHours: row.worker.totalHours,
      placementCount: placement?.count ?? 0,
      latestPlacementLabel: placement?.latestPlacementLabel ?? null,
      contactStatus: row.contactStatus,
      tags: row.tags,
      privateNotes: row.privateNotes,
      lastContactAt: row.lastContactAt?.toISOString() ?? null,
    };
  });

  const rowsByWorker = new Map(rowsFromEntries.map((row) => [row.workerId, row]));
  for (const [workerId, summary] of placementsByWorker) {
    if (!rowsByWorker.has(workerId)) {
      rowsByWorker.set(workerId, {
        workerId,
        workerName: summary.workerName,
        workerTrade: summary.workerTrade,
        totalHours: summary.totalHours,
        placementCount: summary.count,
        latestPlacementLabel: summary.latestPlacementLabel,
        contactStatus: "NEW",
        tags: [],
        privateNotes: null,
        lastContactAt: null,
      });
    }
  }

  const rows = [...rowsByWorker.values()].sort((a, b) => {
    if (a.placementCount !== b.placementCount) return b.placementCount - a.placementCount;
    return a.workerName.localeCompare(b.workerName);
  });

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Roster</h1>
      </header>
      <div className="content">
        <div className="colMain">
          <div className="card">
            <div className="cardHeader">
              <span className="cardTitle">People you can back</span>
              <span className="muted">{rows.length} people</span>
            </div>
            <div className="cardBody">
              <RosterManager initialRows={rows} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
