import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { randomBytes, createHash } from "node:crypto";
const origin = process.env.E2E_BASE_URL || "http://localhost:3100";
const headers = { Origin: origin };
const password = "RoleRepair2026!";

test("admin explicitly repairs a pupil account into a teacher without losing credentials or reports", async ({
  page,
  playwright,
}, testInfo) => {
  const target = process.env.DATABASE_URL;
  if (!target || !new URL(target).pathname.endsWith("_test"))
    throw new Error("Disposable database required");
  const db = new Client({ connectionString: target });
  await db.connect();
  const pupil = await playwright.request.newContext({ baseURL: origin });
  const anonymous = await playwright.request.newContext({ baseURL: origin });
  const nonce = Date.now();
  const email = `repair-${nonce}@test.invalid`;
  const demo = (
    await db.query('SELECT id,"isAdmin" FROM "User" WHERE email=$1', [
      "teacher@demo.test",
    ])
  ).rows[0];
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    expect(
      (
        await pupil.post("/api/auth/register", {
          headers,
          data: { name: "Колега зі старим акаунтом", email, password },
        })
      ).status(),
    ).toBe(201);
    const before = (
      await db.query(
        'SELECT id,"passwordHash","recoveryHash" FROM "User" WHERE email=$1',
        [email],
      )
    ).rows[0];
    const payload = { id: before.id, email, confirmed: true };
    expect(
      (
        await pupil.post("/api/admin/teachers/promote", {
          headers,
          data: payload,
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await anonymous.post("/api/admin/teachers/promote", {
          headers,
          data: payload,
        })
      ).status(),
    ).toBe(401);
    await db.query('UPDATE "User" SET "isAdmin"=true WHERE id=$1', [demo.id]);
    expect(
      (
        await page.request.post("/api/auth/login", {
          headers,
          data: { email: "teacher@demo.test", password: "LabDemo2026!" },
        })
      ).status(),
    ).toBe(200);
    const classroom = await (
      await page.request.post("/api/classes", {
        headers,
        data: { name: "Клас збережених даних" },
      })
    ).json();
    expect(
      (
        await pupil.post("/api/classes/join", {
          headers,
          data: { code: classroom.code },
        })
      ).status(),
    ).toBe(200);
    const lab = (
      await db.query('SELECT id FROM "LabVersion" WHERE number=1 AND version=1')
    ).rows[0];
    const assignment = await (
      await page.request.post("/api/assignments", {
        headers,
        data: {
          classroomId: classroom.id,
          labVersionId: lab.id,
          dueAt: null,
          feedbackMode: "PRACTICE",
          experimentMode: "REAL",
        },
      })
    ).json();
    expect(
      (
        await pupil.put(`/api/assignments/${assignment.id}/submission`, {
          headers,
          data: {
            revision: 0,
            answers: { prediction: "Збережений звіт до виправлення ролі" },
          },
        })
      ).status(),
    ).toBe(200);
    const membershipBefore = (
      await db.query('SELECT * FROM "Membership" WHERE "userId"=$1', [
        before.id,
      ])
    ).rows;
    const reportsBefore = (
      await db.query('SELECT * FROM "Submission" WHERE "studentId"=$1', [
        before.id,
      ])
    ).rows;
    const token = randomBytes(24).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");
    await db.query(
      'INSERT INTO "TeacherInvite" ("tokenHash",email,"expiresAt") VALUES ($1,$2,NOW()+INTERVAL \'1 hour\')',
      [hash, email],
    );
    expect(
      (
        await page.request.post("/api/admin/teachers/promote", {
          data: payload,
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await page.request.post("/api/admin/teachers/promote", {
          headers,
          data: { ...payload, confirmed: false },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await page.request.post("/api/admin/teachers/promote", {
          headers,
          data: { ...payload, email: `wrong-${nonce}@test.invalid` },
        })
      ).status(),
    ).toBe(404);
    await db.query('UPDATE "User" SET "isActive"=false WHERE id=$1', [
      before.id,
    ]);
    expect(
      (
        await page.request.post("/api/admin/teachers/promote", {
          headers,
          data: payload,
        })
      ).status(),
    ).toBe(409);
    await db.query('UPDATE "User" SET "isActive"=true WHERE id=$1', [
      before.id,
    ]);

    await page.goto("/admin");
    const invitations = page.getByRole("region", {
      name: "Запрошення нового вчителя",
    });
    await invitations.getByLabel("Email учителя", { exact: true }).fill(email);
    await invitations
      .getByRole("button", { name: "Створити запрошення", exact: true })
      .click();
    const repair = page.getByRole("region", {
      name: "Зміна ролі облікового запису",
    });
    await expect(repair).toBeVisible();
    await expect(repair.getByText(email, { exact: true })).toBeVisible();
    const promote = repair.getByRole("button", {
      name: "Надати роль учителя",
      exact: true,
    });
    await expect(promote).toBeDisabled();
    await repair
      .getByRole("button", { name: "Скасувати", exact: true })
      .click();
    await expect(repair).toHaveCount(0);
    expect(
      (await db.query('SELECT role FROM "User" WHERE id=$1', [before.id]))
        .rows[0].role,
    ).toBe("STUDENT");
    await invitations
      .getByRole("button", { name: "Створити запрошення", exact: true })
      .click();
    await expect(repair).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await repair.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("admin-role-repair-mobile.png"),
      caret: "initial",
    });
    await repair
      .getByRole("checkbox", {
        name: "Підтверджую, що це обліковий запис учителя",
        exact: true,
      })
      .check();
    await promote.click();
    await expect(
      page
        .getByRole("region", { name: "Керування вчителями" })
        .getByText(email, { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Чинні запрошення вчителів" })
        .getByText(email, { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("роль учителя надано");
    const after = (
      await db.query(
        'SELECT id,"passwordHash","recoveryHash",role,"isAdmin" FROM "User" WHERE email=$1',
        [email],
      )
    ).rows[0];
    expect(after).toEqual({ ...before, role: "TEACHER", isAdmin: false });
    expect(
      (
        await db.query('SELECT * FROM "Membership" WHERE "userId"=$1', [
          before.id,
        ])
      ).rows,
    ).toEqual(membershipBefore);
    expect(
      (
        await db.query('SELECT * FROM "Submission" WHERE "studentId"=$1', [
          before.id,
        ])
      ).rows,
    ).toEqual(reportsBefore);
    expect((await pupil.get("/api/me")).status()).toBe(401);
    expect(
      (
        await pupil.post("/api/auth/login", {
          headers,
          data: { email, password },
        })
      ).status(),
    ).toBe(200);
    expect((await (await pupil.get("/api/me")).json()).role).toBe("TEACHER");
    expect(
      (
        await pupil.post("/api/admin/teachers/promote", {
          headers,
          data: payload,
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await page.request.post("/api/admin/teachers/promote", {
          headers,
          data: payload,
        })
      ).status(),
    ).toBe(409);
    const audit = (
      await db.query(
        'SELECT detail FROM "AdminAudit" WHERE "targetId"=$1 AND action=$2',
        [before.id, "TEACHER_ROLE_GRANTED"],
      )
    ).rows;
    expect(audit).toHaveLength(1);
    expect(audit[0].detail).toEqual({
      email,
      previousRole: "STUDENT",
      revokedInvitations: 1,
    });
    expect(errors).toEqual([]);
  } finally {
    await db.query('UPDATE "User" SET "isAdmin"=$1 WHERE id=$2', [
      demo.isAdmin,
      demo.id,
    ]);
    await Promise.all([pupil.dispose(), anonymous.dispose()]);
    await db.end();
  }
});
