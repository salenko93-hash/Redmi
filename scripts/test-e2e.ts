import "dotenv/config";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
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
const mailRoot = mkdtempSync(join(tmpdir(), "fizlab-smtp-test-"));
const cert = join(mailRoot, "cert.pem"),
  key = join(mailRoot, "key.pem");
execFileSync(
  "openssl",
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    key,
    "-out",
    cert,
    "-days",
    "1",
    "-subj",
    "/CN=localhost",
    "-addext",
    "subjectAltName=DNS:localhost,IP:127.0.0.1",
  ],
  { stdio: "ignore" },
);
const testEnv = {
  ...process.env,
  DATABASE_URL: target,
  APP_URL: "http://localhost:3100",
  E2E_BASE_URL: "http://localhost:3100",
  E2E_PORT: "3100",
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "2527",
  SMTP_SECURE: "true",
  SMTP_USER: "sender@example.com",
  SMTP_PASSWORD: "local-test-password",
  SMTP_FROM: "sender@example.com",
  PUBLIC_APP_URL: "https://fizlab.example.com",
  NODE_EXTRA_CA_CERTS: cert,
  E2E_SMTP_CERT: cert,
  E2E_SMTP_KEY: key,
};
const run = (args: string[]) => {
  const r = spawnSync("npm", args, { env: testEnv, stdio: "inherit" });
  if (r.status !== 0) throw new Error("Test command failed: " + args.join(" "));
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
try {
  run(["exec", "playwright", "test", ...process.argv.slice(2)]);
} finally {
  rmSync(mailRoot, { recursive: true, force: true });
}
