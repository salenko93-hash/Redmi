import { test, expect, type APIRequestContext } from "@playwright/test";
import { Client } from "pg";
import { randomBytes, createHash } from "node:crypto";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100",
  headers = { Origin: base },
  password = "RosterTest2026!";
async function testDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test"))
    throw new Error("Roster fixtures require a disposable _test database");
  const db = new Client({ connectionString: url });
  await db.connect();
  return db;
}
async function register(
  api: APIRequestContext,
  email: string,
  name: string,
  invite?: string,
) {
  expect(
    (
      await api.post("/api/auth/register", {
        headers,
        data: { email, name, password, invite },
      })
    ).status(),
  ).toBe(201);
  return (await api.get("/api/me")).json();
}
async function teacher(db: Client, api: APIRequestContext, email: string) {
  const token = randomBytes(24).toString("hex");
  await db.query(
    'INSERT INTO "TeacherInvite" ("tokenHash","expiresAt") VALUES ($1,NOW()+INTERVAL \'1 hour\')',
    [createHash("sha256").update(token).digest("hex")],
  );
  return register(api, email, "Тестовий учитель імпорту", token);
}
async function classroom(api: APIRequestContext, name: string) {
  const response = await api.post("/api/classes", { headers, data: { name } });
  expect(response.status()).toBe(201);
  return response.json();
}
async function imports(
  api: APIRequestContext,
  id: string,
  csv: string,
  mode = "commit",
) {
  return api.post(`/api/classes/${id}/students/import`, {
    headers,
    data: { csv, mode },
  });
}

