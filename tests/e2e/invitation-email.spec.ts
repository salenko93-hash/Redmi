import { test, expect, type APIRequestContext } from "@playwright/test";
import { Client } from "pg";
import { randomBytes, createHash } from "node:crypto";
import { smtpFixture } from "../helpers/smtp";
const origin = process.env.E2E_BASE_URL || "http://localhost:3100",
  headers = { Origin: origin };
async function account(
  api: APIRequestContext,
  db: Client,
  role: "TEACHER" | "STUDENT",
  email: string,
) {
  let invite: string | undefined;
  if (role === "TEACHER") {
    invite = randomBytes(24).toString("hex");
    await db.query(
      'INSERT INTO "TeacherInvite" ("tokenHash","expiresAt") VALUES ($1,NOW()+INTERVAL \'1 hour\')',
      [createHash("sha256").update(invite).digest("hex")],
    );
  }
  expect(
    (
      await api.post("/api/auth/register", {
        headers,
        data: {
          name: "Тест поштових запрошень",
          email,
          password: "EmailTest2026!",
          invite,
        },
      })
    ).status(),
  ).toBe(201);
}
test("teacher sends private invitations through TLS SMTP, with isolation, durable status and explicit retries", async ({
  page,
  playwright,
}) => {
  const target = process.env.DATABASE_URL;
  if (!target || !new URL(target).pathname.endsWith("_test"))
    throw new Error("Disposable test database required");
  const db = new Client({ connectionString: target });
  await db.connect();
  const smtp = await smtpFixture();
  const foreign = await playwright.request.newContext({ baseURL: origin }),
    pupil = await playwright.request.newContext({ baseURL: origin });
  const nonce = Date.now();
  try {
    await account(
      page.request,
      db,
      "TEACHER",
      `email-owner-${nonce}@test.invalid`,
    );
    await account(
      foreign,
      db,
      "TEACHER",
      `email-foreign-${nonce}@test.invalid`,
    );
    await account(pupil, db, "STUDENT", `email-joined-${nonce}@test.invalid`);
    const c = await (
      await page.request.post("/api/classes", {
        headers,
        data: { name: "Клас поштових запрошень" },
      })
    ).json();
    const endpoint = `/api/classes/${c.id}/students/email`;
    const imported = await page.request.post(
      `/api/classes/${c.id}/students/import`,
      {
        headers,
        data: {
          mode: "commit",
          csv: `ПІБ;Email\nОлена Успішна;olena@example.com\nМаксим Помилка;reject@example.com\nМарія Перевірка;uncertain@example.com\nБез Адреси;\nУже Приєднаний;email-joined-${nonce}@test.invalid`,
        },
      },
    );
    expect(imported.status()).toBe(201);
    expect(smtp.messages).toHaveLength(0);
    const invites = (
      await db.query<{ id: string; name: string; email: string; code: string }>(
        'SELECT id,name,email,code FROM "StudentInvite" WHERE "classroomId"=$1',
        [c.id],
      )
    ).rows;
    const success = invites.find((i) => i.email === "olena@example.com")!,
      reject = invites.find((i) => i.email === "reject@example.com")!,
      unknown = invites.find((i) => i.email === "uncertain@example.com")!,
      noEmail = invites.find((i) => !i.email)!,
      joined = invites.find((i) => i.name === "Уже Приєднаний")!;
    expect(
      (
        await pupil.post("/api/classes/join", {
          headers,
          data: { code: joined.code },
        })
      ).status(),
    ).toBe(200);
    expect((await pupil.get(endpoint)).status()).toBe(403);
    expect((await foreign.get(endpoint)).status()).toBe(404);
    expect(
      (
        await foreign.post(endpoint, { headers, data: { ids: [success.id] } })
      ).status(),
    ).toBe(404);
    expect(
      (
        await pupil.post(endpoint, { headers, data: { ids: [success.id] } })
      ).status(),
    ).toBe(403);
    expect(
      (
        await page.request.post(endpoint, { data: { ids: [success.id] } })
      ).status(),
    ).toBe(403);
    const state = await (await page.request.get(endpoint)).json();
    expect(state.configured).toBe(true);
    expect(state.invites).toHaveLength(4);
    expect(JSON.stringify(state)).not.toContain(process.env.SMTP_PASSWORD!);
    await page.goto(`/classes/${c.id}`);
    await page
      .getByRole("button", { name: "Надіслати коди на Email", exact: true })
      .click();
    const mail = page.getByRole("region", { name: "Розсилка кодів учням" });
    await expect(
      mail.getByRole("heading", { name: "Особисті запрошення учням" }),
    ).toBeVisible();
    await mail
      .getByRole("checkbox", {
        name: "Надіслати лист: Олена Успішна",
        exact: true,
      })
      .check();
    await mail
      .getByRole("button", { name: "Надіслати листи (1)", exact: true })
      .click();
    await expect(mail.getByRole("status")).toContainText("Передано пошті: 1");
    await expect(
      mail.getByRole("row").filter({ hasText: "Олена Успішна" }),
    ).toContainText("Передано пошті");
    expect(smtp.messages).toHaveLength(1);
    expect(smtp.messages[0].to).toBe("<olena@example.com>");
    const body = smtp.messages[0].data.match(
      /Content-Type: text\/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n([\s\S]*?)\r\n--/,
    );
    expect(body).toBeTruthy();
    const decoded = Buffer.from(body![1].replace(/\s/g, ""), "base64").toString(
      "utf8",
    );
    expect(decoded).toContain(success.code);
    expect(decoded).toContain("https://fizlab.example.com");
    expect(decoded).not.toContain("reject@example.com");
    expect(decoded).not.toContain("uncertain@example.com");
    const send = (ids: string[], resend = false) =>
      page.request.post(endpoint, { headers, data: { ids, resend } });
    expect(
      (
        await (
          await send([success.id, noEmail.id, joined.id, "missing"])
        ).json()
      ).results.every((r: { status: string }) => r.status === "skipped"),
    ).toBe(true);
    expect(smtp.messages).toHaveLength(1);
    const race = await Promise.all([send([reject.id]), send([reject.id])]);
    const outcomes = await Promise.all(
      race.map(async (r) => (await r.json()).results[0].status),
    );
    expect(outcomes.sort()).toEqual(["failed", "skipped"]);
    const ambiguous = await (await send([unknown.id])).json();
    expect(ambiguous.results[0].status).toBe("uncertain");
    expect(smtp.messages).toHaveLength(2);
    expect((await (await send([unknown.id])).json()).results[0].status).toBe(
      "skipped",
    );
    // Simulate time passing; no real minute-long delay is needed in this fixture.
    await db.query(
      'UPDATE "StudentInvite" SET "emailAttemptAt"=NOW()-INTERVAL \'3 minutes\' WHERE id=$1',
      [success.id],
    );
    expect((await (await send([success.id])).json()).results[0].status).toBe(
      "skipped",
    );
    const retryRace = await Promise.all([
      send([success.id], true),
      send([success.id], true),
    ]);
    const retried = await Promise.all(
      retryRace.map(async (r) => (await r.json()).results[0].status),
    );
    expect(retried.sort()).toEqual(["sent", "skipped"]);
    expect(smtp.messages).toHaveLength(3);
    const stored = (
      await db.query(
        'SELECT "emailStatus","emailSentAt",code FROM "StudentInvite" WHERE id=$1',
        [success.id],
      )
    ).rows[0];
    expect(stored.emailStatus).toBe("SENT");
    expect(stored.emailSentAt).toBeTruthy();
    expect(stored.code).toBe(success.code);
    await page.reload();
    await page
      .getByRole("button", { name: "Надіслати коди на Email", exact: true })
      .click();
    await expect(
      mail.getByRole("row").filter({ hasText: "Марія Перевірка" }),
    ).toContainText("Потребує перевірки");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await db.query(
      'UPDATE "StudentInvite" SET "emailStatus"=\'SENDING\', "emailAttemptAt"=NOW() WHERE id=$1',
      [reject.id],
    );
    expect(
      (
        await page.request.delete(
          `/api/classes/${c.id}/students/invites/${reject.id}`,
          { headers },
        )
      ).status(),
    ).toBe(409);
    expect(
      (await (await send([reject.id], true)).json()).results[0].status,
    ).toBe("skipped");
  } finally {
    await smtp.close();
    await foreign.dispose();
    await pupil.dispose();
    await db.end();
  }
});
