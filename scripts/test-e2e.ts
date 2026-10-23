import "dotenv/config";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
const target = process.env.TEST_DATABASE_URL;
if (!target)
  throw new Error(
    "Set TEST_DATABASE_URL to a disposable PostgreSQL database ending in _test.",
  );
const url = new URL(target);
const production = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL)
  : null;
if (
  !url.pathname.endsWith("_test") ||
  (production &&
    url.host === production.host &&
    url.pathname === production.pathname)
)
  throw new Error("Refusing to reset a non-test or primary database.");
const testEnv = {
  ...process.env,
  DATABASE_URL: target,
  APP_URL: "http://localhost:3100",
  E2E_BASE_URL: "http://localhost:3100",
  E2E_PORT: "3100",
};
const run = (args: string[]) => {
  const r = spawnSync("npm", args, { env: testEnv, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run(["run", "db:migrate"]);
const db = new Client({ connectionString: target });
await db.connect();
try {
  await db.query(
    'TRUNCATE "User", "TeacherInvite", "RateLimit", "Classroom", "LabVersion" CASCADE',
  );
} finally {
  await db.end();
}
run(["run", "db:seed", "--", "--demo"]);
run(["exec", "playwright", "test"]);