test("teacher previews and imports CSV, pupils claim email-bound codes, and roster names reach the journal", async ({
  page,
  browser,
  playwright,
}) => {
  const db = await testDatabase(),
    nonce = Date.now();
  const pupilContext = await browser.newContext({ baseURL: base }),
    pupil = await pupilContext.newPage();
  const other = await playwright.request.newContext({ baseURL: base }),
    foreign = await playwright.request.newContext({ baseURL: base });
  try {
    await teacher(db, page.request, `roster-owner-${nonce}@test.invalid`);
    await teacher(db, foreign, `roster-foreign-${nonce}@test.invalid`);
    const pupilEmail = `roster-pupil-${nonce}@test.invalid`,
      otherEmail = `roster-other-${nonce}@test.invalid`;
    const registered = await register(
      pupil.request,
      pupilEmail,
      "Моє облікове ім’я",
    );
    await register(other, otherEmail, "Інший учень");
    const c = await classroom(page.request, `8-Б · CSV ${nonce}`),
      endpoint = `/api/classes/${c.id}/students`;
    const csv = `ПІБ;Email\r\nКоваленко Олена Іванівна;${pupilEmail}\r\nШевченко Максим Олегович;${otherEmail}\r\nКоваленко Олена Іванівна;${pupilEmail}\r\n`;
    expect((await imports(other, c.id, csv, "preview")).status()).toBe(403);
    expect((await imports(foreign, c.id, csv, "preview")).status()).toBe(404);
    expect((await foreign.get(endpoint + "/codes")).status()).toBe(404);
    const count = async () =>
      Number(
        (
          await db.query(
            'SELECT COUNT(*) FROM "StudentInvite" WHERE "classroomId"=$1',
            [c.id],
          )
        ).rows[0].count,
      );
    const userCount = (await db.query('SELECT COUNT(*) FROM "User"')).rows[0]
      .count;
    await page.goto(`/classes/${c.id}`);
    await page
      .getByRole("button", { name: "Імпортувати CSV", exact: true })
      .click();
    const content = page.getByLabel("Вміст CSV зі списком учнів", {
      exact: true,
    });
    await content.fill("ПІБ;Email\nПомилка;bad-email");
    await page
      .getByRole("button", { name: "Перевірити список", exact: true })
      .click();
    await expect(
      page
        .getByRole("region", { name: "Імпорт списку учнів" })
        .getByRole("alert"),
    ).toContainText("Некоректний Email");
    expect(await count()).toBe(0);
    expect(
      (
        await imports(page.request, c.id, "ПІБ;Email\nПомилка;bad-email")
      ).status(),
    ).toBe(422);
    expect(await count()).toBe(0);
    await page.getByLabel("Обрати CSV-файл", { exact: true }).setInputFiles({
      name: "students.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("\uFEFF" + csv, "utf8"),
    });
    await page
      .getByRole("button", { name: "Перевірити список", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Імпортувати 2 учнів", exact: true }),
    ).toBeVisible();
    expect(await count()).toBe(0);
    await expect(page.locator("[data-roster-invite]")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Імпортувати 2 учнів", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Створено запрошень: 2",
    );
    await expect(page.locator("[data-roster-invite]")).toHaveCount(2);
    expect(await count()).toBe(2);
    expect((await db.query('SELECT COUNT(*) FROM "User"')).rows[0].count).toBe(
      userCount,
    );
    const template = await page.request.get("/templates/students.csv");
    expect(template.status()).toBe(200);
    expect(await template.text()).toContain("ПІБ;Email");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page
        .getByRole("link", { name: "Завантажити коди CSV", exact: true })
        .click(),
    ]);
    expect(download.suggestedFilename()).toBe("fizlab-student-codes.csv");
    const exported = await page.request.get(endpoint + "/codes");
    expect(exported.headers()["cache-control"]).toBe("no-store");
    const text = await exported.text();
    expect(text).not.toContain("password");
    expect(text).not.toContain(password);
    const invitations = (
      await db.query<{ id: string; email: string; code: string }>(
        'SELECT id,email,code FROM "StudentInvite" WHERE "classroomId"=$1',
        [c.id],
      )
    ).rows;
    const first = invitations.find((i) => i.email === pupilEmail)!,
      second = invitations.find((i) => i.email === otherEmail)!;
    expect(first.code).toMatch(/^S[0-9A-F]{16}$/);
    expect(text).toContain(first.code);
    expect((await imports(page.request, c.id, csv)).status()).toBe(201);
    expect(await count()).toBe(2);
    expect(
      (
        await other.post("/api/classes/join", {
          headers,
          data: { code: first.code },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await foreign.delete(endpoint + "/invites/" + second.id, { headers })
      ).status(),
    ).toBe(404);
    await pupil.goto("/classes");
    await pupil
      .getByLabel("Код запрошення до класу", { exact: true })
      .fill(first.code.toLowerCase().replace(/(.{4})/g, "$1-"));
    await pupil
      .getByRole("button", { name: "Приєднатися", exact: true })
      .click();
    await expect(
      pupil.getByRole("link", { name: new RegExp(`8-Б · CSV ${nonce}`) }),
    ).toBeVisible();
    expect((await pupil.request.get("/api/me")).status()).toBe(200);
    expect((await (await pupil.request.get("/api/me")).json()).name).toBe(
      "Моє облікове ім’я",
    );
    expect((await pupil.request.get(endpoint + "/codes")).status()).toBe(403);
    await page.reload();
    await expect(page.locator("[data-roster-invite]")).toHaveCount(1);
    await expect(page.locator("[data-roster-member]")).toHaveCount(1);
    await expect(page.locator("[data-roster-member]")).toContainText(
      "Коваленко Олена Іванівна",
    );
    expect(
      (
        await pupil.request.post("/api/classes/join", {
          headers,
          data: { code: first.code },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await page.request.delete(endpoint + "/invites/" + first.id, {
          headers,
        })
      ).status(),
    ).toBe(409);
    const lab = (
      await db.query('SELECT id FROM "LabVersion" WHERE number=1 AND version=1')
    ).rows[0];
    const assigned = await page.request.post("/api/assignments", {
      headers,
      data: {
        classroomId: c.id,
        labVersionId: lab.id,
        dueAt: null,
        feedbackMode: "PRACTICE",
        experimentMode: "REAL",
      },
    });
    expect(assigned.status()).toBe(201);
    const assignment = await assigned.json();
    expect(
      (
        await pupil.request.put(
          `/api/assignments/${assignment.id}/submission`,
          {
            headers,
            data: { answers: { prediction: "Перевірка імпорту" }, revision: 0 },
          },
        )
      ).status(),
    ).toBe(200);
    await page.goto("/journal");
    await expect(
      page.getByRole("row").filter({ hasText: c.name }),
    ).toContainText("Коваленко Олена Іванівна");
    const grades = await page.request.get("/api/export");
    expect(await grades.text()).toContain("Коваленко Олена Іванівна");
    await page
      .getByRole("row")
      .filter({ hasText: c.name })
      .getByRole("link", { name: "Відкрити →", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Коваленко Олена Іванівна",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto(`/classes/${c.id}`);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page
      .getByRole("button", {
        name: "Прибрати з очікування: Шевченко Максим Олегович",
        exact: true,
      })
      .click();
    await expect(page.locator("[data-roster-invite]")).toHaveCount(0);
    expect(
      (
        await other.post("/api/classes/join", {
          headers,
          data: { code: second.code },
        })
      ).status(),
    ).toBe(404);
    expect((await other.get("/api/me")).status()).toBe(200);
    const membership = await db.query(
      'SELECT "rosterName" FROM "Membership" WHERE "classroomId"=$1 AND "userId"=$2',
      [c.id, registered.id],
    );
    expect(membership.rows[0].rosterName).toBe("Коваленко Олена Іванівна");
  } finally {
    await pupilContext.close();
    await other.dispose();
    await foreign.dispose();
    await db.end();
  }
});

test("concurrent roster imports are idempotent and a one-time invitation has only one claimant", async ({
  playwright,
}) => {
  const db = await testDatabase(),
    nonce = Date.now(),
    apis = await Promise.all(
      Array.from({ length: 4 }, () =>
        playwright.request.newContext({ baseURL: base }),
      ),
    );
  const [owner, a, b, common] = apis;
  try {
    await teacher(db, owner, `roster-race-owner-${nonce}@test.invalid`);
    await register(a, `roster-race-a-${nonce}@test.invalid`, "Перший учень");
    await register(b, `roster-race-b-${nonce}@test.invalid`, "Другий учень");
    const email = `roster-common-${nonce}@test.invalid`;
    await register(common, email, "Ім’я в обліковому записі");
    const c = await classroom(owner, `8-В · Race ${nonce}`),
      csv = `ПІБ;Email\nУчень без адреси;\nШкільне прізвище;${email}`;
    const responses = await Promise.all([
      imports(owner, c.id, csv),
      imports(owner, c.id, csv),
    ]);
    expect(responses.map((r) => r.status())).toEqual([201, 201]);
    const counts = await Promise.all(responses.map((r) => r.json()));
    expect(counts.map((c) => c.created).sort()).toEqual([0, 2]);
    const invites = (
      await db.query<{ id: string; code: string; email: string | null }>(
        'SELECT id,code,email FROM "StudentInvite" WHERE "classroomId"=$1',
        [c.id],
      )
    ).rows;
    const code = invites.find((i) => !i.email)!.code;
    const claims = await Promise.all([
      a.post("/api/classes/join", { headers, data: { code } }),
      b.post("/api/classes/join", { headers, data: { code } }),
    ]);
    expect(claims.map((r) => r.status()).sort()).toEqual([200, 404]);
    expect(
      (
        await common.post("/api/classes/join", {
          headers,
          data: { code: c.code },
        })
      ).status(),
    ).toBe(200);
    const memberships = (
      await db.query(
        'SELECT "rosterName" FROM "Membership" WHERE "classroomId"=$1',
        [c.id],
      )
    ).rows;
    expect(memberships).toHaveLength(2);
    expect(
      memberships.some((m) => m.rosterName === "Шкільне прізвище"),
    ).toBeTruthy();
    expect(
      Number(
        (
          await db.query(
            'SELECT COUNT(*) FROM "StudentInvite" WHERE "classroomId"=$1 AND "claimedAt" IS NULL',
            [c.id],
          )
        ).rows[0].count,
      ),
    ).toBe(0);
    const again = await imports(owner, c.id, csv);
    expect((await again.json()).created).toBe(0);
    const exportText = await (
      await owner.get(`/api/classes/${c.id}/students/codes`)
    ).text();
    expect(exportText).not.toContain(code);
    expect(exportText).toContain("Приєднався");
  } finally {
    await Promise.all(apis.map((a) => a.dispose()));
    await db.end();
  }
});
