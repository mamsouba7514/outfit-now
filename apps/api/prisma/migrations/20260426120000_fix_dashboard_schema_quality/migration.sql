-- AlterTable: add updatedAt to DashAgent
ALTER TABLE "DashAgent" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: add updatedAt to DashTask
ALTER TABLE "DashTask" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: add updatedAt to DashOutput
ALTER TABLE "DashOutput" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex: DashAgent parentId
CREATE INDEX "DashAgent_parentId_idx" ON "DashAgent"("parentId");

-- CreateIndex: DashTask composite index
CREATE INDEX "DashTask_assignedAgentId_status_idx" ON "DashTask"("assignedAgentId", "status");

-- CreateIndex: DashTask status
CREATE INDEX "DashTask_status_idx" ON "DashTask"("status");

-- CreateIndex: DashOutput agentId
CREATE INDEX "DashOutput_agentId_idx" ON "DashOutput"("agentId");

-- CreateIndex: AgentBrief composite index
CREATE INDEX "AgentBrief_agentId_sentAt_idx" ON "AgentBrief"("agentId", "sentAt");

-- DropForeignKey: DashOutput taskId (old RESTRICT)
ALTER TABLE "DashOutput" DROP CONSTRAINT "DashOutput_taskId_fkey";

-- AddForeignKey: DashOutput taskId with CASCADE
ALTER TABLE "DashOutput" ADD CONSTRAINT "DashOutput_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "DashTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
