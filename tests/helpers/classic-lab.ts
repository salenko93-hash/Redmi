import { Client } from "pg";

/** Address the preserved fixture directly, independently of optional navigation links. */
export async function classicLabId() {
  const target = process.env.DATABASE_URL;
  if (!target || !new URL(target).pathname.endsWith("_test"))
    throw new Error("Disposable test database required");
  const db = new Client({ connectionString: target });
  await db.connect();
  try {
    const result = await db.query<{ id: string }>(
      'SELECT id FROM "LabVersion" WHERE number=1 AND version=1 AND "authorId" IS NULL',
    );
    if (!result.rows[0]) throw new Error("Classic first-lab fixture missing");
    return result.rows[0].id;
  } finally {
    await db.end();
  }
}
