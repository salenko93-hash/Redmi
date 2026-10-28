-- Bridge the released removedAt/isActive layout without changing its recorded checksum.
-- Old columns are retained. Backfill only fields created by this transition so replay
-- cannot undo later restorations made through the current application.
DO $$
DECLARE
  has_deleted BOOLEAN;
  has_status BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='User' AND column_name='deletedAt') INTO has_deleted;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Membership' AND column_name='status') INTO has_status;

  IF NOT has_deleted THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='User' AND column_name='removedAt' AND data_type IN ('timestamp without time zone', 'timestamp with time zone')) THEN
      RAISE EXCEPTION 'Cannot reconcile User: expected legacy removedAt timestamp';
    END IF;
    ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='User' AND column_name='removedAt' AND data_type='timestamp with time zone') THEN
      UPDATE "User" SET "deletedAt"="removedAt" AT TIME ZONE 'UTC' WHERE "removedAt" IS NOT NULL;
    ELSE
      UPDATE "User" SET "deletedAt"="removedAt" WHERE "removedAt" IS NOT NULL;
    END IF;
    UPDATE "User" SET "isActive"=false WHERE "deletedAt" IS NOT NULL;
  END IF;

  IF NOT has_status THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Membership' AND column_name='isActive' AND data_type='boolean')
       OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='Membership' AND column_name='removedAt' AND data_type IN ('timestamp without time zone', 'timestamp with time zone')) THEN
      RAISE EXCEPTION 'Cannot reconcile Membership: expected legacy isActive and removedAt';
    END IF;
    ALTER TABLE "Membership" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
    UPDATE "Membership" SET "status"=CASE WHEN "removedAt" IS NOT NULL THEN 'LEFT' WHEN "isActive" IS TRUE THEN 'ACTIVE' ELSE 'SUSPENDED' END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=current_schema() AND t.relname='Membership' AND c.conname='Membership_status_check') THEN
    ALTER TABLE "Membership" ADD CONSTRAINT "Membership_status_check" CHECK ("status" IN ('ACTIVE', 'SUSPENDED', 'LEFT'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Membership_classroomId_status_idx" ON "Membership"("classroomId", "status");
