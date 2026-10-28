import { provisionTestAdmin, releaseTestAdmin } from "../helpers/admin-account";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { Client } from "pg";
import { randomBytes, createHash } from "node:crypto";
const origin = process.env.E2E_BASE_URL || "http://localhost:3100";
const headers = { Origin: origin },
  password = "Lifecycle2026!";
async function database() {
  const target = process.env.DATABASE_URL;
  if (!target || !new URL(target).pathname.endsWith("_test"))
    throw new Error("Disposable database required");
  const db = new Client({ connectionString: target });
  await db.connect();
  return db;
}
async function account(
  api: APIRequestContext,
  db: Client,
  email: string,
  teacher: boolean,
) {
  let invite: string | undefined;
  if (teacher) {
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
          email,
          name: teacher ? "Учитель життєвого циклу" : "Учень життєвого циклу",
          password,
          invite,
        },
      })
    ).status(),
  ).toBe(201);
  return (await api.get("/api/me")).json();
}
async function classroom(api: APIRequestContext, name: string) {
  const r = await api.post("/api/classes", { headers, data: { name } });
  expect(r.status()).toBe(201);
  return r.json();
}
async function assign(api: APIRequestContext, db: Client, classroomId: string) {
  const lab = (
    await db.query('SELECT id FROM "LabVersion" WHERE number=1 AND version=1')
  ).rows[0];
  const r = await api.post("/api/assignments", {
    headers,
    data: {
      classroomId,
      labVersionId: lab.id,
      dueAt: null,
      feedbackMode: "PRACTICE",
      experimentMode: "REAL",
    },
  });
  expect(r.status()).toBe(201);
  return r.json();
}

