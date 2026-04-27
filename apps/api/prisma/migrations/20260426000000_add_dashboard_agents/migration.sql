-- CreateEnum
CREATE TYPE "DashAgentType" AS ENUM ('CLAUDE', 'HUMAN');

-- CreateEnum
CREATE TYPE "DashAgentStatus" AS ENUM ('IDLE', 'ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "DashTaskStatus" AS ENUM ('BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE');

-- CreateEnum
CREATE TYPE "DashOutputType" AS ENUM ('TEXT', 'IMAGE', 'URL');

-- CreateTable
CREATE TABLE "DashAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "type" "DashAgentType" NOT NULL,
    "parentId" TEXT,
    "status" "DashAgentStatus" NOT NULL DEFAULT 'IDLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "DashTaskStatus" NOT NULL DEFAULT 'BACKLOG',
    "assignedAgentId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashOutput" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "DashOutputType" NOT NULL,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentBrief" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentBy" TEXT NOT NULL,

    CONSTRAINT "AgentBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashOutput_taskId_key" ON "DashOutput"("taskId");

-- AddForeignKey
ALTER TABLE "DashAgent" ADD CONSTRAINT "DashAgent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DashAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashTask" ADD CONSTRAINT "DashTask_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "DashAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashOutput" ADD CONSTRAINT "DashOutput_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "DashTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashOutput" ADD CONSTRAINT "DashOutput_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "DashAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentBrief" ADD CONSTRAINT "AgentBrief_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "DashAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
