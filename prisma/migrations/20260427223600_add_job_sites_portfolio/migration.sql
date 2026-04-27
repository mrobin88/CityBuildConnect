-- CreateTable
CREATE TABLE "JobSiteExperience" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "location" TEXT,
    "companyName" TEXT,
    "roleOnSite" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSiteExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "workSiteId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobSiteExperience_workerId_sortOrder_idx" ON "JobSiteExperience"("workerId", "sortOrder");

-- CreateIndex
CREATE INDEX "PortfolioItem_workerId_sortOrder_idx" ON "PortfolioItem"("workerId", "sortOrder");

-- CreateIndex
CREATE INDEX "Message_fromId_createdAt_idx" ON "Message"("fromId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_toId_createdAt_idx" ON "Message"("toId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_toId_read_idx" ON "Message"("toId", "read");

-- AddForeignKey
ALTER TABLE "JobSiteExperience" ADD CONSTRAINT "JobSiteExperience_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_workSiteId_fkey" FOREIGN KEY ("workSiteId") REFERENCES "JobSiteExperience"("id") ON DELETE SET NULL ON UPDATE CASCADE;

