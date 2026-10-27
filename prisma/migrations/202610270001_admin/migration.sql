ALTER TABLE "User"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TeacherInvite"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "TeacherInvite_email_expiresAt_idx" ON "TeacherInvite"("email", "expiresAt");
CREATE TABLE "AdminAudit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT,
  "targetId" TEXT,
  "action" TEXT NOT NULL,
  "detail" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAudit_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AdminAudit_createdAt_idx" ON "AdminAudit"("createdAt");
