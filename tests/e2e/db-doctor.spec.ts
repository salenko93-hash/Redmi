import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { randomBytes, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

test("database doctor distinguishes missing schema and newline drift without changing records or exposing data", async () => {
  const source = process.env.DATABASE_URL;
  if (!source || !new URL(source).pathname.endsWith("_test"))
    throw new Error("Disposable database required");
  const root = new Client({ connectionString: source });
  await root.connect();
  const name = `doctor_${randomBytes(6).toString("hex")}_test`;
  const url = new URL(source);
  url.pathname = "/" + name;
  const env = { ...process.env, DATABASE_URL: url.toString() };
  let created = false;
  const db = new Client({ connectionString: url.toString() });
  const run = (file: string) =>
    spawnSync(process.execPath, ["--import", "tsx", file], {
      env,
      encoding: "utf8",
    });
  const doctor = () => {
    const result = run("scripts/db-doctor.ts");
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("PRIVATE_SENTINEL");
    expect(result.stdout).not.toContain(url.password);
    return JSON.parse(result.stdout);
  };
  try {
    await root.query(`CREATE DATABASE "${name}"`);
    created = true;
    expect(run("scripts/migrate.ts").status).toBe(0);
    await db.connect();
    await db.query(
      'INSERT INTO "User" (id,email,name,"passwordHash") VALUES ($1,$2,$3,$4)',
      [
        "diagnosis-user",
        "PRIVATE_SENTINEL@test.invalid",
        "PRIVATE_SENTINEL",
        "PRIVATE_SENTINEL_HASH",
      ],
    );
    let report = doctor();
    expect(report.readOnly).toBe(true);
    expect(report.missingColumns).toEqual([]);
    expect(report.migrations).toEqual([]);
    expect(report.accessLifecycle.localFileMatchesPublished).toBe(true);
    expect(report.accessLifecycle.index).toContain("classroomId");
    const migration = "202610280001_access_lifecycle";
    const oldChecksum = createHash("sha256")
      .update("SELECT 1;\n")
      .digest("hex");
    await db.query('ALTER TABLE "User" DROP COLUMN "deletedAt"');
    await db.query(
      'UPDATE "_fizlab_migrations" SET checksum=$1 WHERE name=$2',
      [oldChecksum, migration],
    );
    report = doctor();
    expect(report.missingColumns).toEqual(["User.deletedAt"]);
    expect(report.accessLifecycle.state).toBe("checksum_mismatch");
    expect(report.accessLifecycle.formattingOnly).toBe(false);
    expect(report.accessLifecycle.storedChecksum).toBe(oldChecksum);
    expect(
      (
        await db.query(
          'SELECT checksum FROM "_fizlab_migrations" WHERE name=$1',
          [migration],
        )
      ).rows[0].checksum,
    ).toBe(oldChecksum);
    expect(
      (
        await db.query(
          'SELECT email,name,"passwordHash" FROM "User" WHERE id=$1',
          ["diagnosis-user"],
        )
      ).rows[0],
    ).toEqual({
      email: "PRIVATE_SENTINEL@test.invalid",
      name: "PRIVATE_SENTINEL",
      passwordHash: "PRIVATE_SENTINEL_HASH",
    });
    await db.query('ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3)');
    const sql = readFileSync(
      `prisma/migrations/${migration}/migration.sql`,
      "utf8",
    );
    const crlfChecksum = createHash("sha256")
      .update(sql.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n"))
      .digest("hex");
    await db.query(
      'UPDATE "_fizlab_migrations" SET checksum=$1 WHERE name=$2',
      [crlfChecksum, migration],
    );
    report = doctor();
    expect(report.missingColumns).toEqual([]);
    expect(report.accessLifecycle.formattingOnly).toBe(true);
    expect(
      (
        await db.query(
          'SELECT checksum FROM "_fizlab_migrations" WHERE name=$1',
          [migration],
        )
      ).rows[0].checksum,
    ).toBe(crlfChecksum);
  } finally {
    await db.end().catch(() => {});
    if (created) await root.query(`DROP DATABASE "${name}"`);
    await root.end();
  }
});
