import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { randomBytes, createHash } from "node:crypto";
import { initialParameters } from "../../lib/simulation";
import { labs } from "../../lib/labs";
const origin = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const headers = { Origin: origin };
const password = "LabDemo2026!";
async function database() {
  if (
    !process.env.DATABASE_URL ||
    !new URL(process.env.DATABASE_URL).pathname.endsWith("_test")
  )
    throw new Error("Disposable test database required");
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  return db;
}

async function provision(db: Client, number: number) {
  const prefix = `learning-${randomBytes(6).toString("hex")}`;
  const studentEmail = `${prefix}-pupil@test.invalid`,
    teacherEmail = `${prefix}-teacher@test.invalid`;
  const hash = (
    await db.query('SELECT "passwordHash" FROM "User" WHERE email=$1', [
      "student@demo.test",
    ])
  ).rows[0].passwordHash;
  const studentId = prefix + "-pupil",
    teacherId = prefix + "-teacher",
    classroomId = prefix + "-class",
    id = prefix + "-assignment";
  await db.query(
    "INSERT INTO \"User\" (id,email,name,\"passwordHash\",role) VALUES ($1,$2,$3,$4,'STUDENT'),($5,$6,$7,$4,'TEACHER')",
    [
      studentId,
      studentEmail,
      "Учень поступу",
      hash,
      teacherId,
      teacherEmail,
      "Учитель поступу",
    ],
  );
  await db.query(
    'INSERT INTO "Classroom" (id,name,code,"teacherId") VALUES ($1,$2,$3,$4)',
    [classroomId, "7-Б · Навчальний поступ", prefix, teacherId],
  );
  await db.query(
    'INSERT INTO "Membership" (id,"classroomId","userId") VALUES ($1,$2,$3)',
    [prefix + "-member", classroomId, studentId],
  );
  const lab = (
    await db.query(
      'SELECT id FROM "LabVersion" WHERE number=$1 AND version=1',
      [number],
    )
  ).rows[0];
  await db.query(
    'INSERT INTO "Assignment" (id,"classroomId","labVersionId") VALUES ($1,$2,$3)',
    [id, classroomId, lab.id],
  );
  return { id, classroomId, studentId, teacherId, studentEmail, teacherEmail };
}

