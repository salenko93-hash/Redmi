import { test, expect, type APIRequestContext } from "@playwright/test";
import { Client } from "pg";
import { randomBytes, createHash } from "node:crypto";
const origin = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const headers = { Origin: origin };
const password = "LabDemo2026!";
async function database() {
  const target = process.env.DATABASE_URL;
  if (!target || !new URL(target).pathname.endsWith("_test"))
    throw Error("Disposable test database required");
  const db = new Client({ connectionString: target });
  await db.connect();
  return db;
}
async function login(api: APIRequestContext, email: string) {
  expect(
    (
      await api.post("/api/auth/login", { headers, data: { email, password } })
    ).status(),
  ).toBe(200);
}
async function createClass(api: APIRequestContext, name: string) {
  const result = await api.post("/api/classes", { headers, data: { name } });
  expect(result.status()).toBe(201);
  return result.json();
}
async function assignment(
  api: APIRequestContext,
  db: Client,
  classroomId: string,
  number: number,
) {
  const lab = (
    await db.query(
      'SELECT id FROM "LabVersion" WHERE number=$1 AND version=1',
      [number],
    )
  ).rows[0];
  const result = await api.post("/api/assignments", {
    headers,
    data: {
      classroomId,
      labVersionId: lab.id,
      dueAt: null,
      feedbackMode: "PRACTICE",
      experimentMode: "REAL",
    },
  });
  expect(result.status()).toBe(201);
  return result.json();
}

