import { test, expect } from "@playwright/test";
import { labs } from "../../lib/labs";
import {
  initialParameters,
  simulate,
  type SimulationRecord,
} from "../../lib/simulation";
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100",
  headers = { Origin: baseURL };
const password = "TestLab2026!";

test("all ten virtual laboratories operate on a touch-sized screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
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
  for (let n = 1; n <= 10; n++) {
    await page.goto(links[n - 1]);
    await page
      .getByRole("button", { name: "2 Експеримент", exact: true })
      .click();
    const instruments = page.locator(".virtual-lab");
    expect(await instruments.count()).toBe(
      labs[n - 1].content.experiments.length,
    );
    for (const instrument of await instruments.all()) {
      if (n === 4) {
        for (const [label, count] of [
          ["20 г", 2],
          ["5 г", 1],
          ["1 г", 1],
          ["200 мг", 2],
          ["50 мг", 1],
          ["20 мг", 1],
        ] as const) {
          for (let i = 0; i < count; i++)
            await instrument
              .getByRole("button", { name: "Додати " + label, exact: true })
              .click();
        }
      } else {
        const slider = instrument.locator("input[type=range]").first();
        await slider.focus();
        await slider.press("ArrowRight");
      }
      await instrument
        .getByRole("button", { name: "Запустити дослід", exact: true })
        .click();
      await expect(
        instrument.getByRole("heading", {
          name: "Покази приладів",
          exact: true,
        }),
      ).toBeVisible();
      if (n === 4)
        await expect(instrument.locator(".virtual-results")).toContainText(
          "Терези в рівновазі",
        );
      await expect(
        instrument.getByRole("button", {
          name: "Перенести покази в таблицю",
          exact: true,
        }),
      ).toBeDisabled();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      await instrument
        .getByRole("button", { name: "Скинути прилад", exact: true })
        .click();
      await expect(instrument.locator(".virtual-results")).toHaveCount(0);
    }
  }
  expect(errors).toEqual([]);
});

