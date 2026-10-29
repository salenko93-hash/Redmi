import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
const origin = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const headers = { Origin: origin };
function pdfText(path: string) {
  const file = readFileSync(path);
  expect(file.subarray(0, 5).toString()).toBe("%PDF-");
  const parsed = spawnSync("pdftotext", ["-layout", path, "-"], {
    encoding: "utf8",
  });
  expect(
    parsed.status,
    "Install Poppler/pdftotext for report PDF verification",
  ).toBe(0);
  return parsed.stdout;
}
async function fakePrint(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    Reflect.set(window, "reportPrintCalls", 0);
    window.print = () => {
      Reflect.set(
        window,
        "reportPrintCalls",
        Reflect.get(window, "reportPrintCalls") + 1,
      );
    };
  });
}

test("PDF downloads directly for all ten labs, with Ukrainian text and figures", async ({
  page,
}, testInfo) => {
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers,
        data: { email: "teacher@demo.test", password: "LabDemo2026!" },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/library");
  const links = await page
    .locator(".lab-card")
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLAnchorElement).href));
  expect(links).toHaveLength(10);
  for (let i = 0; i < links.length; i++) {
    await page.goto(links[i]);
    await fakePrint(page);
    const downloadPromise = page.waitForEvent("download", { timeout: 40000 });
    await page
      .getByRole("button", { name: "Зберегти PDF", exact: true })
      .click();
    const download = await downloadPromise;
    const path = testInfo.outputPath(`lab-${i + 1}.pdf`);
    await download.saveAs(path);
    const text = pdfText(path);
    expect(text).toContain("ФізЛаб");
    expect(text).toContain("Підготовка");
    expect(text).toContain("Експеримент");
    expect(text).toContain("Контрольні запитання");
    expect(text).toContain("Висновок");
    expect(text).not.toContain("Зберегти PDF");
    expect(text).not.toContain("Калькулятор");
    if ([1, 4, 5, 6, 8, 10].includes(i + 1))
      expect(readFileSync(path).toString("latin1")).toContain(
        "/Subtype /Image",
      );
    expect(
      await page.evaluate(() => Reflect.get(window, "reportPrintCalls")),
    ).toBe(0);
    await expect(
      page.getByRole("button", { name: "Зберегти PDF", exact: true }),
    ).toBeEnabled();
    await expect(page.locator(".report-export")).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        document.body.classList.contains("report-print-active"),
      ),
    ).toBe(false);
  }
  expect(errors).toEqual([]);
});