test("archive and restore retain reports and grades, freeze editing and keep history accessible on mobile", async ({
  page,
  playwright,
}, testInfo) => {
  const db = await database();
  const pupil = await playwright.request.newContext({ baseURL: origin });
  try {
    await login(page.request, "teacher@demo.test");
    await login(pupil, "student@demo.test");
    const c = await createClass(page.request, "7-Ж · Архів звітів");
    expect(
      (
        await pupil.post("/api/classes/join", {
          headers,
          data: { code: c.code },
        })
      ).status(),
    ).toBe(200);
    const a = await assignment(page.request, db, c.id, 1);
    const b = await assignment(page.request, db, c.id, 2);
    for (const item of [a, b])
      expect(
        (
          await pupil.put(`/api/assignments/${item.id}/submission`, {
            headers,
            data: {
              revision: 0,
              answers: { prediction: "Збережений прогноз учня" },
            },
          })
        ).status(),
      ).toBe(200);
    await db.query(
      "UPDATE \"Submission\" SET status='GRADED',score=11,feedback='Точні вимірювання' WHERE \"assignmentId\"=$1",
      [b.id],
    );
    const before = (
      await db.query(
        'SELECT * FROM "Submission" WHERE "assignmentId"=ANY($1::text[]) ORDER BY id',
        [[a.id, b.id]],
      )
    ).rows;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/classes/${c.id}`);
    await page
      .getByRole("button", { name: `Архівувати клас: ${c.name}`, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Клас в архіві", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Призначити роботу", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Видалити порожній клас/ }),
    ).toHaveCount(0);
    await page.goto("/classes");
    await expect(page.getByRole("link", { name: c.name })).toHaveCount(0);
    await page.getByRole("link", { name: /Архів ·/ }).click();
    await expect(page.getByRole("link", { name: c.name })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("class-archive-mobile.png"),
      fullPage: true,
    });
    await page.goto("/dashboard");
    await expect(page.locator(`a[href="/classes/${c.id}"]`)).toHaveCount(0);
    expect(
      (
        await pupil.put(`/api/assignments/${a.id}/submission`, {
          headers,
          data: {
            revision: 1,
            answers: { prediction: "Не повинно зберегтися" },
          },
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await pupil.post("/api/classes/join", {
          headers,
          data: { code: c.code },
        })
      ).status(),
    ).toBe(409);
    const newLab = (
      await db.query('SELECT id FROM "LabVersion" WHERE number=3 AND version=1')
    ).rows[0];
    expect(
      (
        await page.request.post("/api/assignments", {
          headers,
          data: {
            classroomId: c.id,
            labVersionId: newLab.id,
            dueAt: null,
            feedbackMode: "PRACTICE",
            experimentMode: "REAL",
          },
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await page.request.patch(`/api/assignments/${a.id}/mode`, {
          headers,
          data: { experimentMode: "DATA" },
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await page.request.delete(`/api/classes/${c.id}`, {
          headers,
          data: { confirmed: true },
        })
      ).status(),
    ).toBe(409);
    expect(
      (await pupil.get(`/api/assignments/${a.id}/submission`)).status(),
    ).toBe(200);
    expect(
      (
        await db.query(
          'SELECT * FROM "Submission" WHERE "assignmentId"=ANY($1::text[]) ORDER BY id',
          [[a.id, b.id]],
        )
      ).rows,
    ).toEqual(before);
    const studentPage = await page
      .context()
      .browser()!
      .newPage({
        storageState: await pupil.storageState(),
        viewport: { width: 390, height: 844 },
      });
    try {
      await studentPage.goto(`${origin}/classes?view=archive`);
      await expect(
        studentPage.getByRole("link", { name: c.name }),
      ).toBeVisible();
      await studentPage.goto(`${origin}/work/${a.id}`);
      await expect(
        studentPage.getByRole("heading", {
          name: "Клас в архіві · тільки перегляд",
        }),
      ).toBeVisible();
      await expect(studentPage.locator("textarea").first()).toBeDisabled();
      await expect(
        studentPage.getByRole("button", { name: "Здати роботу", exact: true }),
      ).toHaveCount(0);
      await expect(
        studentPage.getByRole("button", { name: "Зберегти PDF", exact: true }),
      ).toBeEnabled();
    } finally {
      await studentPage.close();
    }
    await page.goto(`/classes/${c.id}`);
    await page
      .getByRole("button", { name: `Відновити клас: ${c.name}`, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Клас в архіві", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Призначити роботу", exact: true }),
    ).toBeVisible();
    expect(
      (
        await pupil.put(`/api/assignments/${a.id}/submission`, {
          headers,
          data: {
            revision: 1,
            answers: { prediction: "Після відновлення редагування працює" },
          },
        })
      ).status(),
    ).toBe(200);
    await page.goto("/classes");
    await expect(page.getByRole("link", { name: c.name })).toBeVisible();
  } finally {
    await pupil.dispose();
    await db.end();
  }
});

test("only the owner can delete an empty class after confirmation; populated and invited classes are protected", async ({
  page,
  playwright,
}) => {
  const db = await database();
  const outsider = await playwright.request.newContext({ baseURL: origin });
  const pupil = await playwright.request.newContext({ baseURL: origin });
  try {
    await login(page.request, "teacher@demo.test");
    await login(pupil, "student@demo.test");
    const token = randomBytes(24).toString("hex");
    await db.query(
      'INSERT INTO "TeacherInvite" ("tokenHash","expiresAt") VALUES ($1,NOW()+INTERVAL \'1 hour\')',
      [createHash("sha256").update(token).digest("hex")],
    );
    expect(
      (
        await outsider.post("/api/auth/register", {
          headers,
          data: {
            email: `archive-owner-${Date.now()}@test.invalid`,
            name: "Інший учитель",
            password,
            invite: token,
          },
        })
      ).status(),
    ).toBe(201);
    const c = await createClass(page.request, "Порожній клас на видалення");
    for (const method of ["patch", "delete"] as const) {
      const data =
        method === "patch" ? { archived: true } : { confirmed: true };
      expect(
        (
          await outsider[method](`/api/classes/${c.id}`, { headers, data })
        ).status(),
      ).toBe(404);
      expect(
        (
          await pupil[method](`/api/classes/${c.id}`, { headers, data })
        ).status(),
      ).toBe(403);
    }
    expect(
      (
        await page.request.delete(`/api/classes/${c.id}`, { headers, data: {} })
      ).status(),
    ).toBe(400);
    expect(
      (
        await page.request.delete(`/api/classes/${c.id}`, {
          headers: { Origin: "https://elsewhere.invalid" },
          data: { confirmed: true },
        })
      ).status(),
    ).toBe(403);
    await page.goto(`/classes/${c.id}`);
    const remove = page.getByRole("button", {
      name: `Видалити порожній клас: ${c.name}`,
      exact: true,
    });
    await remove.click();
    const dialog = page.getByRole("dialog", {
      name: "Видалити порожній клас?",
    });
    await expect(
      dialog.getByRole("button", { name: "Видалити", exact: true }),
    ).toBeDisabled();
    await dialog
      .getByRole("button", { name: "Скасувати", exact: true })
      .click();
    await expect(remove).toBeFocused();
    await remove.click();
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Видалити", exact: true }).click();
    await expect(page).toHaveURL(`${origin}/classes`);
    expect(
      (await db.query('SELECT id FROM "Classroom" WHERE id=$1', [c.id]))
        .rowCount,
    ).toBe(0);
    const invited = await createClass(page.request, "Клас з очікуваним учнем");
    const email = `archived-invite-${Date.now()}@test.invalid`;
    expect(
      (
        await page.request.post(`/api/classes/${invited.id}/students/import`, {
          headers,
          data: { csv: `ПІБ;Email\nНовий Учень;${email}`, mode: "commit" },
        })
      ).status(),
    ).toBe(201);
    expect(
      (
        await page.request.delete(`/api/classes/${invited.id}`, {
          headers,
          data: { confirmed: true },
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await page.request.patch(`/api/classes/${invited.id}`, {
          headers,
          data: { archived: true },
        })
      ).status(),
    ).toBe(200);
    const invite = (
      await db.query(
        'SELECT code FROM "StudentInvite" WHERE "classroomId"=$1',
        [invited.id],
      )
    ).rows[0];
    expect(
      (
        await outsider.post("/api/auth/register", {
          headers,
          data: {
            role: "STUDENT",
            studentCode: invite.code,
            email,
            name: "Новий Учень",
            password,
          },
        })
      ).status(),
    ).toBe(409);
    expect(
      (await db.query('SELECT id FROM "User" WHERE email=$1', [email]))
        .rowCount,
    ).toBe(0);
    const onlyAssignment = await createClass(
      page.request,
      "Клас лише з призначенням",
    );
    await assignment(page.request, db, onlyAssignment.id, 1);
    expect(
      (
        await page.request.delete(`/api/classes/${onlyAssignment.id}`, {
          headers,
          data: { confirmed: true },
        })
      ).status(),
    ).toBe(409);
    const onlyMember = await createClass(
      page.request,
      "Клас лише з вибулим учнем",
    );
    await pupil.post("/api/classes/join", {
      headers,
      data: { code: onlyMember.code },
    });
    const student = await (await pupil.get("/api/me")).json();
    await page.request.delete(
      `/api/classes/${onlyMember.id}/students/members/${student.id}`,
      { headers, data: { confirmed: true } },
    );
    expect(
      (
        await page.request.delete(`/api/classes/${onlyMember.id}`, {
          headers,
          data: { confirmed: true },
        })
      ).status(),
    ).toBe(409);
  } finally {
    await outsider.dispose();
    await pupil.dispose();
    await db.end();
  }
});

test("a join racing deletion cannot lose the student's membership", async ({
  page,
  playwright,
}) => {
  const db = await database();
  const pupil = await playwright.request.newContext({ baseURL: origin });
  try {
    await login(page.request, "teacher@demo.test");
    await login(pupil, "student@demo.test");
    const c = await createClass(
      page.request,
      "Одночасне приєднання та видалення",
    );
    const [joined, deleted] = await Promise.all([
      pupil.post("/api/classes/join", { headers, data: { code: c.code } }),
      page.request.delete(`/api/classes/${c.id}`, {
        headers,
        data: { confirmed: true },
      }),
    ]);
    if (joined.status() === 200) {
      expect(deleted.status()).toBe(409);
      expect(
        (
          await db.query('SELECT id FROM "Membership" WHERE "classroomId"=$1', [
            c.id,
          ])
        ).rowCount,
      ).toBe(1);
    } else {
      expect(joined.status()).toBe(404);
      expect(deleted.status()).toBe(200);
      expect(
        (await db.query('SELECT id FROM "Classroom" WHERE id=$1', [c.id]))
          .rowCount,
      ).toBe(0);
    }
  } finally {
    await pupil.dispose();
    await db.end();
  }
});
