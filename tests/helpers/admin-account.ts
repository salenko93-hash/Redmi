import type { Client } from "pg";
import { randomUUID } from "node:crypto";
/** Each scenario gets a separate admin so normal login rate limits remain enabled. */
export async function provisionTestAdmin(db: Client) {
  const database = (await db.query("SELECT current_database() AS name")).rows[0]
    .name;
  if (!database.endsWith("_test"))
    throw new Error("Disposable database required");
  const id = randomUUID(),
    email = `admin-fixture-${id}@test.invalid`;
  await db.query(
    'INSERT INTO "User" (id,email,name,"passwordHash",role,"isAdmin") SELECT $1,$2,$3,"passwordHash",\'TEACHER\',true FROM "User" WHERE email=$4',
    [id, email, "Тестовий адміністратор", "teacher@demo.test"],
  );
  return { id, email };
}
export async function releaseTestAdmin(db: Client, id: string) {
  await db.query('UPDATE "User" SET "isAdmin"=false WHERE id=$1', [id]);
}
