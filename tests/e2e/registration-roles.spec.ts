import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { randomBytes, createHash } from "node:crypto";
const origin = process.env.E2E_BASE_URL || "http://localhost:3100";
const headers = { Origin: origin };
const password = "RoleTest2026!";

test("mobile role registration requires a teacher invitation and adds the teacher to the team", async ({
  page,
  playwright,
}, testInfo) => {
  const target = process.env.DATABASE_URL;
  if (!target || !new URL(target).pathname.endsWith("_test"))
    throw new Error("Disposable database required");
  const db = new Client({ connectionString: target });
  await db.connect();
  const admin = await playwright.request.newContext({ baseURL: origin });
  const nonce = Date.now();
  const email = `role-teacher-${nonce}@test.invalid`;
  const token = randomBytes(24).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const demo = (
    await db.query('SELECT id,"isAdmin" FROM "User" WHERE email=$1', [
      "teacher@demo.test",
    ])
  ).rows[0];
  try {
    await db.query(
      'INSERT INTO "TeacherInvite" ("tokenHash",email,"expiresAt") VALUES ($1,$2,NOW()+INTERVAL \'1 hour\')',
      [hash, email],
    );
    const post = (data: object) =>
      page.request.post("/api/auth/register", {
        headers,
        data: { name: "Новий учитель", password, email, ...data },
      });
    expect((await post({ role: "TEACHER" })).status()).toBe(400);
    expect((await post({ role: "ADMIN", invite: token })).status()).toBe(400);
    expect((await post({ role: "STUDENT", invite: token })).status()).toBe(400);
    expect((await post({ role: "STUDENT" })).status()).toBe(400);
    const pending = await post({
      role: "STUDENT",
      studentCode: "S0000000000000000",
    });
    expect(pending.status()).toBe(400);
    expect((await pending.json()).error).toContain("Оберіть «Учитель»");
    expect((await post({})).status()).toBe(400); // Old clients cannot silently create a pupil either.
    expect(
      (
        await post({
          role: "TEACHER",
          invite: token,
          email: `wrong-${nonce}@test.invalid`,
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await db.query(
          'SELECT "usedAt" FROM "TeacherInvite" WHERE "tokenHash"=$1',
          [hash],
        )
      ).rows[0].usedAt,
    ).toBeNull();
    expect(
      Number(
        (await db.query('SELECT count(*) FROM "User" WHERE email=$1', [email]))
          .rows[0].count,
      ),
    ).toBe(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Зареєструватися", exact: true })
      .click();
    const roles = page.getByRole("group", { name: "Я реєструюся як" });
    await expect(roles.getByRole("radio", { checked: true })).toHaveCount(0);
    await roles.getByRole("radio", { name: "Учитель", exact: true }).check();
    const code = page.getByLabel("Код запрошення вчителя", { exact: true });
    await expect(code).toBeVisible();
    await expect(code).toHaveAttribute("required", "");
    await page
      .getByLabel("Ім’я та прізвище", { exact: true })
      .fill("Новий учитель");
    await page.getByLabel("Електронна пошта", { exact: true }).fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByLabel("Повторіть пароль", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Зареєструватися", exact: true })
      .click();
    await expect(code).toBeFocused(); // Native validation blocks an empty code.
    await expect(
      page.getByRole("heading", { name: "Збережіть код відновлення" }),
    ).toHaveCount(0);
    await expect(
      page.getByText(/після реєстрації доступ учителя не обмежений/),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("registration-teacher-mobile.png"),
      fullPage: true,
      caret: "initial",
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: testInfo.outputPath("registration-teacher-desktop.png"),
      fullPage: true,
      caret: "initial",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await code.fill(` ${token} `);
    await page
      .getByRole("button", { name: "Зареєструватися", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Збережіть код відновлення" }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "Вас додано до команди вчителів",
    );
    const me = await (await page.request.get("/api/me")).json();
    expect(me.role).toBe("TEACHER");
    expect(me.isAdmin).toBe(false);
    await page
      .getByRole("button", { name: "Код збережено — продовжити" })
      .click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Inspect the real admin team after registration, not just the success text.
    await db.query('UPDATE "User" SET "isAdmin"=true WHERE id=$1', [demo.id]);
    expect(
      (
        await admin.post("/api/auth/login", {
          headers,
          data: { email: "teacher@demo.test", password: "LabDemo2026!" },
        })
      ).status(),
    ).toBe(200);
    const overview = await (await admin.get("/api/admin/overview")).json();
    expect(
      overview.teachers.some((t: { email: string }) => t.email === email),
    ).toBe(true);
    expect(
      overview.invitations.some((i: { email: string }) => i.email === email),
    ).toBe(false);
    expect(
      (
        await db.query(
          'SELECT "usedAt" FROM "TeacherInvite" WHERE "tokenHash"=$1',
          [hash],
        )
      ).rows[0].usedAt,
    ).not.toBeNull();

    const pupilEmail = `role-pupil-${nonce}@test.invalid`;
    const classroom = await (
      await page.request.post("/api/classes", {
        headers,
        data: { name: "Клас за особистим кодом" },
      })
    ).json();
    expect(
      (
        await page.request.post(
          `/api/classes/${classroom.id}/students/import`,
          {
            headers,
            data: {
              mode: "commit",
              csv: `ПІБ;Email\nУчень зі списку;${pupilEmail}`,
            },
          },
        )
      ).status(),
    ).toBe(201);
    const pupilCode = (
      await db.query(
        'SELECT code FROM "StudentInvite" WHERE email=$1 AND "classroomId"=$2',
        [pupilEmail, classroom.id],
      )
    ).rows[0].code;
    const studentPost = (data: object) =>
      post({ email: pupilEmail, role: "STUDENT", ...data });
    expect(
      (await studentPost({ studentCode: token.slice(0, 40) })).status(),
    ).toBe(400); // An admin code is not a pupil code.
    expect(
      (await studentPost({ role: "TEACHER", invite: pupilCode })).status(),
    ).toBe(400);
    expect(
      (await studentPost({ role: "TEACHER", studentCode: pupilCode })).status(),
    ).toBe(400);
    expect(
      (
        await studentPost({
          studentCode: pupilCode,
          email: `pupil-wrong-${nonce}@test.invalid`,
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await db.query(
          'SELECT "claimedAt" FROM "StudentInvite" WHERE code=$1',
          [pupilCode],
        )
      ).rows[0].claimedAt,
    ).toBeNull();

    await page.request.post("/api/auth/logout", { headers });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Зареєструватися", exact: true })
      .click();
    await page.getByRole("radio", { name: "Учитель", exact: true }).check();
    await page
      .getByLabel("Код запрошення вчителя", { exact: true })
      .fill(token);
    await page
      .getByRole("radio", { name: "Учень / учениця", exact: true })
      .check();
    await expect(
      page.getByLabel("Код запрошення вчителя", { exact: true }),
    ).toHaveCount(0);
    await page
      .getByLabel("Ім’я та прізвище", { exact: true })
      .fill("Новий учень");
    await page.getByLabel("Електронна пошта", { exact: true }).fill(pupilEmail);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByLabel("Повторіть пароль", { exact: true }).fill(password);
    const pupilInput = page.getByLabel("Особистий код учня", { exact: true });
    await expect(pupilInput).toHaveAttribute("required", "");
    await page
      .getByRole("button", { name: "Зареєструватися", exact: true })
      .click();
    await expect(pupilInput).toBeFocused();
    await page.screenshot({
      path: testInfo.outputPath("registration-pupil-mobile.png"),
      fullPage: true,
      caret: "initial",
    });
    await pupilInput.fill(pupilCode.toLowerCase());
    await page
      .getByRole("button", { name: "Зареєструватися", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Збережіть код відновлення" }),
    ).toBeVisible();
    const pupil = await (await page.request.get("/api/me")).json();
    expect(pupil.role).toBe("STUDENT");
    const membership = (
      await db.query(
        'SELECT "rosterName" FROM "Membership" WHERE "userId"=$1 AND "classroomId"=$2',
        [pupil.id, classroom.id],
      )
    ).rows[0];
    expect(membership.rosterName).toBe("Учень зі списку");
    expect(
      (
        await studentPost({
          email: `reused-${nonce}@test.invalid`,
          studentCode: pupilCode,
        })
      ).status(),
    ).toBe(400);
    expect(errors).toEqual([]);
  } finally {
    await db.query('UPDATE "User" SET "isAdmin"=$1 WHERE id=$2', [
      demo.isAdmin,
      demo.id,
    ]);
    await admin.dispose();
    await db.end();
  }
});
