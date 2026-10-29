ALTER TABLE "Classroom" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "Classroom_teacherId_archivedAt_idx" ON "Classroom"("teacherId", "archivedAt");
