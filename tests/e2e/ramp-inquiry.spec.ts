import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
import { labs } from "../../lib/labs";
import {
  inquiryPlan,
  inquiryEvidence,
  inquiryReflection,
  inquiryConclusions,
  inquiryRubric,
} from "../../lib/ramp-inquiry";
const origin = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const headers = { Origin: origin };

test("the inquiry version preserves classic work, saves reasoning, exports it, and supports teacher assessment", async ({
  page,
  playwright,
}, info) => {
  test.setTimeout(120_000);
  const url = process.env.DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test"))
    throw new Error("Disposable test database required");
  const db = new Client({ connectionString: url });
  const teacher = await playwright.request.newContext({ baseURL: origin });
  await db.connect();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await teacher.post("/api/auth/login", {
      headers,
      data: { email: "teacher@demo.test", password: "LabDemo2026!" },
    });
    await page.request.post("/api/auth/login", {
      headers,
      data: { email: "student@demo.test", password: "LabDemo2026!" },
    });
    const versions = (
      await db.query(
        'SELECT id,version,content FROM "LabVersion" WHERE number=1 ORDER BY version',
      )
    ).rows;
    const classic = versions.find((v) => v.version === 1)!;
    const inquiry = versions.find((v) => v.content.inquiry === "ramp-v1")!;
    expect(classic.content.inquiry).toBeUndefined();
    expect(inquiry.version).toBeGreaterThan(1);
    const seed = spawnSync("npm", ["run", "db:seed"], {
      env: process.env,
      encoding: "utf8",
    });
    expect(seed.status).toBe(0);
    expect(
      (
        await db.query(
          'SELECT id,version,content FROM "LabVersion" WHERE number=1 ORDER BY version',
        )
      ).rows,
    ).toEqual(versions);
    await page.goto(`/library/${inquiry.id}`);
    await expect(
      page.getByRole("link", {
        name: "Відкрити попередній базовий варіант",
        exact: true,
      }),
    ).toHaveCount(0);
    await page.goto(`/library/${classic.id}`);
    await expect(
      page.getByRole("region", { name: "Мій план перевірки", exact: true }),
    ).toHaveCount(0);
    const classroom = await (
      await teacher.post("/api/classes", {
        headers,
        data: { name: "Дослідження з доказами" },
      })
    ).json();
    expect(
      (
        await page.request.post("/api/classes/join", {
          headers,
          data: { code: classroom.code },
        })
      ).status(),
    ).toBe(200);
    const assignment = await (
      await teacher.post("/api/assignments", {
        headers,
        data: {
          classroomId: classroom.id,
          labVersionId: inquiry.id,
          dueAt: null,
          feedbackMode: "PRACTICE",
          experimentMode: "REAL",
        },
      })
    ).json();
    const endpoint = `/api/assignments/${assignment.id}/submission`;
    const oldAnswers = {
      prediction: "Прогноз",
      experiments: {
        speed: Array.from({ length: 3 }, () => ({
          l: "1,2",
          t: "1,4",
          v: "0,857",
        })),
      },
      questions: labs[0].content.questions.map(() => "Пояснення"),
      conclusion: ["1", "2", "3", "4"],
    };
    const blocked = await page.request.put(endpoint, {
      headers,
      data: { answers: oldAnswers, revision: 0, submit: true },
    });
    expect(blocked.status()).toBe(422);
    expect((await blocked.json()).missing).toContain(
      "Зафіксуйте початковий прогноз і план перевірки.",
    );
    await page.goto(`/work/${assignment.id}`);
    const prediction = page.getByPlaceholder("Я припускаю, що… тому що…");
    const original =
      "ПОЧАТКОВИЙ_ПРОГНОЗ: швидкість однакова, бо кулька та нахил сталі.";
    await prediction.fill(original);
    const plan = page.getByRole("region", {
      name: "Мій план перевірки",
      exact: true,
    });
    const planValues = [
      "ПЛАН_ШЛЯХ: змінюю лише відстань",
      "СТАЛІ_УМОВИ: кулька, нахил і старт",
      "ВИМІРЮЮ: лінійка в метрах, секундомір у секундах",
      "СПРОСТУВАННЯ: різні середні швидкості",
    ];
    for (const [i, f] of inquiryPlan.entries())
      await plan
        .getByRole("textbox", {
          name: `Мій план перевірки: ${f.label}`,
          exact: true,
        })
        .fill(planValues[i]);
    await plan
      .getByRole("button", { name: "Зафіксувати прогноз і план", exact: true })
      .click();
    await prediction.fill(
      "УТОЧНЕНИЙ_ПРОГНОЗ: для відповіді потрібні вимірювання.",
    );
    await page
      .getByRole("button", { name: "2 Експеримент", exact: true })
      .click();
    for (const [i, row] of (
      await page.locator(".experiment-row").all()
    ).entries()) {
      for (const [j, text] of [
        String(1.2 - i * 0.2),
        String(1.4 - i * 0.1),
        String((1.2 - i * 0.2) / (1.4 - i * 0.1)),
      ].entries())
        await row.locator("input").nth(j).fill(text);
    }
    const evidence = page.getByRole("region", {
      name: "Перевіряю докази",
      exact: true,
    });
    await expect(evidence).toContainText(original);
    const evidenceValues = [
      "ДОКАЗИ_ЧИСЛА: 1,2 м за 1,4 с та 0,8 м за 1,2 с.",
      "НЕПЕВНІСТЬ_РЕАКЦІЯ: затримка натискання секундоміра.",
      "ПЕРЕВІРКА_ПОВТОР: зберіг шлях і повторив тричі.",
    ];
    for (const [i, f] of inquiryEvidence.entries())
      await evidence
        .getByRole("textbox", {
          name: `Перевіряю докази: ${f.label}`,
          exact: true,
        })
        .fill(evidenceValues[i]);
    await evidence
      .getByText("Повторна перевірка часу · за можливості", { exact: true })
      .click();
    await evidence.getByLabel("Сталий шлях, м", { exact: true }).fill("1,2");
    for (const [i, t] of ["1,3", "1,4", "1,5"].entries())
      await evidence.getByLabel(`Повтор ${i + 1}, с`, { exact: true }).fill(t);
    await evidence
      .getByLabel("Що показали повтори?", { exact: true })
      .fill("ПОВТОРИ_РОЗКИД: від 1,3 до 1,5 с.");
    await page
      .getByRole("button", { name: "3 Запитання", exact: true })
      .click();
    for (const box of await page.locator(".answer-label textarea").all())
      await box.fill("Відповідь із поясненням і перевіркою умов.");
    await page.getByRole("button", { name: "4 Висновок", exact: true }).click();
    for (const label of inquiryConclusions)
      await page
        .getByLabel(label, { exact: true })
        .fill(
          "ВИСНОВОК_ДОКАЗИ: 1,2 м / 1,4 с; висновок обмежений умовами досліду.",
        );
    const reflection = page.getByRole("region", {
      name: "Повертаюся до свого прогнозу",
      exact: true,
    });
    for (const [i, f] of inquiryReflection.entries())
      await reflection
        .getByRole("textbox", {
          name: `Повертаюся до свого прогнозу: ${f.label}`,
          exact: true,
        })
        .fill(
          i === 0
            ? "ПЕРЕГЛЯД_ДУМКИ: уточнюю прогноз через отримані числа."
            : "НАСТУПНА_ПЕРЕВІРКА: повторити за меншого нахилу.",
        );
    await expect
      .poll(
        async () =>
          (await (await page.request.get(endpoint)).json())?.answers
            ?.rampInquiry?.reflection?.revision,
      )
      .toContain("ПЕРЕГЛЯД_ДУМКИ");
    const stored = await (await page.request.get(endpoint)).json();
    expect(stored.answers.rampInquiry.snapshot.prediction).toBe(original);
    expect(stored.answers.prediction).toContain("УТОЧНЕНИЙ_ПРОГНОЗ");
    await page.reload();
    await page.getByRole("button", { name: "4 Висновок", exact: true }).click();
    await expect(reflection).toContainText(original);
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Зберегти PDF", exact: true })
      .click();
    const pdf = info.outputPath("ramp-inquiry.pdf");
    await (await download).saveAs(pdf);
    const parsed = spawnSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
    expect(parsed.status).toBe(0);
    for (const text of [
      "ПОЧАТКОВИЙ_ПРОГНОЗ",
      "УТОЧНЕНИЙ_ПРОГНОЗ",
      "ПЛАН_ШЛЯХ",
      "ДОКАЗИ_ЧИСЛА",
      "ПОВТОРИ_РОЗКИД",
      "ПЕРЕГЛЯД_ДУМКИ",
      "НАСТУПНА_ПЕРЕВІРКА",
    ])
      expect(parsed.stdout).toContain(text);
    await page.evaluate(() => {
      window.print = () => {};
    });
    await page.getByRole("button", { name: "Друкувати", exact: true }).click();
    await expect(page.locator(".report-export")).toContainText(
      "ПОВТОРИ_РОЗКИД",
    );
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    await expect(page.locator(".report-export")).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await reflection.screenshot({
      path: info.outputPath("inquiry-reflection-mobile.png"),
    });
    await page
      .getByRole("button", { name: "Здати роботу", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Підтвердити здавання", exact: true })
      .click();
    await expect
      .poll(
        async () => (await (await page.request.get(endpoint)).json())?.status,
      )
      .toBe("SUBMITTED");
    await page.request.post("/api/auth/logout", { headers });
    await page.request.post("/api/auth/login", {
      headers,
      data: { email: "teacher@demo.test", password: "LabDemo2026!" },
    });
    await page.goto(`/review/${stored.id}`);
    for (const criterion of inquiryRubric)
      await expect(
        page.getByRole("combobox", { name: criterion.label, exact: true }),
      ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Мій план перевірки", exact: true })
        .locator("textarea")
        .first(),
    ).toBeDisabled();
    await expect(
      page.getByRole("region", {
        name: "Повертаюся до свого прогнозу",
        exact: true,
      }),
    ).toContainText(original);
    for (const criterion of inquiryRubric)
      await page
        .getByRole("combobox", { name: criterion.label, exact: true })
        .selectOption("3");
    await page
      .getByRole("button", { name: "Зберегти оцінку", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (
            await db.query('SELECT status FROM "Submission" WHERE id=$1', [
              stored.id,
            ])
          ).rows[0].status,
      )
      .toBe("GRADED");
    expect(
      (
        await db.query('SELECT score,rubric FROM "Submission" WHERE id=$1', [
          stored.id,
        ])
      ).rows[0],
    ).toEqual({ score: 12, rubric: [3, 3, 3, 3] });
    expect(errors).toEqual([]);
  } finally {
    await db.end();
    await teacher.dispose();
  }
});