test("PDF and printing include current long answers, all steps and review details without changing worksheet state", async ({
  page,
  playwright,
}, testInfo) => {
  test.setTimeout(90000);
  const teacher = await playwright.request.newContext({ baseURL: origin });
  const target = process.env.DATABASE_URL;
  if (!target || !new URL(target).pathname.endsWith("_test"))
    throw new Error("Disposable database required");
  const db = new Client({ connectionString: target });
  await db.connect();
  try {
    await teacher.post("/api/auth/login", {
      headers,
      data: { email: "teacher@demo.test", password: "LabDemo2026!" },
    });
    const registration = await page.request.post("/api/auth/register", {
      headers,
      data: {
        email: `report-${Date.now()}@test.invalid`,
        name: "Марія Дослідниця",
        password: "ReportLab2026!",
      },
    });
    expect(registration.status()).toBe(201);
    const classroom = await (
      await teacher.post("/api/classes", {
        headers,
        data: { name: "7-Г · Звіти" },
      })
    ).json();
    await page.request.post("/api/classes/join", {
      headers,
      data: { code: classroom.code },
    });
    const lab = (
      await db.query('SELECT id FROM "LabVersion" WHERE number=1 AND version=1')
    ).rows[0];
    const assignment = await (
      await teacher.post("/api/assignments", {
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
    await page.goto(`/work/${assignment.id}`);
    await page
      .getByPlaceholder("Я припускаю, що… тому що…")
      .fill("УНІКАЛЬНИЙ_ПРОГНОЗ: час залежить від шляху.");
    await page
      .getByRole("button", { name: "3 Запитання", exact: true })
      .click();
    const answer = page.getByPlaceholder("Відповідь і пояснення…").first();
    const long =
      "Спостереження за рухом підтверджує результати вимірювань. ".repeat(70) +
      "КІНЕЦЬ_ДОВГОЇ_ВІДПОВІДІ";
    await answer.fill(long);
    await fakePrint(page);
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Зберегти PDF", exact: true })
      .click();
    const path = testInfo.outputPath("current-answers.pdf");
    await (await downloadPromise).saveAs(path);
    const text = pdfText(path);
    expect(text).toContain("Марія Дослідниця");
    expect(text).toContain("7-Г · Звіти");
    expect(text).toContain("УНІКАЛЬНИЙ_ПРОГНОЗ");
    expect(text).toContain("КІНЕЦЬ_ДОВГОЇ_ВІДПОВІДІ");
    expect(text.split("\f").length).toBeGreaterThan(2);
    expect(
      await page.evaluate(() => Reflect.get(window, "reportPrintCalls")),
    ).toBe(0);
    await expect(page.locator(".work-steps .current")).toHaveText(/Запитання/);
    await expect(answer).toHaveValue(long);
    await page.getByRole("button", { name: "Друкувати", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, "reportPrintCalls")))
      .toBe(1);
    await expect(page.locator(".report-export")).toContainText(
      "КІНЕЦЬ_ДОВГОЇ_ВІДПОВІДІ",
    );
    await page.emulateMedia({ media: "print" });
    expect(
      await page
        .locator(".app-shell")
        .evaluate((el) => getComputedStyle(el).display),
    ).toBe("none");
    const printPdf = testInfo.outputPath("native-print.pdf");
    await page.pdf({ path: printPdf, format: "A4", printBackground: true });
    const printed = pdfText(printPdf);
    expect(printed).toContain("КІНЕЦЬ_ДОВГОЇ_ВІДПОВІДІ");
    expect(printed).toContain("Висновок");
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    await page.emulateMedia({ media: "screen" });
    await expect(page.locator(".report-export")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Друкувати", exact: true }),
    ).toBeFocused();
    await expect(answer).toHaveValue(long);
    await expect(page.locator(".work-steps .current")).toHaveText(/Запитання/);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .locator(".work-status-bar")
      .screenshot({ path: testInfo.outputPath("report-actions-mobile.png") });
    const submission = (
      await db.query('SELECT id FROM "Submission" WHERE "assignmentId"=$1', [
        assignment.id,
      ])
    ).rows[0];
    await db.query(
      "UPDATE \"Submission\" SET score=10,feedback=$2,status='GRADED' WHERE id=$1",
      [submission.id, "УЧИТЕЛЬ_ВІДГУК: пояснення перевірено."],
    );
    await page.request.post("/api/auth/logout", { headers });
    await page.request.post("/api/auth/login", {
      headers,
      data: { email: "teacher@demo.test", password: "LabDemo2026!" },
    });
    await page.goto(`/review/${submission.id}`);
    const reviewPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Зберегти PDF", exact: true })
      .click();
    const reviewPath = testInfo.outputPath("teacher-review.pdf");
    await (await reviewPromise).saveAs(reviewPath);
    const review = pdfText(reviewPath);
    expect(review).toContain("УЧИТЕЛЬ_ВІДГУК");
    expect(review).toContain("10/12");
    expect(review).toContain("Оцінено");
  } finally {
    await teacher.dispose();
    await db.end();
  }
});

test("a PDF preparation failure restores actions and leaves native printing available", async ({
  page,
}) => {
  await page.request.post("/api/auth/login", {
    headers,
    data: { email: "teacher@demo.test", password: "LabDemo2026!" },
  });
  await page.goto("/library");
  const link = await page.locator(".lab-card").first().getAttribute("href");
  await page.goto(link!);
  await fakePrint(page);
  await page.evaluate(() => {
    Reflect.set(
      window,
      "originalReportCanvasContext",
      HTMLCanvasElement.prototype.getContext,
    );
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.getByRole("button", { name: "Зберегти PDF", exact: true }).click();
  await expect(page.locator('.report-actions [role="alert"]')).toContainText(
    "Не вдалося підготувати PDF",
  );
  await expect(
    page.getByRole("button", { name: "Зберегти PDF", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".report-export")).toHaveCount(0);
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.getContext = Reflect.get(
      window,
      "originalReportCanvasContext",
    );
  });
  await page.getByRole("button", { name: "Друкувати", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "reportPrintCalls")))
    .toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(
    page.getByRole("button", { name: "Друкувати", exact: true }),
  ).toBeEnabled();
});
