import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { randomBytes, createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  ACCESS_MIGRATION,
  ACCESS_BRIDGE,
  LEGACY_ACCESS_CHECKSUM,
  CURRENT_ACCESS_CHECKSUM,
  ACCESS_BRIDGE_CHECKSUM,
} from "../../lib/access-lifecycle-compatibility";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

async function fixture(
  work: (
    db: Client,
    run: (file?: string) => ReturnType<typeof spawnSync>,
  ) => Promise<void>,
) {
  const source = process.env.DATABASE_URL;
  if (!source || !new URL(source).pathname.endsWith("_test"))
    throw new Error("Disposable database required");
  const root = new Client({ connectionString: source });
  await root.connect();
  const name = `reconcile_${randomBytes(6).toString("hex")}_test`;
  const url = new URL(source);
  url.pathname = "/" + name;
  const db = new Client({ connectionString: url.toString() });
  let created = false;
  try {
    await root.query(`CREATE DATABASE "${name}"`);
    created = true;
    await db.connect();
    const run = (file = "scripts/migrate.ts") =>
      spawnSync(process.execPath, ["--import", "tsx", file], {
        env: { ...process.env, DATABASE_URL: url.toString() },
        encoding: "utf8",
      });
    await work(db, run);
  } finally {
    await db.end().catch(() => {});
    if (created) await root.query(`DROP DATABASE "${name}"`);
    await root.end();
  }
}
async function legacy(db: Client) {
  await db.query(
    'CREATE TABLE "_fizlab_migrations" (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())',
  );
  for (const name of readdirSync("prisma/migrations")
    .filter((name) => name < ACCESS_MIGRATION && name.startsWith("20"))
    .sort()) {
    const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
    await db.query(sql);
    await db.query(
      'INSERT INTO "_fizlab_migrations" (name,checksum) VALUES ($1,$2)',
      [name, hash(sql)],
    );
  }
  await db.query(
    'ALTER TABLE "User" ADD COLUMN "removedAt" TIMESTAMP(3); ALTER TABLE "Membership" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "removedAt" TIMESTAMP(3)',
  );
  await db.query(
    'INSERT INTO "_fizlab_migrations" (name,checksum) VALUES ($1,$2)',
    [ACCESS_MIGRATION, LEGACY_ACCESS_CHECKSUM],
  );
}

test("legacy access reconciliation preserves history, reports and suspended/removed states and permits later restoration", async () =>
  fixture(async (db, run) => {
    await legacy(db);
    await db.query(
      `INSERT INTO "User" (id,email,name,"passwordHash","recoveryHash",role,"removedAt") VALUES ('teacher','teacher@test.invalid','Teacher','unchanged-password','unchanged-recovery','TEACHER',NULL),('removed','removed@test.invalid','Removed','saved-password','saved-recovery','TEACHER','2026-10-28 09:00:00')`,
    );
    for (const id of ["active", "suspended", "left", "removed-active"])
      await db.query(
        'INSERT INTO "User" (id,email,name,"passwordHash") VALUES ($1,$2,$1,$3)',
        [id, id + "@test.invalid", "student-password"],
      );
    await db.query(
      `INSERT INTO "Classroom" (id,name,code,"teacherId") VALUES ('class','Saved class','SAVEDCLASS','teacher')`,
    );
    for (const [id, active, removed] of [
      ["active", true, null],
      ["suspended", false, null],
      ["left", false, "2026-10-28 09:00:00"],
      ["removed-active", true, "2026-10-28 09:00:00"],
    ] as const)
      await db.query(
        'INSERT INTO "Membership" (id,"classroomId","userId","rosterName","isActive","removedAt") VALUES ($1,$2,$1,$1,$3,$4)',
        [id, "class", active, removed],
      );
    await db.query(
      `INSERT INTO "LabVersion" (id,number,title,content) VALUES ('lab',1,'Saved lab','{}'); INSERT INTO "Assignment" (id,"classroomId","labVersionId") VALUES ('assignment','class','lab'); INSERT INTO "Submission" (id,"assignmentId","studentId",status,revision,answers,score,"updatedAt") VALUES ('report','assignment','left','GRADED',4,'{"prediction":"keep this report"}',10,NOW()); INSERT INTO "Attempt" (id,"submissionId",revision,answers,score) VALUES ('attempt','report',4,'{"prediction":"keep this attempt"}',10); INSERT INTO "Comment" (id,"submissionId","authorId",field,body) VALUES ('comment','report','teacher','conclusion','Saved feedback')`,
    );
    const before = {} as Record<string, unknown>;
    for (const table of ["Classroom", "Submission", "Attempt", "Comment"])
      before[table] = (
        await db.query(`SELECT * FROM "${table}" ORDER BY id`)
      ).rows;
    const result = run();
    expect(result.status, String(result.stderr)).toBe(0);
    const memberships = (
      await db.query(
        'SELECT id,status,"isActive","removedAt" FROM "Membership" ORDER BY id',
      )
    ).rows;
    expect(memberships.map((m) => [m.id, m.status])).toEqual([
      ["active", "ACTIVE"],
      ["left", "LEFT"],
      ["removed-active", "LEFT"],
      ["suspended", "SUSPENDED"],
    ]);
    const removed = (
      await db.query(
        'SELECT "deletedAt","removedAt","isActive","passwordHash","recoveryHash" FROM "User" WHERE id=$1',
        ["removed"],
      )
    ).rows[0];
    expect(removed.deletedAt).toEqual(removed.removedAt);
    expect(removed.isActive).toBe(false);
    expect(removed.passwordHash).toBe("saved-password");
    expect(removed.recoveryHash).toBe("saved-recovery");
    for (const table of ["Classroom", "Submission", "Attempt", "Comment"])
      expect(
        (await db.query(`SELECT * FROM "${table}" ORDER BY id`)).rows,
      ).toEqual(before[table]);
    expect(
      (
        await db.query(
          'SELECT checksum FROM "_fizlab_migrations" WHERE name=$1',
          [ACCESS_MIGRATION],
        )
      ).rows[0].checksum,
    ).toBe(LEGACY_ACCESS_CHECKSUM);
    expect(
      (
        await db.query(
          'SELECT checksum FROM "_fizlab_migrations" WHERE name=$1',
          [ACCESS_BRIDGE],
        )
      ).rows[0].checksum,
    ).toBe(ACCESS_BRIDGE_CHECKSUM);
    const report = JSON.parse(String(run("scripts/db-doctor.ts").stdout));
    expect(report.missingColumns).toEqual([]);
    expect(report.accessLifecycle.state).toBe("recognized_legacy");
    expect(report.migrations).toEqual([]);
    // Old archive columns are retained as evidence, never replayed over a later restoration.
    await db.query(
      `UPDATE "User" SET "deletedAt"=NULL,"isActive"=true WHERE id='removed'; UPDATE "Membership" SET status='ACTIVE' WHERE id='left'`,
    );
    expect(run().status).toBe(0);
    await db.query(
      readFileSync(`prisma/migrations/${ACCESS_BRIDGE}/migration.sql`, "utf8"),
    );
    expect(
      (
        await db.query(
          `SELECT "deletedAt","isActive" FROM "User" WHERE id='removed'`,
        )
      ).rows[0],
    ).toEqual({ deletedAt: null, isActive: true });
    expect(
      (await db.query(`SELECT status FROM "Membership" WHERE id='left'`))
        .rows[0].status,
    ).toBe("ACTIVE");
    const unknown = "f".repeat(64);
    await db.query(
      'UPDATE "_fizlab_migrations" SET checksum=$1 WHERE name=$2',
      [unknown, ACCESS_MIGRATION],
    );
    expect(run().status).toBe(1);
    expect(
      (
        await db.query(
          'SELECT checksum FROM "_fizlab_migrations" WHERE name=$1',
          [ACCESS_MIGRATION],
        )
      ).rows[0].checksum,
    ).toBe(unknown);
  }));

