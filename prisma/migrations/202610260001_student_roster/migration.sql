ALTER TABLE "Membership" ADD COLUMN "rosterName" TEXT;
CREATE TABLE "StudentInvite" (
  "id" TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "key" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "claimedById" TEXT,
  "claimedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentInvite_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentInvite_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StudentInvite_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StudentInvite_code_key" ON "StudentInvite"("code");
CREATE UNIQUE INDEX "StudentInvite_classroomId_key_key" ON "StudentInvite"("classroomId", "key");
CREATE UNIQUE INDEX "StudentInvite_classroomId_claimedById_key" ON "StudentInvite"("classroomId", "claimedById");
CREATE INDEX "StudentInvite_classroomId_createdAt_idx" ON "StudentInvite"("classroomId", "createdAt");