test("admin can suspend, remove and restore a teacher while classes and reports survive", async ({
  page,
  playwright,
}, testInfo) => {
  const db = await database();
  const teacher = await playwright.request.newContext({ baseURL: origin }),
    pupil = await playwright.request.newContext({ baseURL: origin });
  const demo = await provisionTestAdmin(db);
  try {
    const user = await account(
      teacher,
      db,
      `life-teacher-${Date.now()}@test.invalid`,
      true,
    );
    await account(pupil, db, `life-pupil-${Date.now()}@test.invalid`, false);
    const c = await classroom(teacher, "Збережений клас видаленого вчителя");
    await pupil.post("/api/classes/join", { headers, data: { code: c.code } });
    const a = await assign(teacher, db, c.id);
    await pupil.put(`/api/assignments/${a.id}/submission`, {
      headers,
      data: {
        revision: 0,
        answers: { prediction: "Історія зберігається після видалення вчителя" },
      },
    });
    const report = (
      await db.query('SELECT * FROM "Submission" WHERE "assignmentId"=$1', [
        a.id,
      ])
    ).rows[0];
    await db.query('UPDATE "User" SET "isAdmin"=true WHERE id=$1', [demo.id]);
    await page.request.post("/api/auth/login", {
      headers,
      data: { email: demo.email, password: "LabDemo2026!" },
    });
    const endpoint = `/api/admin/teachers/${user.id}`;
    expect(
      (
        await teacher.delete(endpoint, { headers, data: { confirmed: true } })
      ).status(),
    ).toBe(403);
    expect(
      (
        await pupil.delete(endpoint, { headers, data: { confirmed: true } })
      ).status(),
    ).toBe(403);
    expect(
      (
        await page.request.delete(endpoint, { data: { confirmed: true } })
      ).status(),
    ).toBe(403);
    expect(
      (
        await page.request.delete(endpoint, {
          headers,
          data: { confirmed: false },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await page.request.delete(`/api/admin/teachers/${demo.id}`, {
          headers,
          data: { confirmed: true },
        })
      ).status(),
    ).toBe(409);
    await page.goto("/admin");
    const row = page.locator(`[data-admin-teacher="${user.id}"]`);
    await row
      .getByRole("button", {
        name: "Призупинити доступ: Учитель життєвого циклу",
        exact: true,
      })
      .click();
    await expect(row).toContainText("Призупинено");
    expect((await teacher.get("/api/me")).status()).toBe(401);
    await row
      .getByRole("button", {
        name: "Відновити доступ: Учитель життєвого циклу",
        exact: true,
      })
      .click();
    await expect(row).toContainText("Активний");
    await teacher.post("/api/auth/login", {
      headers,
      data: { email: user.email, password },
    });
    await row
      .getByRole("button", {
        name: "Видалити вчителя: Учитель життєвого циклу",
        exact: true,
      })
      .click();
    let dialog = page.getByRole("dialog", {
      name: "Видалити вчителя з команди?",
      exact: true,
    });
    await expect(
      dialog.getByRole("button", { name: "Видалити", exact: true }),
    ).toBeDisabled();
    await dialog
      .getByRole("button", { name: "Скасувати", exact: true })
      .click();
    await expect(row).toBeVisible();
    await expect(
      row.getByRole("button", {
        name: "Видалити вчителя: Учитель життєвого циклу",
        exact: true,
      }),
    ).toBeFocused();
    await row
      .getByRole("button", {
        name: "Видалити вчителя: Учитель життєвого циклу",
        exact: true,
      })
      .click();
    await dialog
      .getByRole("checkbox", { name: "Підтверджую видалення", exact: true })
      .check();
    await dialog.getByRole("button", { name: "Видалити", exact: true }).click();
    await expect(row).toHaveCount(0);
    expect((await teacher.get("/api/me")).status()).toBe(401);
    expect(
      (
        await teacher.post("/api/auth/login", {
          headers,
          data: { email: user.email, password },
        })
      ).status(),
    ).toBe(401);
    expect(
      (await db.query('SELECT * FROM "Submission" WHERE id=$1', [report.id]))
        .rows[0],
    ).toEqual(report);
    expect(
      (
        await db.query('SELECT "teacherId" FROM "Classroom" WHERE id=$1', [
          c.id,
        ])
      ).rows[0].teacherId,
    ).toBe(user.id);
    await page
      .getByRole("checkbox", { name: /Показати видалених учителів/ })
      .check();
    await expect(row).toContainText("Видалено з команди");
    await page.setViewportSize({ width: 390, height: 844 });
    await row.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("teachers-removed-mobile.png"),
      caret: "initial",
    });
    await row
      .getByRole("button", {
        name: "Відновити доступ: Учитель життєвого циклу",
        exact: true,
      })
      .click();
    await expect(row).toContainText("Активний");
    expect((await teacher.get("/api/me")).status()).toBe(401); // Old sessions stay invalid.
    expect(
      (
        await teacher.post("/api/auth/login", {
          headers,
          data: { email: user.email, password },
        })
      ).status(),
    ).toBe(200);
    expect(await (await teacher.get(`/classes/${c.id}`)).text()).toContain(
      c.name,
    );
    expect(
      (
        await db.query('SELECT action FROM "AdminAudit" WHERE "targetId"=$1', [
          user.id,
        ])
      ).rows.map((r) => r.action),
    ).toEqual(
      expect.arrayContaining([
        "TEACHER_BLOCKED",
        "TEACHER_ENABLED",
        "TEACHER_REMOVED",
        "TEACHER_RESTORED",
      ]),
    );
  } finally {
    await releaseTestAdmin(db, demo.id);
    await Promise.all([teacher.dispose(), pupil.dispose()]);
    await db.end();
  }
});

