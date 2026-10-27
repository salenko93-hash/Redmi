import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const origin = { Origin: baseURL };
const password = "TestLab2026!";
async function post(api: APIRequestContext, url: string, data: unknown) {
  return api.post(url, { data, headers: origin });
}
async function register(api: APIRequestContext, email: string, name: string) {
  const r = await post(api, "/api/auth/register", { email, name, password });
  expect(r.status()).toBe(201);
}
test("real database workflow: roles, class join, save, conflict, submit, review, resubmit, immutable versions", async ({
  playwright,
}) => {
  const nonce = Date.now();
  const teacher = await playwright.request.newContext({ baseURL }),
    student = await playwright.request.newContext({ baseURL }),
    other = await playwright.request.newContext({ baseURL });
  const login = await post(teacher, "/api/auth/login", {
    email: "teacher@demo.test",
    password: "LabDemo2026!",
  });
  expect(login.status()).toBe(200);
  await register(student, `student-${nonce}@test.invalid`, "Тестовий Учень");
  await register(other, `other-${nonce}@test.invalid`, "Інший Учень");
  expect(
    (await post(student, "/api/classes", { name: "Чужий клас" })).status(),
  ).toBe(403);
  const c = await (
    await post(teacher, "/api/classes", { name: `Тест ${nonce}` })
  ).json();
  expect(
    (await post(student, "/api/classes/join", { code: c.code })).ok(),
  ).toBeTruthy();
  // Get seed template identifiers from authenticated server-rendered library links.
  const html = await (await teacher.get("/library")).text();
  const ids = [...html.matchAll(/href="\/library\/([a-z0-9]+)"/g)].map(
    (m) => m[1],
  );
  expect(ids.length).toBeGreaterThanOrEqual(10);
  const aRes = await post(teacher, "/api/assignments", {
    classroomId: c.id,
    labVersionId: ids[0],
    dueAt: null,
    feedbackMode: "INDEPENDENT",
    experimentMode: "REAL",
  });
  expect(aRes.status()).toBe(201);
  const a = await aRes.json();
  expect(
    (await other.get(`/api/assignments/${a.id}/submission`)).status(),
  ).toBe(404);
  expect(
    (
      await student.put(`/api/assignments/${a.id}/submission`, {
        headers: { Origin: "https://evil.example" },
        data: { answers: {}, revision: 0 },
      })
    ).status(),
  ).toBe(403);
  const answers = {
    prediction: "На довшому шляху кулька розганяється довше.",
    experiments: {
      speed: [
        { l: "1,2", t: "2", v: "0,6" },
        { l: "0,8", t: "1,6", v: "0,5" },
        { l: "0,4", t: "1", v: "0,4" },
      ],
    },
    questions: [
      "Швидкість стала на кожному відрізку.",
      "Точно ні, між вимірюваннями швидкість невідома.",
      "7 годин і 6 годин.",
    ],
    conclusion: [
      "Нерівномірний рух кульки.",
      "0,6; 0,5; 0,4 м/с.",
      "Прогноз підтвердився.",
      "Реакція під час вимірювання часу.",
    ],
  };
  const put = () =>
    student.put(`/api/assignments/${a.id}/submission`, {
      headers: origin,
      data: { answers, revision: 0 },
    });
  const saved = await put();
  expect(saved.status()).toBe(200);
  const s = await saved.json();
  expect(s.revision).toBe(1);
  expect((await put()).status()).toBe(409);
  const restored = await (
    await student.get(`/api/assignments/${a.id}/submission`)
  ).json();
  expect(restored.answers.prediction).toBe(answers.prediction);
  expect((await student.get(`/api/submissions/${s.id}/checks`)).status()).toBe(
    403,
  );
  const invalid = await student.put(`/api/assignments/${a.id}/submission`, {
    headers: origin,
    data: { answers: {}, revision: 1, submit: true },
  });
  expect(invalid.status()).toBe(422);
  const submitted = await student.put(`/api/assignments/${a.id}/submission`, {
    headers: origin,
    data: { answers, revision: 1, submit: true },
  });
  expect(submitted.status()).toBe(200);
  expect(
    (
      await student.put(`/api/assignments/${a.id}/submission`, {
        headers: origin,
        data: { answers, revision: 2 },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await post(other, `/api/submissions/${s.id}/review`, {
        action: "grade",
        revision: 2,
        rubric: [3, 3, 3, 3],
        feedback: "Fake",
      })
    ).status(),
  ).toBe(404);
  const checks = await (
    await teacher.get(`/api/submissions/${s.id}/checks`)
  ).json();
  expect(checks).toHaveLength(3);
  expect(
    checks.every((x: { error: string | null }) => x.error === null),
  ).toBeTruthy();
  expect(
    (
      await post(teacher, `/api/submissions/${s.id}/comments`, {
        field: "question-0",
        body: "Поясніть загальний характер руху.",
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await post(teacher, `/api/submissions/${s.id}/review`, {
        action: "return",
        revision: 2,
        rubric: [3, 3, 2, 2],
        feedback: "Уточніть відповідь на перше запитання.",
      })
    ).status(),
  ).toBe(200);
  const returned = await (
    await student.get(`/api/assignments/${a.id}/submission`)
  ).json();
  expect(returned.status).toBe("RETURNED");
  expect(returned.comments).toHaveLength(1);
  expect(returned.attempts).toHaveLength(1);
  expect(
    (
      await student.put(`/api/assignments/${a.id}/submission`, {
        headers: origin,
        data: { answers, revision: 3, submit: true },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await post(teacher, `/api/submissions/${s.id}/review`, {
        action: "grade",
        revision: 4,
        rubric: [3, 3, 3, 2],
        feedback: "Добре виконано.",
      })
    ).status(),
  ).toBe(200);
  const final = await (
    await student.get(`/api/assignments/${a.id}/submission`)
  ).json();
  expect(final.score).toBe(11);
  expect(final.attempts).toHaveLength(2);
  expect(final.attempts[0].feedback).toContain("Уточніть");
  const version = await post(teacher, `/api/labs/${ids[0]}`, {
    title: "Швидкість — нова версія",
    purpose: "Оновлена навчальна мета дослідження.",
    theory: "v = l / t",
    questions: ["Нове запитання для іншого призначення?"],
    creative: "Додаткове завдання",
  });
  expect(version.status()).toBe(201);
  const workHtml = await (await student.get("/work/" + a.id)).text();
  expect(workHtml).toContain("Середня швидкість руху");
  expect(workHtml).not.toContain("Швидкість — нова версія");
  const csv = await teacher.get("/api/export");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("Тестовий Учень");
  await teacher.dispose();
  await student.dispose();
  await other.dispose();
});
test("mobile student interface and local draft survive offline and synchronize", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Електронна пошта").fill("student@demo.test");
  await page.getByLabel("Пароль", { exact: true }).fill("LabDemo2026!");
  await page.getByRole("button", { name: "Увійти", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { name: /Вітаємо/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  await page.locator(".lab-card").first().click();
  await page
    .getByPlaceholder("Я припускаю, що… тому що…")
    .fill("Початкова чернетка");
  await expect(page.locator(".save-state")).toContainText("Збережено");
  await context.setOffline(true);
  await page
    .getByPlaceholder("Я припускаю, що… тому що…")
    .fill("Мій прогноз збережено без інтернету.");
  await expect(page.locator(".save-state")).toContainText("Немає з’єднання");
  await context.setOffline(false);
  await expect(page.locator(".save-state")).toHaveText(/Збережено/, {
    timeout: 15000,
  });
  const url = page.url();
  await page.reload();
  await expect(page.getByPlaceholder("Я припускаю, що… тому що…")).toHaveValue(
    "Мій прогноз збережено без інтернету.",
  );
  const second = await context.newPage();
  await second.goto(url);
  await expect(
    second.getByPlaceholder("Я припускаю, що… тому що…"),
  ).toHaveValue("Мій прогноз збережено без інтернету.");
  await second.close();
});
test("desktop dashboard, all templates and teacher editor render", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByLabel("Електронна пошта").fill("teacher@demo.test");
  await page.getByLabel("Пароль", { exact: true }).fill("LabDemo2026!");
  await page.getByRole("button", { name: "Увійти", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.goto("/library");
  const links = await page
    .locator(".lab-card")
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLAnchorElement).href));
  expect(links).toHaveLength(10);
  for (const href of links) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page
      .getByRole("button", { name: "2 Експеримент", exact: true })
      .click();
    await expect(page.locator(".experiment-row").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
});
test("recovery code rotates and revokes existing sessions", async ({
  playwright,
}) => {
  const api = await playwright.request.newContext({ baseURL });
  const email = `recover-${Date.now()}@test.invalid`;
  const registered = await (
    await post(api, "/api/auth/register", {
      email,
      name: "Відновлення Доступу",
      password,
    })
  ).json();
  expect(registered.recoveryCode).toHaveLength(64);
  const recovered = await post(api, "/api/auth/recover", {
    email,
    code: registered.recoveryCode,
    password: "Replacement2026!",
  });
  expect(recovered.status()).toBe(200);
  const replacement = await recovered.json();
  expect(replacement.recoveryCode).not.toBe(registered.recoveryCode);
  expect((await api.get("/api/me")).status()).toBe(401);
  expect(
    (
      await post(api, "/api/auth/recover", {
        email,
        code: registered.recoveryCode,
        password: "Replacement2027!",
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await post(api, "/api/auth/login", {
        email,
        password: "Replacement2026!",
      })
    ).status(),
  ).toBe(200);
  await api.dispose();
});
test("two devices cannot silently overwrite each other and pending local data can be exported", async ({
  browser,
}) => {
  const c1 = await browser.newContext(),
    c2 = await browser.newContext();
  const p1 = await c1.newPage(),
    p2 = await c2.newPage();
  for (const p of [p1, p2]) {
    await p.goto(baseURL);
    await p.getByLabel("Електронна пошта").fill("student@demo.test");
    await p.getByLabel("Пароль", { exact: true }).fill("LabDemo2026!");
    await p.getByRole("button", { name: "Увійти", exact: true }).click();
    await expect(p).toHaveURL(/dashboard/);
  }
  await p1.locator(".lab-card").first().click();
  await expect(p1).toHaveURL(/\/work\//);
  await p2.goto(p1.url());
  await p1
    .getByPlaceholder("Я припускаю, що… тому що…")
    .fill("Дані першого пристрою");
  await expect(p1.locator(".save-state")).toHaveText(/Збережено/);
  await p2
    .getByPlaceholder("Я припускаю, що… тому що…")
    .fill("Незбережені дані другого пристрою");
  await expect(p2.locator(".save-state")).toContainText("Конфлікт");
  await expect(p2.getByPlaceholder("Я припускаю, що… тому що…")).toHaveValue(
    "Незбережені дані другого пристрою",
  );
  const [download] = await Promise.all([
    p2.waitForEvent("download"),
    p2.getByRole("button", { name: "Завантажити поточну чернетку" }).click(),
  ]);
  expect(download.suggestedFilename()).toContain("draft.json");
  await p2.getByRole("button", { name: "Відкрити серверну версію" }).click();
  await expect(p2.getByPlaceholder("Я припускаю, що… тому що…")).toHaveValue(
    "Дані першого пристрою",
  );
  await c1.close();
  await c2.close();
});

test("student submits through the interface and teacher grades the displayed report", async ({
  page,
  browser,
}) => {
  const email = `ui-${Date.now()}@test.invalid`;
  expect(
    (
      await post(page.request, "/api/auth/register", {
        email,
        name: "Учень Інтерфейсу",
        password,
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await post(page.request, "/api/classes/join", { code: "FIZ7A2026" })
    ).status(),
  ).toBe(200);
  await page.goto("/dashboard");
  await page.locator(".lab-card").first().click();
  await expect(page).toHaveURL(/\/work\//);
  await page
    .getByPlaceholder("Я припускаю, що… тому що…")
    .fill("На довшому шляху швидкість зросте.");
  await page
    .getByRole("button", { name: "2 Експеримент", exact: true })
    .click();
  for (let i = 0; i < 3; i++) {
    const row = page.locator(".experiment-row").nth(i);
    await row
      .locator("input")
      .nth(0)
      .fill(String(1 - i * 0.2));
    await row.locator("input").nth(1).fill("2");
    await row
      .locator("input")
      .nth(2)
      .fill(String((1 - i * 0.2) / 2));
  }
  await page.getByRole("button", { name: "3 Запитання", exact: true }).click();
  for (const textarea of await page.locator(".work-section textarea").all())
    await textarea.fill("Пояснення з обґрунтуванням і розрахунками.");
  await page.getByRole("button", { name: "4 Висновок", exact: true }).click();
  for (const textarea of await page.locator(".question-label textarea").all())
    await textarea.fill("Власний висновок, результати та похибки вимірювання.");
  await page.getByRole("button", { name: "Здати роботу", exact: true }).click();
  await page
    .getByRole("button", { name: "Підтвердити здавання", exact: true })
    .click();
  await expect(
    page.getByText("Роботу здано. Редагування відкриється", { exact: false }),
  ).toBeVisible();
  const assignmentId = page.url().split("/").at(-1);
  const s = await (
    await page.request.get(`/api/assignments/${assignmentId}/submission`)
  ).json();
  expect(s.status).toBe("SUBMITTED");
  const teacherContext = await browser.newContext();
  const teacherPage = await teacherContext.newPage();
  await teacherPage.goto(baseURL);
  await teacherPage.getByLabel("Електронна пошта").fill("teacher@demo.test");
  await teacherPage.getByLabel("Пароль", { exact: true }).fill("LabDemo2026!");
  await teacherPage
    .getByRole("button", { name: "Увійти", exact: true })
    .click();
  await expect(teacherPage).toHaveURL(/dashboard/);
  await teacherPage.goto(`${baseURL}/review/${s.id}`);
  for (const select of await teacherPage.locator(".rubric-row select").all())
    await select.selectOption("3");
  await teacherPage
    .getByLabel("Коментар до роботи")
    .fill("Зрозумілий звіт. Добре виконано!");
  await teacherPage
    .getByRole("button", { name: "Зберегти оцінку", exact: true })
    .click();
  await expect(teacherPage.locator(".feedback-banner")).toContainText("12/12");
  await page.reload();
  await expect(page.locator(".feedback-banner")).toContainText("12/12");
  await expect(page.locator(".feedback-banner")).toContainText(
    "Добре виконано!",
  );
  await teacherContext.close();
});

test("health endpoint verifies database and initialized templates", async ({
  request,
}) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