test("reconciliation refuses an unexpected legacy layout before adding fields", async () =>
  fixture(async (db, run) => {
    await legacy(db);
    await db.query('ALTER TABLE "User" DROP COLUMN "removedAt"');
    expect(run().status).toBe(1);
    expect(
      (
        await db.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name='User' AND column_name='deletedAt'",
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await db.query(
          'SELECT checksum FROM "_fizlab_migrations" WHERE name=$1',
          [ACCESS_MIGRATION],
        )
      ).rows[0].checksum,
    ).toBe(LEGACY_ACCESS_CHECKSUM);
    expect(
      (
        await db.query('SELECT name FROM "_fizlab_migrations" WHERE name=$1', [
          ACCESS_BRIDGE,
        ])
      ).rows,
    ).toEqual([]);
  }));

test("fresh and current databases keep the original current checksum", async () =>
  fixture(async (db, run) => {
    expect(run().status).toBe(0);
    expect(run().status).toBe(0);
    expect(
      (
        await db.query(
          'SELECT checksum FROM "_fizlab_migrations" WHERE name=$1',
          [ACCESS_MIGRATION],
        )
      ).rows[0].checksum,
    ).toBe(CURRENT_ACCESS_CHECKSUM);
    expect(
      (
        await db.query(
          'SELECT checksum FROM "_fizlab_migrations" WHERE name=$1',
          [ACCESS_BRIDGE],
        )
      ).rows[0].checksum,
    ).toBe(ACCESS_BRIDGE_CHECKSUM);
  }));

test("legacy timestamp-with-time-zone markers retain their UTC instant", async () =>
  fixture(async (db, run) => {
    await legacy(db);
    await db.query(
      `ALTER TABLE "User" ALTER COLUMN "removedAt" TYPE TIMESTAMPTZ USING "removedAt" AT TIME ZONE 'UTC'; ALTER TABLE "Membership" ALTER COLUMN "removedAt" TYPE TIMESTAMPTZ USING "removedAt" AT TIME ZONE 'UTC'; INSERT INTO "User" (id,email,name,"passwordHash","removedAt") VALUES ('timezone','timezone@test.invalid','Timezone','saved','2026-10-28T12:00:00+03:00')`,
    );
    expect(run().status).toBe(0);
    expect(
      (
        await db.query(
          `SELECT "deletedAt"::text AS value,"isActive" FROM "User" WHERE id='timezone'`,
        )
      ).rows[0],
    ).toEqual({ value: "2026-10-28 09:00:00", isActive: false });
  }));