test("opt-in journal captures real instrument actions; corrections, privacy, roles and deletion preserve reports", async ({
  page,
  playwright,
}, testInfo) => {
  test.setTimeout(120000);
  const db = await database();
  const fixture = await provision(db, 1);
  const teacher = await playwright.request.newContext({ baseURL: origin });
  const stranger = await playwright.request.newContext({ baseURL: origin });
  try {
    expect(
      (
        await page.request.post("/api/auth/login", {
          headers,
          data: { email: fixture.studentEmail, password },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await teacher.post("/api/auth/login", {
          headers,
          data: { email: fixture.teacherEmail, password },
        })
      ).status(),
    ).toBe(200);
    const assignment = fixture;
    const endpoint = `/api/assignments/${assignment.id}/learning`;
    const series = labs[0].content.experiments[0];
    const event = (id: string, distance = 1.2) => ({
      eventId: id,
      kind: "RUN_COMPLETED",
      experimentId: series.id,
      occurredAt: new Date().toISOString(),
      payload: { parameters: { ...initialParameters(1, series.id), distance } },
    });
    expect((await page.request.get(endpoint)).status()).toBe(200);
    expect((await (await page.request.get(endpoint)).json()).enabled).toBe(
      false,
    );
    expect(
      (
        await page.request.post(endpoint, {
          headers,
          data: { events: [event("disabled")] },
        })
      ).status(),
    ).toBe(409);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/work/${assignment.id}`);
    const journal = page.getByRole("region", { name: "Мій навчальний поступ" });
    await journal
      .getByRole("button", {
        name: "Увімкнути запис навчальних дій",
        exact: true,
      })
      .click();
    await expect(
      journal.getByRole("button", { name: "Вимкнути й видалити журнал" }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "2 Експеримент", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: /Запустити секундомір|Новий дослід секундоміром/,
        exact: true,
      })
      .first()
      .click();
    await expect
      .poll(
        async () =>
          (await (await page.request.get(endpoint)).json()).report.facts
            .totalRuns,
        { timeout: 15000 },
      )
      .toBe(1);
    await page
      .getByRole("button", { name: "Зупинити секундомір", exact: true })
      .first()
      .click();
    await page.getByLabel("Точне значення: Довжина шляху").first().fill("1");
    await page
      .getByLabel("Точне значення: Довжина шляху")
      .first()
      .press("Enter");
    await page
      .getByRole("button", {
        name: /Запустити секундомір|Новий дослід секундоміром/,
        exact: true,
      })
      .first()
      .click();
    await expect
      .poll(
        async () =>
          (await (await page.request.get(endpoint)).json()).report.facts.single,
        { timeout: 15000 },
      )
      .toBe(1);
    // Events wait in this tab during a connection loss and synchronize after reconnecting.
    await page
      .getByRole("button", { name: "Зупинити секундомір", exact: true })
      .first()
      .click();
    await page.context().setOffline(true);
    await page
      .getByRole("button", {
        name: /Запустити секундомір|Новий дослід секундоміром/,
        exact: true,
      })
      .first()
      .click();
    await expect(journal.getByRole("status")).toContainText(
      "Очікують збереження",
    );
    await page.context().setOffline(false);
    await expect
      .poll(
        async () =>
          (await (await page.request.get(endpoint)).json()).report.facts
            .repeated,
        { timeout: 15000 },
      )
      .toBe(1);
    // Retries are idempotent, and arbitrary experiment names/payloads are rejected.
    const duplicate = event("retry-id");
    expect(
      (
        await page.request.post(endpoint, {
          headers,
          data: { events: [duplicate] },
        })
      ).status(),
    ).toBe(201);
    expect(
      (
        await (
          await page.request.post(endpoint, {
            headers,
            data: { events: [duplicate] },
          })
        ).json()
      ).recorded,
    ).toBe(0);
    expect(
      (
        await page.request.post(endpoint, {
          headers,
          data: {
            events: [{ ...event("bad-series"), experimentId: "outside" }],
          },
        })
      ).status(),
    ).toBe(422);
    expect(
      (
        await page.request.post(endpoint, {
          headers,
          data: {
            events: [
              { ...event("bad-payload"), payload: { email: "PRIVATE" } },
            ],
          },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await page.request.post(endpoint, {
          headers,
          data: {
            events: [{ ...event("forged-fix"), kind: "CALCULATION_FIXED" }],
          },
        })
      ).status(),
    ).toBe(400);
    expect((await teacher.get(endpoint)).status()).toBe(403);
    expect(
      (await page.request.put(endpoint, { data: { enabled: false } })).status(),
    ).toBe(403);
    // A separate teacher cannot access the class or the student's progress.
    const code = randomBytes(24).toString("hex");
    await db.query(
      'INSERT INTO "TeacherInvite" ("tokenHash","expiresAt") VALUES ($1,NOW()+INTERVAL \'1 hour\')',
      [createHash("sha256").update(code).digest("hex")],
    );
    expect(
      (
        await stranger.post("/api/auth/register", {
          headers,
          data: {
            email: `learning-other-${Date.now()}@test.invalid`,
            name: "Інший учитель",
            password,
            invite: code,
            role: "TEACHER",
          },
        })
      ).status(),
    ).toBe(201);
    const denied = await stranger.get(
      `/progress?class=${assignment.classroomId}&student=${assignment.studentId}`,
    );
    const deniedBody = await denied.text();
    // App Router may already be streaming its loading shell when notFound is raised.
    expect(deniedBody).toContain("Цей дослід ще не знайдено");
    expect(deniedBody).not.toContain("Учень поступу");
    expect(deniedBody).not.toContain("7-Б · Навчальний поступ");
    // Server verifies arithmetic correction on save without changing the score.
    await page.goto("/dashboard"); // prevent stale autosave from the editor
    const before = {
      prediction: "Прогноз",
      experiments: { [series.id]: [{ l: "10", t: "2", v: "3" }] },
    };
    const firstSave = await page.request.put(
      `/api/assignments/${assignment.id}/submission`,
      { headers, data: { revision: 0, answers: before } },
    );
    expect(firstSave.status()).toBe(200);
    const saved = await firstSave.json();
    const after = {
      ...before,
      experiments: { [series.id]: [{ l: "10", t: "2", v: "5" }] },
    };
    expect(
      (
        await page.request.put(`/api/assignments/${assignment.id}/submission`, {
          headers,
          data: { revision: saved.revision, answers: after },
        })
      ).status(),
    ).toBe(200);
    expect(
      (await (await page.request.get(endpoint)).json()).report.facts.corrected,
    ).toBe(1);
    const reportBeforeDeletion = (
      await db.query(
        'SELECT answers,score,revision FROM "Submission" WHERE id=$1',
        [saved.id],
      )
    ).rows[0];
    // Assessment mode does not expose arithmetic correctness to the pupil.
    await db.query(
      'UPDATE "Assignment" SET "feedbackMode"=\'ASSESSMENT\' WHERE id=$1',
      [assignment.id],
    );
    const assessment = await (await page.request.get(endpoint)).json();
    expect(
      assessment.report.dimensions
        .find((d: { key: string }) => d.key === "calculation")
        .evidence.join(),
    ).toContain("після оцінювання");
    // Teacher overview works on mobile and describes evidence rather than a trait score.
    await page.request.post("/api/auth/logout", { headers });
    await page.request.post("/api/auth/login", {
      headers,
      data: { email: fixture.teacherEmail, password },
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(
      `/progress?class=${assignment.classroomId}&student=${assignment.studentId}`,
    );
    await page.locator("main details summary").first().click();
    await expect(
      page.getByRole("heading", { name: "Планування досліду" }).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/виправлень зі сталими вхідними даними: 1/),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("learning-progress-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: testInfo.outputPath("learning-progress-desktop.png"),
      fullPage: true,
    });
    // Withdrawal blocks writes; opt-out deletes all events and preserves the actual report.
    await page.request.post("/api/auth/logout", { headers });
    await page.request.post("/api/auth/login", {
      headers,
      data: { email: fixture.studentEmail, password },
    });
    await db.query(
      'UPDATE "Membership" SET status=\'SUSPENDED\' WHERE "classroomId"=$1 AND "userId"=$2',
      [assignment.classroomId, assignment.studentId],
    );
    expect(
      (
        await page.request.post(endpoint, {
          headers,
          data: { events: [event("suspended")] },
        })
      ).status(),
    ).toBe(403);
    await db.query(
      'UPDATE "Membership" SET status=\'ACTIVE\' WHERE "classroomId"=$1 AND "userId"=$2',
      [assignment.classroomId, assignment.studentId],
    );
    expect(
      (
        await page.request.put(endpoint, { headers, data: { enabled: false } })
      ).status(),
    ).toBe(200);
    expect(
      (
        await db.query(
          'SELECT count(*)::int AS n FROM "LearningEvent" WHERE "assignmentId"=$1 AND "studentId"=$2',
          [assignment.id, assignment.studentId],
        )
      ).rows[0].n,
    ).toBe(0);
    expect(
      (
        await db.query(
          'SELECT answers,score,revision FROM "Submission" WHERE id=$1',
          [saved.id],
        )
      ).rows[0],
    ).toEqual(reportBeforeDeletion);
    expect(
      (
        await page.request.post(endpoint, {
          headers,
          data: { events: [event("late-batch")] },
        })
      ).status(),
    ).toBe(409);
  } finally {
    await db.end();
    await teacher.dispose();
    await stranger.dispose();
  }
});

test("old events expire on reads and submitted work rejects new events", async ({
  request,
}) => {
  const db = await database();
  const fixture = await provision(db, 2);
  try {
    await request.post("/api/auth/login", {
      headers,
      data: { email: fixture.studentEmail, password },
    });
    const a = fixture;
    const endpoint = `/api/assignments/${a.id}/learning`;
    expect(
      (
        await request.put(endpoint, { headers, data: { enabled: true } })
      ).status(),
    ).toBe(200);
    await db.query(
      'INSERT INTO "LearningEvent" (id,"eventId","assignmentId","studentId",kind,payload,"occurredAt","createdAt") VALUES ($1,$1,$2,$3,\'HELP_REQUESTED\',\'{}\',NOW()-INTERVAL \'181 days\',NOW()-INTERVAL \'181 days\')',
      ["old-learning-event", a.id, a.studentId],
    );
    expect((await (await request.get(endpoint)).json()).report.facts.help).toBe(
      0,
    );
    expect(
      (
        await db.query('SELECT id FROM "LearningEvent" WHERE id=$1', [
          "old-learning-event",
        ])
      ).rowCount,
    ).toBe(0);
    await db.query(
      'INSERT INTO "Submission" (id,"assignmentId","studentId",status,"updatedAt") VALUES ($1,$2,$3,\'SUBMITTED\',NOW())',
      ["submitted-learning-report", a.id, a.studentId],
    );
    expect(
      (
        await request.post(endpoint, {
          headers,
          data: {
            events: [
              {
                eventId: "after-submit",
                kind: "HELP_REQUESTED",
                occurredAt: new Date().toISOString(),
                payload: {},
              },
            ],
          },
        })
      ).status(),
    ).toBe(409);
  } finally {
    await db.end();
  }
});