test("virtual readings persist, clear stale calculations, enforce mode and survive resubmission", async ({
  page,
  playwright,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const teacher = await playwright.request.newContext({ baseURL }),
    student = page.request;
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
      await student.post("/api/auth/register", {
        headers,
        data: {
          email: `virtual-${Date.now()}@test.invalid`,
          name: "Учень Віртуальної Лабораторії",
          password,
        },
      })
    ).status(),
  ).toBe(201);
  const c = await (
    await teacher.post("/api/classes", {
      headers,
      data: { name: "Віртуальні досліди" },
    })
  ).json();
  await student.post("/api/classes/join", { headers, data: { code: c.code } });
  const html = await (await teacher.get("/library")).text();
  const template = [...html.matchAll(/href="\/library\/([a-z0-9]+)"/g)][0][1];
  const a = await (
    await teacher.post("/api/assignments", {
      headers,
      data: {
        classroomId: c.id,
        labVersionId: template,
        dueAt: null,
        feedbackMode: "PRACTICE",
        experimentMode: "REAL",
      },
    })
  ).json();
  // Pupils cannot change teacher policy or save simulated data as real measurements.
  expect(
    (
      await student.patch(`/api/assignments/${a.id}/mode`, {
        headers,
        data: { experimentMode: "SIMULATION" },
      })
    ).status(),
  ).toBe(403);
  const p = initialParameters(1, "speed");
  const record: SimulationRecord = {
    modelVersion: 1,
    labNumber: 1,
    experimentId: "speed",
    rowIndex: 0,
    parameters: p,
    readings: simulate(1, "speed", p).readings,
    recordedAt: new Date().toISOString(),
  };
  expect(
    (
      await student.put(`/api/assignments/${a.id}/submission`, {
        headers,
        data: { revision: 0, answers: { simulationRecords: [record] } },
      })
    ).status(),
  ).toBe(422);
  expect(
    (
      await teacher.patch(`/api/assignments/${a.id}/mode`, {
        headers,
        data: { experimentMode: "SIMULATION" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await student.put(`/api/assignments/${a.id}/submission`, {
        headers,
        data: {
          revision: 0,
          answers: {
            simulationRecords: [
              { ...record, readings: { l: "999", t: "999" } },
            ],
          },
        },
      })
    ).status(),
  ).toBe(422);
  await page.goto("/work/" + a.id);
  await page
    .getByPlaceholder("Я припускаю, що… тому що…")
    .fill("На довшому шляху кулька розганяється довше.");
  await page
    .getByRole("button", { name: "2 Експеримент", exact: true })
    .click();
  const instrument = page.locator(".virtual-lab").first();
  await instrument
    .getByLabel("Матеріал кульки", { exact: true })
    .selectOption("1");
  const diameter = instrument.getByLabel("Діаметр кульки", { exact: true });
  await diameter.focus();
  for (let i = 0; i < 4; i++) await diameter.press("ArrowRight");
  for (let i = 0; i < 3; i++) {
    await page
      .getByLabel("Рядок для Скочування кульки")
      .selectOption(String(i));
    if (i) {
      const slider = instrument.getByLabel("Довжина шляху");
      await slider.focus();
      await slider.press("ArrowLeft");
    }
    await instrument
      .getByRole("button", { name: "Запустити дослід", exact: true })
      .click();
    await expect(instrument.locator(".virtual-results")).toBeVisible();
    const row = page.locator(".experiment-row").nth(i);
    await row.locator("input").nth(2).fill("999");
    await instrument
      .getByRole("button", { name: "Перенести покази в таблицю", exact: true })
      .click();
    await instrument
      .getByRole("button", { name: "Підтвердити перенесення", exact: true })
      .click();
    await expect(row.locator("input").nth(2)).toHaveValue("");
    await expect(row.locator(".model-source")).toContainText("дані моделі");
    const distance = Number(
        (await row.locator("input").nth(0).inputValue()).replace(",", "."),
      ),
      time = Number(
        (await row.locator("input").nth(1).inputValue()).replace(",", "."),
      );
    await row
      .locator("input")
      .nth(2)
      .fill((distance / time).toFixed(4));
  }
  await expect(page.getByRole("status").first()).toHaveText(/Збережено/);
  const stored = await (
    await student.get(`/api/assignments/${a.id}/submission`)
  ).json();
  expect(stored.answers.simulationRecords).toHaveLength(3);
  for (const record of stored.answers.simulationRecords) {
    expect(record.parameters.material).toBe(1);
    expect(record.parameters.diameter).toBe(24);
  }
  expect(
    (
      await teacher.patch(`/api/assignments/${a.id}/mode`, {
        headers,
        data: { experimentMode: "REAL" },
      })
    ).status(),
  ).toBe(409);
  await page.reload();
  await page
    .getByRole("button", { name: "2 Експеримент", exact: true })
    .click();
  await expect(page.locator(".model-source")).toHaveCount(3);
  const answers = stored.answers;
  answers.questions = [
    "На ділянках швидкість стала.",
    "Не можна точно, бо невідомий рух між вимірюваннями.",
    "Час 7 і 6 годин.",
  ];
  answers.conclusion = [
    "Рух кульки в моделі.",
    "Виміряно три часи скочування.",
    "Швидкість на довшому шляху більша.",
    "Модель ідеалізована, похибка округлення.",
  ];
  // An absent measurement record must not pass as a completed virtual workflow.
  const missing = await student.put(`/api/assignments/${a.id}/submission`, {
    headers,
    data: {
      answers: { ...answers, simulationRecords: [] },
      revision: stored.revision,
      submit: true,
    },
  });
  expect(missing.status()).toBe(422);
  const saved = await student.put(`/api/assignments/${a.id}/submission`, {
    headers,
    data: { answers, revision: stored.revision, submit: true },
  });
  expect(saved.status()).toBe(200);
  const s = await saved.json();
  expect(
    (
      await teacher.post(`/api/submissions/${s.id}/review`, {
        headers,
        data: {
          action: "return",
          revision: s.revision,
          rubric: [3, 3, 2, 2],
          feedback: "Уточніть межі моделі.",
        },
      })
    ).status(),
  ).toBe(200);
  const returned = await (
    await student.get(`/api/assignments/${a.id}/submission`)
  ).json();
  expect(returned.attempts[0].answers.simulationRecords).toHaveLength(3);
  expect(
    (
      await student.put(`/api/assignments/${a.id}/submission`, {
        headers,
        data: { answers, revision: returned.revision, submit: true },
      })
    ).status(),
  ).toBe(200);
  await page.reload();
  await expect(page.locator(".model-source")).toHaveCount(3);
  await expect(page.locator(".virtual-transfer button").first()).toBeDisabled();
  await teacher.dispose();
});
