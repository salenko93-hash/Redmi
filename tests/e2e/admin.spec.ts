import { test, expect, type APIRequestContext } from "@playwright/test";
import { Client } from "pg";
import { randomBytes, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { smtpFixture } from "../helpers/smtp";
const origin = process.env.E2E_BASE_URL || "http://localhost:3100",
  headers = { Origin: origin },
  password = "AdminTest2026!";
async function register(
  api: APIRequestContext,
  email: string,
  name: string,
  invite?: string,
) {
  return api.post("/api/auth/register", {
    headers,
    data: {
      email,
      name,
      password,
      invite,
      isAdmin: true,
      role: invite ? "TEACHER" : undefined,
    },
  });
}
function grant(email: string) {
  return spawnSync("npm", ["run", "admin:grant", "--", "--email", email], {
    env: process.env,
    encoding: "utf8",
  });
}
test("one of four teachers administers invitations and access while class reports stay isolated", async ({
  page,
  playwright,
}, testInfo) => {
  const target = process.env.DATABASE_URL;
  if (!target || !new URL(target).pathname.endsWith("_test"))
    throw new Error("Disposable database required");
  const db = new Client({ connectionString: target });
  await db.connect();
  const smtp = await smtpFixture(),
    nonce = Date.now();
  const contexts = await Promise.all(
    Array.from({ length: 5 }, () =>
      playwright.request.newContext({ baseURL: origin }),
    ),
  );
  const [b, c, d, pupil, wrong] = contexts;
  const adminEmail = `admin-${nonce}@test.invalid`,
    bEmail = `teacher-b-${nonce}@test.invalid`,
    cEmail = `teacher-c-${nonce}@test.invalid`,
    dEmail = `teacher-d-${nonce}@test.invalid`;
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  try {
    const legacy = randomBytes(24).toString("hex");
    await db.query(
      'INSERT INTO "TeacherInvite" ("tokenHash","expiresAt") VALUES ($1,NOW()+INTERVAL \'1 hour\')',
      [createHash("sha256").update(legacy).digest("hex")],
    );
    expect(
      (
        await register(
          page.request,
          adminEmail,
          "Учитель-адміністратор",
          legacy,
        )
      ).status(),
    ).toBe(201);
    const admin = await (await page.request.get("/api/me")).json();
    expect(admin.role).toBe("TEACHER");
    expect(admin.isAdmin).toBe(false);
    expect((await page.request.get("/api/admin/overview")).status()).toBe(403);
    await page.goto("/admin");
    expect(await page.title()).toBeTruthy();
    expect(grant(adminEmail).status).toBe(0);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Команда та доступ", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Адміністрування", exact: true }).first(),
    ).toBeVisible();
    await page.getByLabel("Email учителя", { exact: true }).fill(bEmail);
    await page
      .getByRole("button", { name: "Створити запрошення", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", {
        name: "Код запрошення вчителя",
        exact: true,
      }),
    ).toBeVisible();
    const codeB = await page
      .getByLabel("Код запрошення вчителя", { exact: true })
      .inputValue();
    expect(codeB).toMatch(/^[0-9a-f]{48}$/);
    expect(
      (
        await register(
          wrong,
          `wrong-${nonce}@test.invalid`,
          "Інша адреса",
          codeB,
        )
      ).status(),
    ).toBe(400);
    expect((await register(b, bEmail, "Учитель Б", codeB)).status()).toBe(201);
    const invite = async (email: string) => {
      const response = await page.request.post("/api/admin/invites", {
        headers,
        data: { email },
      });
      expect(response.status()).toBe(201);
      return response.json();
    };
    const codeC = await invite(cEmail),
      codeD = await invite(dEmail);
    expect((await register(c, cEmail, "Учитель В", codeC.token)).status()).toBe(
      201,
    );
    expect((await register(d, dEmail, "Учитель Г", codeD.token)).status()).toBe(
      201,
    );
    expect(
      (
        await register(
          pupil,
          `pupil-admin-${nonce}@test.invalid`,
          "Учень адміністративного тесту",
        )
      ).status(),
    ).toBe(201);
    const pupilUser = await (await pupil.get("/api/me")).json();
    expect(pupilUser.role).toBe("STUDENT");
    expect(pupilUser.isAdmin).toBe(false);
    expect(grant(pupilUser.email).status).toBe(1);
    expect((await pupil.get("/api/admin/overview")).status()).toBe(403);
    expect((await b.get("/api/admin/overview")).status()).toBe(403);
    expect(
      (
        await b.post("/api/admin/invites", {
          headers,
          data: { email: "bad@example.com" },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await page.request.post("/api/admin/invites", {
          data: { email: "no-origin@example.com" },
        })
      ).status(),
    ).toBe(403);
    const bUser = await (await b.get("/api/me")).json();
    const classB = await (
      await b.post("/api/classes", {
        headers,
        data: { name: "Особистий клас учителя Б" },
      })
    ).json();
    expect(
      (
        await pupil.post("/api/classes/join", {
          headers,
          data: { code: classB.code },
        })
      ).status(),
    ).toBe(200);
    const lab = (
      await db.query('SELECT id FROM "LabVersion" WHERE number=1 AND version=1')
    ).rows[0];
    const assignment = await (
      await b.post("/api/assignments", {
        headers,
        data: {
          classroomId: classB.id,
          labVersionId: lab.id,
          dueAt: null,
          feedbackMode: "PRACTICE",
          experimentMode: "REAL",
        },
      })
    ).json();
    const saved = await pupil.put(
      `/api/assignments/${assignment.id}/submission`,
      {
        headers,
        data: {
          answers: { prediction: "Збережений звіт після блокування вчителя" },
          revision: 0,
        },
      },
    );
    expect(saved.status()).toBe(200);
    const report = (
      await db.query(
        'SELECT id,answers FROM "Submission" WHERE "assignmentId"=$1',
        [assignment.id],
      )
    ).rows[0];
    // Next may stream not-found pages with HTTP 200; assert no private content leaks.
    expect(
      await (await page.request.get(`/classes/${classB.id}`)).text(),
    ).not.toContain(classB.name);
    expect(
      await (await page.request.get(`/review/${report.id}`)).text(),
    ).not.toContain(report.answers.prediction);
    expect(await (await c.get(`/classes/${classB.id}`)).text()).not.toContain(
      classB.name,
    );
    expect(
      (
        await page.request.get(`/api/classes/${classB.id}/students/codes`)
      ).status(),
    ).toBe(404);
    expect(await (await page.request.get("/api/export")).text()).not.toContain(
      classB.name,
    );
    await page.goto("/admin");
    const teachers = page.getByRole("region", { name: "Керування вчителями" });
    await expect(teachers.getByText(bEmail, { exact: true })).toBeVisible();
    await expect(teachers.getByText(cEmail, { exact: true })).toBeVisible();
    await expect(teachers.getByText(dEmail, { exact: true })).toBeVisible();
    await page
      .getByRole("button", {
        name: "Призупинити доступ: Учитель Б",
        exact: true,
      })
      .click();
    await expect(
      page.locator(`[data-admin-teacher="${bUser.id}"]`),
    ).toContainText("Призупинено");
    expect((await b.get("/api/me")).status()).toBe(401);
    expect(
      (
        await b.post("/api/auth/login", {
          headers,
          data: { email: bEmail, password },
        })
      ).status(),
    ).toBe(401);
    expect((await c.get("/api/me")).status()).toBe(200);
    expect(grant(bEmail).status).toBe(1);
    await page
      .getByRole("button", { name: "Відновити доступ: Учитель Б", exact: true })
      .click();
    await expect(
      page.locator(`[data-admin-teacher="${bUser.id}"]`),
    ).toContainText("Активний");
    expect((await b.get("/api/me")).status()).toBe(401); // Old sessions remain revoked.
    expect(
      (
        await b.post("/api/auth/login", {
          headers,
          data: { email: bEmail, password },
        })
      ).status(),
    ).toBe(200);
    expect(await (await b.get(`/classes/${classB.id}`)).text()).toContain(
      classB.name,
    );
    expect(
      (
        await db.query('SELECT answers FROM "Submission" WHERE id=$1', [
          report.id,
        ])
      ).rows[0].answers,
    ).toEqual(report.answers);
    expect(
      (
        await page.request.patch(`/api/admin/teachers/${admin.id}`, {
          headers,
          data: { active: false },
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await page.request.patch(`/api/admin/teachers/${pupilUser.id}`, {
          headers,
          data: { active: false },
        })
      ).status(),
    ).toBe(404);
    const pendingEmail = `pending-${nonce}@test.invalid`;
    const race = await Promise.all([
      page.request.post("/api/admin/invites", {
        headers,
        data: { email: pendingEmail },
      }),
      page.request.post("/api/admin/invites", {
        headers,
        data: { email: pendingEmail },
      }),
    ]);
    expect(race.map((r) => r.status()).sort()).toEqual([201, 409]);
    const pending = await race.find((r) => r.status() === 201)!.json();
    await page.reload();
    await page
      .getByRole("button", {
        name: `Відкликати запрошення: ${pendingEmail}`,
        exact: true,
      })
      .click();
    await expect(
      page
        .getByRole("region", { name: "Чинні запрошення вчителів" })
        .getByText(pendingEmail, { exact: true }),
    ).toHaveCount(0);
    expect(
      (
        await register(
          wrong,
          pendingEmail,
          "Відкликане запрошення",
          pending.token,
        )
      ).status(),
    ).toBe(400);
    const used = createHash("sha256").update(codeB).digest("hex");
    expect(
      (
        await page.request.delete(`/api/admin/invites/${used}`, { headers })
      ).status(),
    ).toBe(409);
    await page
      .getByRole("button", {
        name: "Перевірити підключення пошти",
        exact: true,
      })
      .click();
    await expect(page.getByRole("status")).toContainText("Листів не надсилали");
    expect(smtp.messages).toHaveLength(0);
    const overview = await (
      await page.request.get("/api/admin/overview")
    ).json();
    expect(
      overview.audit.some(
        (a: { action: string }) => a.action === "TEACHER_BLOCKED",
      ),
    ).toBe(true);
    expect(
      overview.audit.some(
        (a: { action: string }) => a.action === "MAIL_CHECK_OK",
      ),
    ).toBe(true);
    const serialized = JSON.stringify(overview);
    expect(serialized).not.toContain(codeB);
    expect(serialized).not.toContain(pending.token);
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("SMTP_PASSWORD");
    expect(serialized).not.toContain(report.answers.prediction);
    await page.setViewportSize({ width: 1680, height: 1100 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath("admin-desktop.png"),
      caret: "initial",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath("admin-mobile.png"),
      caret: "initial",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(pageErrors).toEqual([]);
    expect(grant(bEmail).status).toBe(0);
    expect((await (await b.get("/api/me")).json()).isAdmin).toBe(true);
    const blockRace = await Promise.all([
      page.request.patch(`/api/admin/teachers/${bUser.id}`, {
        headers,
        data: { active: false },
      }),
      b.patch(`/api/admin/teachers/${admin.id}`, {
        headers,
        data: { active: false },
      }),
    ]);
    expect(blockRace.filter((r) => r.status() === 200)).toHaveLength(1);
    expect(
      blockRace.filter((r) => [401, 403, 409].includes(r.status())),
    ).toHaveLength(1);
    expect(
      Number(
        (
          await db.query(
            'SELECT COUNT(*) FROM "User" WHERE "isAdmin"=true AND "isActive"=true',
          )
        ).rows[0].count,
      ),
    ).toBe(1);
  } finally {
    await smtp.close();
    await Promise.all(contexts.map((context) => context.dispose()));
    await db.end();
  }
});
