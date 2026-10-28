-- Learning journals are separate from accounts, reports and grades. Existing work is unchanged.
CREATE TABLE "LearningTracking" (
  "assignmentId" TEXT NOT NULL REFERENCES "Assignment"("id") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("assignmentId", "studentId")
);
CREATE TABLE "LearningEvent" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL REFERENCES "Assignment"("id") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('RUN_STARTED','RUN_COMPLETED','RUN_PAUSED','RESET','READING_RECORDED','HELP_REQUESTED','CALCULATION_FIXED')),
  "experimentId" TEXT,
  "payload" JSONB NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "LearningEvent_assignmentId_studentId_eventId_key" ON "LearningEvent"("assignmentId","studentId","eventId");
CREATE INDEX "LearningEvent_assignmentId_studentId_createdAt_idx" ON "LearningEvent"("assignmentId","studentId","createdAt");
CREATE INDEX "LearningEvent_createdAt_idx" ON "LearningEvent"("createdAt");