test("teacher controls a pupil only in their own class, preserves history and blocks code re-entry", async ({
  page,
  playwright,
}, testInfo) => {
  const db = await database();
  const pupil = await playwright.request.newContext({ baseURL: origin }),
    foreign = await playwright.request.newContext({ baseURL: origin });
  try {
    await account(
      page.request,
      db,
      `life-owner-${Date.now()}@test.invalid`,
      true,
    );
    await account(foreign, db, `life-foreign-${Date.now()}@test.invalid`, true);
    const user = await account(
      pupil,
      db,
      `life-member-${Date.now()}@test.invalid`,
      false,
    );
    const c = await classroom(page.request, "Клас вибулого учня"),
      other = await classroom(foreign, "Інший клас учня");
    const personalCode = "S" + randomBytes(8).toString("hex").toUpperCase();
    await db.query(
      'INSERT INTO "StudentInvite" (id,"classroomId",name,email,key,code) VALUES ($1,$2,$3,$4,$5,$6)',
      [
        `left-${Date.now()}`,
        c.id,
        "Учень за списком",
        user.email,
        user.email,
        personalCode,
      ],
    );
    expect(
      (
        await pupil.post("/api/classes/join", {
          headers,
          data: { code: personalCode },
        })
      ).status(),
    ).toBe(200);
    await pupil.post("/api/classes/join", {
      headers,
      data: { code: other.code },
    });
    const a = await assign(page.request, db, c.id),
      b = await assign(foreign, db, other.id);
    const save = (assignmentId: string, revision: number, prediction: string) =>
      pupil.put(`/api/assignments/${assignmentId}/submission`, {
        headers,
        data: { revision, answers: { prediction } },
      });
    expect((await save(a.id, 0, "Звіт учня перед вибуттям")).status()).toBe(
      200,
    );
    const report = (
      await db.query('SELECT * FROM "Submission" WHERE "assignmentId"=$1', [
        a.id,
      ])
    ).rows[0];
    const endpoint = `/api/classes/${c.id}/students/members/${user.id}`;
    expect(
      (
        await pupil.delete(endpoint, { headers, data: { confirmed: true } })
      ).status(),
    ).toBe(403);
    expect(
      (
        await foreign.delete(endpoint, { headers, data: { confirmed: true } })
      ).status(),
    ).toBe(404);
    expect(
      (
        await page.request.delete(endpoint, { data: { confirmed: true } })
      ).status(),
    ).toBe(403);
    expect(
      (await page.request.delete(endpoint, { headers, data: {} })).status(),
    ).toBe(400);
    await page.goto(`/classes/${c.id}`);
    const member = page.locator(`[data-roster-member="${user.id}"]`);
    await member
      .getByRole("button", {
        name: "Призупинити учня: Учень за списком",
        exact: true,
      })
      .click();
    await expect(member).toContainText("Доступ призупинено");
    expect((await save(a.id, 1, "Заборонена зміна")).status()).toBe(404);
    expect(
      (await pupil.get(`/api/assignments/${a.id}/submission`)).status(),
    ).toBe(404);
    expect(
      (await pupil.get(`/api/submissions/${report.id}/checks`)).status(),
    ).toBe(403);
    expect((await save(b.id, 0, "Інший клас працює")).status()).toBe(200);
    for (const code of [c.code, personalCode])
      expect(
        (
          await pupil.post("/api/classes/join", { headers, data: { code } })
        ).status(),
      ).toBe(403);
    await member
      .getByRole("button", {
        name: "Відновити учня: Учень за списком",
        exact: true,
      })
      .click();
    await expect(member).toContainText("Активний доступ");
    expect(
      (await pupil.get(`/api/assignments/${a.id}/submission`)).status(),
    ).toBe(200);
    await member
      .getByRole("button", {
        name: "Видалити учня: Учень за списком",
        exact: true,
      })
      .click();
    let dialog = page.getByRole("dialog", {
      name: "Видалити учня з класу?",
      exact: true,
    });
    await page.keyboard.press("Escape");
    await expect(member).toBeVisible();
    await expect(
      member.getByRole("button", {
        name: "Видалити учня: Учень за списком",
        exact: true,
      }),
    ).toBeFocused();
    await member
      .getByRole("button", {
        name: "Видалити учня: Учень за списком",
        exact: true,
      })
      .click();
    await dialog
      .getByRole("checkbox", { name: "Підтверджую видалення", exact: true })
      .check();
    await dialog.getByRole("button", { name: "Видалити", exact: true }).click();
    await expect(
      page.getByText("Вибулі учні · 1", { exact: true }),
    ).toBeVisible();
    expect((await save(a.id, 1, "Після видалення")).status()).toBe(404);
    expect(
      (
        await pupil.post("/api/classes/join", {
          headers,
          data: { code: c.code },
        })
      ).status(),
    ).toBe(403);
    expect(
      (await db.query('SELECT * FROM "Submission" WHERE id=$1', [report.id]))
        .rows[0],
    ).toEqual(report);
    await page.getByText("Вибулі учні · 1", { exact: true }).click();
    await expect(member).toContainText("Вибув / вибула");
    await page.getByText("Роботи вибулих учнів", { exact: true }).click();
    await expect(page.locator(`a[href="/review/${report.id}"]`)).toBeVisible();
    await expect(page.locator(`a[href="/review/${report.id}"]`)).toContainText(
      "У процесі",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await member.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("class-left-pupil-mobile.png"),
      caret: "initial",
    });
    await member
      .getByRole("button", {
        name: "Відновити учня: Учень за списком",
        exact: true,
      })
      .click();
    await expect(member).toContainText("Активний доступ");
    expect(
      (await pupil.get(`/api/assignments/${a.id}/submission`)).status(),
    ).toBe(200);
    expect((await pupil.get("/api/me")).status()).toBe(200);
  } finally {
    await Promise.all([pupil.dispose(), foreign.dispose()]);
    await db.end();
  }
});
