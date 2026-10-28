import { test, expect } from "@playwright/test";
import { Client } from "pg";
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const headers = { Origin: baseURL };
const password = "LabDemo2026!";

test("teacher deletion frees the email for a new invitation; class access remains recoverable", async ({
  playwright,
  page,
}) => {
  if (
    !process.env.DATABASE_URL ||
    !new URL(process.env.DATABASE_URL).pathname.endsWith("_test")
  )
    throw new Error("Test database required");
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const admin = await playwright.request.newContext({ baseURL });
  const student = await playwright.request.newContext({ baseURL });
  const colleague = await playwright.request.newContext({ baseURL });
  try {
    await db.query('UPDATE "User" SET "isAdmin" = true WHERE email = $1', [
      "teacher@demo.test",
    ]);
    expect(
      (
        await admin.post("/api/auth/login", {
          headers,
          data: { email: "teacher@demo.test", password },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await student.post("/api/auth/login", {
          headers,
          data: { email: "student@demo.test", password },
        })
      ).ok(),
    ).toBeTruthy();
    const email = `lifecycle-${Date.now()}@test.invalid`;
    const invite = await (
      await admin.post("/api/admin/invites", { headers, data: { email } })
    ).json();
    expect(
      (
        await colleague.post("/api/auth/register", {
          headers,
          data: {
            email,
            password,
            name: "Колега",
            role: "TEACHER",
            invite: invite.token,
          },
        })
      ).status(),
    ).toBe(201);
    const target = await (await colleague.get("/api/me")).json();
    const owned = await (
      await colleague.post("/api/classes", {
        headers,
        data: { name: "Збережений клас" },
      })
    ).json();
    expect(
      (
        await colleague.delete(`/api/admin/teachers/${target.id}`, { headers })
      ).status(),
    ).toBe(403);
    expect(
      (
        await admin.patch(`/api/admin/teachers/${target.id}`, {
          headers,
          data: { active: false },
        })
      ).ok(),
    ).toBeTruthy();
    expect((await colleague.get("/api/me")).status()).toBe(401);
    expect(
      (
        await admin.patch(`/api/admin/teachers/${target.id}`, {
          headers,
          data: { active: true },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await colleague.post("/api/auth/login", {
          headers,
          data: { email, password },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await admin.delete(`/api/admin/teachers/${target.id}`, {
          headers,
          data: {},
        })
      ).status(),
    ).toBe(400);
    await db.query(
      'UPDATE "User" SET "isActive"=false, "removedAt"=NOW() WHERE id=$1',
      [target.id],
    );
    expect(
      (
        await admin.delete(`/api/admin/teachers/${target.id}`, {
          headers,
          data: { confirmed: true },
        })
      ).ok(),
    ).toBeTruthy();
    expect((await colleague.get("/api/me")).status()).toBe(401);
    expect(
      (
        await colleague.post("/api/auth/login", {
          headers,
          data: { email, password },
        })
      ).status(),
    ).toBe(401);
    expect(
      (await db.query('SELECT id FROM "Classroom" WHERE id=$1', [owned.id]))
        .rowCount,
    ).toBe(1);
    expect(
      (await db.query('SELECT id FROM "User" WHERE id=$1', [target.id]))
        .rowCount,
    ).toBe(0);
    expect(
      (
        await db.query('SELECT "teacherId" FROM "Classroom" WHERE id=$1', [
          owned.id,
        ])
      ).rows[0].teacherId,
    ).not.toBe(target.id);
    expect(
      (
        await admin.patch(`/api/admin/teachers/${target.id}`, {
          headers,
          data: { active: true },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await colleague.post("/api/auth/register", {
          headers,
          data: {
            email,
            password,
            name: "Старий код",
            role: "TEACHER",
            invite: invite.token,
          },
        })
      ).ok(),
    ).toBeFalsy();
    const fresh = await admin.post("/api/admin/invites", {
      headers,
      data: { email },
    });
    expect(fresh.status()).toBe(201);
    const freshInvite = await fresh.json();
    const newPassword = "NewAccount2026!";
    expect(
      (
        await colleague.post("/api/auth/register", {
          headers,
          data: {
            email,
            password: newPassword,
            name: "Новий обліковий запис",
            role: "TEACHER",
            invite: freshInvite.token,
          },
        })
      ).status(),
    ).toBe(201);
    const replacement = await (await colleague.get("/api/me")).json();
    expect(replacement.id).not.toBe(target.id);
    expect(replacement.isAdmin).toBe(false);
    expect(
      (
        await db.query('SELECT id FROM "Classroom" WHERE "teacherId"=$1', [
          replacement.id,
        ])
      ).rowCount,
    ).toBe(0);
    const self = await (await admin.get("/api/me")).json();
    expect(
      (
        await admin.delete(`/api/admin/teachers/${self.id}`, {
          headers,
          data: { confirmed: true },
        })
      ).status(),
    ).toBe(409);

    const classroom = await (
      await admin.post("/api/classes", {
        headers,
        data: { name: "Вибуття учня" },
      })
    ).json();
    expect(
      (
        await student.post("/api/classes/join", {
          headers,
          data: { code: classroom.code },
        })
      ).ok(),
    ).toBeTruthy();
    const pupil = await (await student.get("/api/me")).json();
    const template = (
      await db.query('SELECT id FROM "LabVersion" WHERE number=1 AND version=1')
    ).rows[0];
    const assignment = await (
      await admin.post("/api/assignments", {
        headers,
        data: {
          classroomId: classroom.id,
          labVersionId: template.id,
          dueAt: null,
          feedbackMode: "PRACTICE",
          experimentMode: "REAL",
        },
      })
    ).json();
    const work = `/api/assignments/${assignment.id}/submission`;
    expect(
      (
        await student.put(work, {
          headers,
          data: { revision: 0, answers: { prediction: "Збережена відповідь" } },
        })
      ).ok(),
    ).toBeTruthy();
    const member = `/api/classes/${classroom.id}/members/${pupil.id}`;
    expect((await colleague.delete(member, { headers })).status()).toBe(404);
    expect((await student.delete(member, { headers })).status()).toBe(403);
    for (const method of ["PATCH", "DELETE"]) {
      const response =
        method === "PATCH"
          ? await admin.patch(member, { headers, data: { active: false } })
          : await admin.delete(member, { headers });
      expect(response.ok()).toBeTruthy();
      expect((await student.get(work)).status()).toBe(404);
      expect(
        (
          await student.put(work, {
            headers,
            data: { revision: 1, answers: {} },
          })
        ).status(),
      ).toBe(404);
      expect(
        (
          await student.post("/api/classes/join", {
            headers,
            data: { code: classroom.code },
          })
        ).status(),
      ).toBe(403);
      expect((await student.get("/api/me")).ok()).toBeTruthy();
      expect(
        (await admin.patch(member, { headers, data: { active: true } })).ok(),
      ).toBeTruthy();
      expect((await (await student.get(work)).json()).answers.prediction).toBe(
        "Збережена відповідь",
      );
    }
    await page.goto("/");
    await page
      .getByLabel("Електронна пошта", { exact: true })
      .fill("teacher@demo.test");
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Увійти", exact: true }).click();
    await page.waitForURL("**/dashboard");
    await page.goto(`/classes/${classroom.id}`);
    const row = page.locator(`[data-roster-member="${pupil.id}"]`);
    await expect(
      row.getByRole("button", { name: /Призупинити/ }),
    ).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: /Видалити з класу/ }).click();
    await expect(
      row.getByText("Вибув / вибула", { exact: true }),
    ).toBeVisible();
    await row.getByRole("button", { name: /Відновити/ }).click();
    await expect(
      row.getByText("Активний доступ", { exact: true }),
    ).toBeVisible();
    await page.goto("/admin");
    const teacherRow = page.locator(`[data-admin-teacher="${replacement.id}"]`);
    await expect(teacherRow).toBeVisible();
    page.once("dialog", (dialog) => dialog.dismiss());
    await teacherRow.getByRole("button", { name: /Видалити назавжди/ }).click();
    await expect(teacherRow).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await teacherRow.getByRole("button", { name: /Видалити назавжди/ }).click();
    await expect(teacherRow).toHaveCount(0);
    expect(
      (await db.query('SELECT id FROM "User" WHERE id=$1', [replacement.id]))
        .rowCount,
    ).toBe(0);
  } finally {
    await Promise.all([
      admin.dispose(),
      student.dispose(),
      colleague.dispose(),
    ]);
    await db.query('UPDATE "User" SET "isAdmin" = false WHERE email = $1', [
      "teacher@demo.test",
    ]);
    await db.end();
  }
});

test("registration checks confirmation and can show and hide both passwords", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Зареєструватися", exact: true })
    .click();
  await page.getByRole("radio", { name: "Учитель", exact: true }).check();
  await page.getByLabel("Ім’я та прізвище").fill("Тестовий учитель");
  await page
    .getByLabel("Електронна пошта", { exact: true })
    .fill("confirmation@test.invalid");
  await page
    .getByLabel("Код запрошення вчителя", { exact: true })
    .fill("test-invite");
  const first = page.getByLabel("Пароль", { exact: true });
  const second = page.getByLabel("Повторіть пароль", { exact: true });
  await first.fill(password);
  await second.fill("Different2026!");
  await page
    .getByRole("button", { name: "Показати пароль", exact: true })
    .click();
  await expect(first).toHaveAttribute("type", "text");
  await expect(second).toHaveAttribute("type", "text");
  await page
    .getByRole("button", { name: "Приховати пароль", exact: true })
    .click();
  await expect(first).toHaveAttribute("type", "password");
  await expect(second).toHaveAttribute("type", "password");
  await page
    .getByRole("button", { name: "Зареєструватися", exact: true })
    .click();
  await expect(page.locator(".auth-card [role=alert]")).toHaveText(
    "Паролі не збігаються. Повторіть пароль.",
  );
});
