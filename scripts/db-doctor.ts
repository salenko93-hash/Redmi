import "dotenv/config";
import { Client } from "pg";
import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { databaseConfig } from "../lib/postgres";

// Diagnostics only: never rewrite migration history or modify application data.
const hash = (sql: string) => createHash("sha256").update(sql).digest("hex");
const lifecycleName = "202610280001_access_lifecycle";
const publishedLifecycleHash =
  "518c90dc914d3eeaf755a65bc9b5474aace196170167259a0f99d28559b0aa3c";
if (!process.env.DATABASE_URL) {
  console.error(
    "У .env не задано DATABASE_URL. Значення й паролі в чат не надсилайте.",
  );
  process.exit(1);
}
const client = new Client(databaseConfig());
try {
  await client.connect();
  await client.query(
    "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY",
  );
  const meta = (
    await client.query(
      "SELECT current_schema() AS schema, current_setting('transaction_read_only') AS read_only",
    )
  ).rows[0];
  const columns = (
    await client.query(
      "SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = current_schema() ORDER BY table_name,column_name",
    )
  ).rows;
  const names = new Set(columns.map((c) => `${c.table_name}.${c.column_name}`));
  const missingColumns = Prisma.dmmf.datamodel.models
    .flatMap((model) =>
      model.fields
        .filter((f) => f.kind !== "object")
        .map((f) => `${model.dbName ?? model.name}.${f.dbName ?? f.name}`),
    )
    .filter((name) => !names.has(name))
    .sort();
  const hasHistory = (
    await client.query("SELECT to_regclass('_fizlab_migrations') AS history")
  ).rows[0].history;
  const records = hasHistory
    ? (
        await client.query(
          'SELECT name,checksum FROM "_fizlab_migrations" ORDER BY name',
        )
      ).rows
    : [];
  const recorded = new Map<string, string>(
    records.map((r) => [r.name, r.checksum]),
  );
  const root = path.join(process.cwd(), "prisma/migrations");
  const dirs = (await readdir(root, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const migrations = [];
  for (const name of dirs) {
    const sql = await readFile(path.join(root, name, "migration.sql"), "utf8");
    const currentChecksum = hash(sql),
      storedChecksum = recorded.get(name) ?? null;
    const lf = sql.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    const variants = [
      lf,
      lf.replace(/\n/g, "\r\n"),
      "\uFEFF" + lf,
      "\uFEFF" + lf.replace(/\n/g, "\r\n"),
    ].map(hash);
    migrations.push({
      name,
      state:
        storedChecksum === null
          ? "pending"
          : storedChecksum === currentChecksum
            ? "applied"
            : "checksum_mismatch",
      storedChecksum,
      currentChecksum,
      formattingOnly:
        storedChecksum !== null &&
        storedChecksum !== currentChecksum &&
        variants.includes(storedChecksum),
    });
  }
  const lifecycle = migrations.find((m) => m.name === lifecycleName);
  const index =
    (
      await client.query(
        "SELECT indexdef FROM pg_indexes WHERE schemaname=current_schema() AND indexname='Membership_classroomId_status_idx'",
      )
    ).rows[0]?.indexdef ?? null;
  const constraint =
    (
      await client.query(
        "SELECT pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=current_schema() AND t.relname='Membership' AND c.conname='Membership_status_check'",
      )
    ).rows[0]?.definition ?? null;
  console.log(
    JSON.stringify(
      {
        readOnly: meta.read_only === "on",
        schema: meta.schema,
        missingColumns,
        migrations: migrations.filter((m) => m.state !== "applied"),
        accessLifecycle: {
          ...lifecycle,
          localFileMatchesPublished:
            lifecycle?.currentChecksum === publishedLifecycleHash,
          userDeletedAt:
            columns.find(
              (c) => c.table_name === "User" && c.column_name === "deletedAt",
            ) ?? null,
          membershipStatus:
            columns.find(
              (c) =>
                c.table_name === "Membership" && c.column_name === "status",
            ) ?? null,
          index,
          constraint,
        },
        historyWithoutLocalFile: records
          .filter((r) => !dirs.includes(r.name))
          .map((r) => r.name),
      },
      null,
      2,
    ),
  );
} catch (error) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "DIAGNOSTIC_FAILED";
  console.error(
    `Не вдалося завершити діагностику. Код: ${code}. Дані й журнал міграцій не змінено.`,
  );
  process.exitCode = 1;
} finally {
  await client.query("ROLLBACK").catch(() => {});
  await client.end();
}
