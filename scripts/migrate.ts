import "dotenv/config";
import { Client } from "pg";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
// Transactional SQL migrations avoid the experimental WASM introspector's handling of PostgreSQL's `name` type.
// Files are generated from schema.prisma; an applied migration is immutable and verified by SHA-256.
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("SELECT pg_advisory_lock(72819051)");
  await client.query(
    'CREATE TABLE IF NOT EXISTS "_fizlab_migrations" (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())',
  );
  const root = path.join(process.cwd(), "prisma/migrations");
  const dirs = (await readdir(root, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  for (const name of dirs) {
    const sql = await readFile(path.join(root, name, "migration.sql"), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const found = await client.query(
      'SELECT checksum FROM "_fizlab_migrations" WHERE name=$1',
      [name],
    );
    if (found.rowCount) {
      if (found.rows[0].checksum !== checksum)
        throw new Error(
          `Applied migration ${name} changed. Restore it and create a new migration.`,
        );
      console.log(`${name}: already applied`);
      continue;
    }
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO "_fizlab_migrations" (name,checksum) VALUES ($1,$2)',
        [name, checksum],
      );
      await client.query("COMMIT");
      console.log(`${name}: applied`);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(72819051)");
  await client.end();
}
