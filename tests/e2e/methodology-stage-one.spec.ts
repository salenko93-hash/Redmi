import {
  test,
  expect,
  type Page,
  type PlaywrightWorkerArgs,
  type TestInfo,
} from "@playwright/test";
import { Client } from "pg";
import { spawnSync } from "node:child_process";
import { initialParameters, simulate } from "../../lib/simulation";
import { emptyAnswers } from "../../lib/physics";
import { compactConclusions } from "../../lib/ramp-inquiry";
import type { Answers, LabContent } from "../../lib/types";
const origin = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const headers = { Origin: origin };
async function fixture(
  page: Page,
  playwright: PlaywrightWorkerArgs["playwright"],
  number: number,
) {
  const url = process.env.DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test"))
    throw new Error("Disposable test database required");
  const db = new Client({ connectionString: url });
  await db.connect();
  let lab: { id: string; content: LabContent };
  try {
    lab = (
      await db.query(
        "SELECT id,content FROM \"LabVersion\" WHERE number=$1 AND \"authorId\" IS NULL AND content->'methodology'->>'version'='2026-11'",
        [number],
      )
    ).rows[0];
  } finally {
    await db.end();
  }
  expect(lab!).toBeTruthy();
  const teacher = await playwright.request.newContext({ baseURL: origin });
  expect(
    (
      await teacher.post("/api/auth/login", {
        headers,
        data: { email: "teacher@demo.test", password: "LabDemo2026!" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers,
        data: { email: "student@demo.test", password: "LabDemo2026!" },
      })
    ).status(),
  ).toBe(200);
  const classroom = await (
    await teacher.post("/api/classes", {
      headers,
      data: { name: `Методика №${number}` },
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
        labVersionId: lab!.id,
        dueAt: null,
        feedbackMode: "PRACTICE",
        experimentMode: number === 1 ? "REAL" : "SIMULATION",
      },
    })
  ).json();
  return {
    teacher,
    content: lab!.content,
    endpoint: `/api/assignments/${assignment.id}/submission`,
    href: `/work/${assignment.id}`,
  };
}
async function exportText(page: Page, info: TestInfo) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Зберегти PDF", exact: true }).click();
  const path = info.outputPath("methodology.pdf");
  await (await pending).saveAs(path);
  const result = spawnSync("pdftotext", [path, "-"], { encoding: "utf8" });
  expect(result.status).toBe(0);
  return result.stdout;
}
test("compact first lab saves one evidence field, repetitions and its frozen forecast; seed keeps old versions", async ({
  page,
  playwright,
}, info) => {
  test.setTimeout(120_000);
  const f = await fixture(page, playwright, 1);
  try {
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    try {
      const before = (
        await db.query(
          'SELECT id,version,content FROM "LabVersion" ORDER BY number,version',
        )
      ).rows;
      expect(
        before.filter((v) => v.content.inquiry === "ramp-v1"),
      ).toHaveLength(1);
      expect(before.filter((v) => v.content.methodology)).toHaveLength(3);
      expect(
        spawnSync("npm", ["run", "db:seed"], {
          env: process.env,
          encoding: "utf8",
        }).status,
      ).toBe(0);
      expect(
        (
          await db.query(
            'SELECT id,version,content FROM "LabVersion" ORDER BY number,version',
          )
        ).rows,
      ).toEqual(before);
    } finally {
      await db.end();
    }
    await page.goto(f.href);
    await page
      .getByPlaceholder("Я припускаю, що… тому що…")
      .fill("ЗБЕРЕЖЕНИЙ_ПРОГНОЗ: кулька розганяється.");
    const plan = page.getByRole("region", {
      name: "Мій план перевірки",
      exact: true,
    });
    await expect(plan.locator("textarea")).toHaveCount(1);
    await plan
      .getByRole("textbox")
      .fill(
        "ПЛАН_УМОВ: змінюю шлях, нахил і кулька сталі; час фіксую секундоміром.",
      );
    await plan
      .getByRole("button", { name: "Зафіксувати прогноз і план", exact: true })
      .click();
    await page
      .getByRole("button", { name: "2 Експеримент", exact: true })
      .click();
    for (const [i, row] of (
      await page.locator(".experiment-row").all()
    ).entries()) {
      for (const [j, value] of [
        ["1.2", "1.2", "1"],
        ["0.9", "1", "0.9"],
        ["0.6", "0.8", "0.75"],
      ][i].entries())
        await row.locator("input").nth(j).fill(value);
    }
    const evidence = page.getByRole("region", {
      name: "Перевіряю докази",
      exact: true,
    });
    await expect(evidence.locator("textarea")).toHaveCount(1);
    await evidence
      .getByRole("textbox")
      .fill("ОДИН_ЗАПИС_ДОКАЗІВ: 1,2 м за 1,2 с та 0,6 м за 0,8 с.");
    await page
      .getByText("Повторні вимірювання часу · за можливості", { exact: true })
      .click();
    await page
      .getByLabel("Дослід 1: шлях для повторів, м", { exact: true })
      .fill("1.2");
    for (const [i, value] of ["1.1", "1.2", "1.3"].entries())
      await page
        .getByLabel(`Дослід 1: повтор ${i + 1}, с`, { exact: true })
        .fill(value);
    await page
      .getByLabel("Дослід 1: що показали повтори?", { exact: true })
      .fill("ПОВТОРИ_ЗБЕРЕЖЕНО: розкид часу 0,2 с.");
    await page
      .getByRole("button", { name: "3 Запитання", exact: true })
      .click();
    await expect(page.locator(".answer-label textarea")).toHaveCount(1);
    await page
      .locator(".answer-label textarea")
      .fill("Пояснення характеру руху за графіком.");
    await page.getByRole("button", { name: "4 Висновок", exact: true }).click();
    await expect(
      page.getByText("ОДИН_ЗАПИС_ДОКАЗІВ", { exact: false }),
    ).toBeVisible();
    for (const [i, label] of compactConclusions.entries())
      if (i !== 1)
        await page
          .getByLabel(label, { exact: true })
          .fill("Висновок обмежений умовами та реакцією під час вимірювання.");
    await expect(
      page
        .getByRole("region", {
          name: "Повертаюся до свого прогнозу",
          exact: true,
        })
        .locator("textarea"),
    ).toHaveCount(0);
    await expect
      .poll(
        async () =>
          (await (await page.request.get(f.endpoint)).json())?.answers
            ?.conclusion?.[3],
      )
      .toContain("Висновок обмежений умовами");
    await page.reload();
    await page.getByRole("button", { name: "4 Висновок", exact: true }).click();
    await expect(
      page.getByRole("region", {
        name: "Повертаюся до свого прогнозу",
        exact: true,
      }),
    ).toContainText("ЗБЕРЕЖЕНИЙ_ПРОГНОЗ");
    const pdf = await exportText(page, info);
    for (const text of [
      "ОДИН_ЗАПИС_ДОКАЗІВ",
      "ПЛАН_УМОВ",
      "ПОВТОРИ_ЗБЕРЕЖЕНО",
      "ЗБЕРЕЖЕНИЙ_ПРОГНОЗ",
    ])
      expect(pdf).toContain(text);
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("button", { name: "2 Експеримент", exact: true })
      .click();
    await page
      .getByText("Повторні вимірювання часу · за можливості", { exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("region", { name: "Перевіряю докази", exact: true })
      .screenshot({ path: info.outputPath("compact-evidence-mobile.png") });
    const stored = await (await page.request.get(f.endpoint)).json();
    const submitted = await page.request.put(f.endpoint, {
      headers,
      data: {
        answers: stored.answers,
        revision: stored.revision,
        submit: true,
      },
    });
    expect(submitted.status(), JSON.stringify(await submitted.json())).toBe(
      200,
    );
  } finally {
    await f.teacher.dispose();
  }
});

test("hydro transfers readings by 0.2 N, keeps reference separate and saves declared uncertainty", async ({
  page,
  playwright,
}, info) => {
  const f = await fixture(page, playwright, 9);
  try {
    await page.goto(f.href);
    await page
      .getByRole("button", { name: "2 Експеримент", exact: true })
      .click();
    const lab = page.locator(".virtual-lab");
    for (let i = 0; i < 3; i++) {
      await lab
        .getByLabel("Невідомий зразок", { exact: true })
        .selectOption(String(i));
      await lab
        .getByRole("combobox", {
          name: "Рядок для Зважування в повітрі та воді",
          exact: true,
        })
        .selectOption(String(i));
      await lab
        .getByRole("button", { name: "Запустити дослід", exact: true })
        .click();
      await expect(
        lab.getByRole("button", {
          name: "Перенести покази в таблицю",
          exact: true,
        }),
      ).toBeEnabled();
      if (i === 0) {
        await expect(lab.locator('[data-hydro-reading="P1"]')).toHaveText(
          "1,4",
        );
        await expect(lab.locator('[data-hydro-reading="P2"]')).toHaveText(
          "0,8",
        );
        await lab
          .getByText("Еталон моделі · окрема довідка", { exact: true })
          .click();
        await expect(lab).toContainText("1,35 Н");
      }
      await lab
        .getByRole("button", {
          name: "Перенести покази в таблицю",
          exact: true,
        })
        .click();
      await lab
        .getByRole("button", { name: "Підтвердити перенесення", exact: true })
        .click();
    }
    await page
      .getByLabel("Ціна поділки динамометра, Н", { exact: true })
      .fill("0,2");
    await page
      .getByLabel("Оцінка невизначеності одного відліку, Н", { exact: true })
      .fill("0,1");
    await expect
      .poll(
        async () =>
          (await (await page.request.get(f.endpoint)).json())?.answers
            ?.methodNotes?.["hydro.uncertainty"],
      )
      .toBe("0,1");
    const stored = await (await page.request.get(f.endpoint)).json();
    expect(stored.answers.simulationRecords).toHaveLength(3);
    expect(stored.answers.simulationRecords[0]).toMatchObject({
      modelVersion: 3,
      parameters: { measurementMode: 1 },
      readings: { P1: "1.4", P2: "0.8" },
    });
    expect(stored.answers.experiments.hydro[0].rho).toBeUndefined();
    await page.reload();
    await page
      .getByRole("button", { name: "2 Експеримент", exact: true })
      .click();
    await expect(
      page.getByLabel("Оцінка невизначеності одного відліку, Н", {
        exact: true,
      }),
    ).toHaveValue("0,1");
    const pdf = await exportText(page, info);
    expect(pdf).toContain("Оцінка невизначеності одного відліку: 0,1 Н");
    expect(pdf).toContain("модель v3");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("region", { name: "Перевірка умов і точності", exact: true })
      .screenshot({ path: info.outputPath("hydro-precision-mobile.png") });
  } finally {
    await f.teacher.dispose();
  }
});

test("floating warns on three sinking rows; an explained exception can be submitted and reviewed without an automatic grade", async ({
  page,
  playwright,
}, info) => {
  const f = await fixture(page, playwright, 10);
  try {
    const c = f.content,
      a: Answers = {
        ...emptyAnswers(c),
        prediction: "З меншою масою тіло спливатиме",
        questions: c.questions.map(() => "Відповідь із поясненням"),
        conclusion: [
          "Дослідив стани",
          "Усі три рази потонуло",
          "Потрібні менші маси",
          "Перевірю повний об’єм",
        ],
        diagram: [
          { gravity: 3, buoyancy: 2, support: 0, state: "Тоне до дна" },
          {
            gravity: 2,
            buoyancy: 2,
            support: 0,
            state: "Очікувана нейтральність",
          },
          { gravity: 1, buoyancy: 1, support: 0, state: "Очікувана поверхня" },
        ],
      };
    const parameters = initialParameters(10, "floating"),
      result = simulate(10, "floating", parameters);
    a.simulationRecords = [0, 1, 2].map((rowIndex) => ({
      modelVersion: result.modelVersion,
      labNumber: 10,
      experimentId: "floating",
      rowIndex,
      parameters,
      readings: result.readings,
      recordedAt: new Date().toISOString(),
    }));
    a.experiments = {
      floating: a.simulationRecords.map((r) => ({ ...r.readings, rho: "1.2" })),
    };
    const rejected = await page.request.put(f.endpoint, {
      headers,
      data: { answers: a, revision: 0, submit: true },
    });
    expect(rejected.status()).toBe(422);
    expect((await rejected.json()).missing.join(" ")).toContain(
      "поясніть попередження",
    );
    expect(
      (
        await page.request.put(f.endpoint, {
          headers,
          data: { answers: a, revision: 0, submit: false },
        })
      ).status(),
    ).toBe(200);
    await page.goto(f.href);
    await page
      .getByRole("button", { name: "2 Експеримент", exact: true })
      .click();
    const review = page.getByRole("region", {
      name: "Перевірка умов і точності",
      exact: true,
    });
    await expect(review).toContainText(
      "Усередині рідини: записані маса й об’єм",
    );
    const explanation =
      "ПОЯСНЕННЯ_НЕВІДПОВІДНОСТІ: усі рази використав ту саму масу; для нейтральності та поверхні потрібні нові досліди з меншим піском.";
    await review
      .getByLabel("Пояснення перевірки даних", { exact: true })
      .fill(explanation);
    await expect
      .poll(
        async () =>
          (await (await page.request.get(f.endpoint)).json())?.answers
            ?.methodNotes?.["floating.review"],
      )
      .toBe(explanation);
    const pdf = await exportText(page, info);
    expect(pdf).toContain("ПОЯСНЕННЯ_НЕВІДПОВІДНОСТІ");
    expect(pdf).toContain("записані маса й об’єм");
    await page.evaluate(() => {
      window.print = () => {};
    });
    await page.getByRole("button", { name: "Друкувати", exact: true }).click();
    await expect(page.locator(".report-export")).toContainText(explanation);
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    const stored = await (await page.request.get(f.endpoint)).json();
    expect(
      (
        await page.request.put(f.endpoint, {
          headers,
          data: {
            answers: stored.answers,
            revision: stored.revision,
            submit: true,
          },
        })
      ).status(),
    ).toBe(200);
    const submitted = await (await page.request.get(f.endpoint)).json();
    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.score).toBeNull();
    expect(submitted.answers.experiments.floating).toEqual(
      a.experiments.floating,
    );
    await page.request.post("/api/auth/logout", { headers });
    expect(
      (
        await page.request.post("/api/auth/login", {
          headers,
          data: { email: "teacher@demo.test", password: "LabDemo2026!" },
        })
      ).status(),
    ).toBe(200);
    await page.goto(`/review/${submitted.id}`);
    await expect(
      page.getByRole("textbox", {
        name: "Пояснення перевірки даних",
        exact: true,
      }),
    ).toHaveValue(explanation);
    await expect(
      page.getByRole("textbox", {
        name: "Пояснення перевірки даних",
        exact: true,
      }),
    ).toBeDisabled();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    await f.teacher.dispose();
  }
});
