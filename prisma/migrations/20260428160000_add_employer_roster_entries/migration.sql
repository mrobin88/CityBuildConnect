-- Create table for employer-owned roster metadata per worker.
CREATE TABLE "EmployerRosterEntry" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "contactStatus" TEXT NOT NULL DEFAULT 'NEW',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "privateNotes" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerRosterEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmployerRosterEntry_employerId_workerId_key" ON "EmployerRosterEntry"("employerId", "workerId");
CREATE INDEX "EmployerRosterEntry_employerId_archived_updatedAt_idx" ON "EmployerRosterEntry"("employerId", "archived", "updatedAt");
CREATE INDEX "EmployerRosterEntry_workerId_idx" ON "EmployerRosterEntry"("workerId");

ALTER TABLE "EmployerRosterEntry"
ADD CONSTRAINT "EmployerRosterEntry_employerId_fkey"
FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployerRosterEntry"
ADD CONSTRAINT "EmployerRosterEntry_workerId_fkey"
FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
