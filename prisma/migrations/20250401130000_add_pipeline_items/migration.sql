-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('BACKLOG', 'PLANNED', 'IN_PROGRESS', 'REVIEW', 'SCHEDULED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "PipelineItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "status" "PipelineStatus" NOT NULL DEFAULT 'BACKLOG',
    "dueDate" TIMESTAMP(3),
    "youtubeVideoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PipelineItem_userId_idx" ON "PipelineItem"("userId");

-- CreateIndex
CREATE INDEX "PipelineItem_userId_status_idx" ON "PipelineItem"("userId", "status");
