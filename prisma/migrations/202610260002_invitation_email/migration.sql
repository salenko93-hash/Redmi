ALTER TABLE "StudentInvite"
  ADD COLUMN "emailStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
  ADD COLUMN "emailAttemptId" TEXT,
  ADD COLUMN "emailAttemptAt" TIMESTAMP(3),
  ADD COLUMN "emailSentAt" TIMESTAMP(3);
