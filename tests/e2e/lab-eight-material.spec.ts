import { test, expect } from "@playwright/test";
test.use({ hasTouch: true });
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test("lab eight replaces PDF, preserves oriented dimensions, separates load and area and explains weightlessness", async ({
  page,
}) => {
  const writes: string[] = [],
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/materials/8");
  await expect(page).toHaveURL(base + "/");
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers: { Origin: base },
        data: { email: "student@demo.test", password: "LabDemo2026!" },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/library");
  const href = await page.locator(".lab-card").nth(7).getAttribute("href");
  await page.goto(href!);
  await expect(
    page.getByRole("link", { name: "Вебпам’ятка до роботи", exact: true }),
  ).toHaveAttribute("href", "/materials/8");
  await expect(page.locator('a[href="/originals/lab-8.pdf"]')).toHaveCount(0);
  await page.getByRole("button", { name: "3 Запитання", exact: true }).click();
  await expect(page.locator(".weightlessness-figure")).toBeVisible();
  await page.goto("/materials/8");
  page.on("request", (r) => {
    if (r.method() !== "GET" && r.url().includes("/api/assignments"))
      writes.push(r.url());
  });
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await expect(
    page.getByRole("heading", {
      name: "Тиск: сила на одиницю площі",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(
      '#lab-eight-guide a[href$=".pdf"], #lab-eight-guide iframe, #lab-eight-guide embed',
    ),
  ).toHaveCount(0);
  const instrument = page.locator(".virtual-lab"),
    tabs = page.getByRole("tablist", { name: "Тренувальні серії тиску" });
  await expect(tabs.getByRole("tab")).toHaveCount(2);
  await expect(instrument).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(instrument.locator('[data-pressure-reading="F"]')).toHaveText(
    "—",
  );
  await expect(
    instrument.locator('[data-instrument="pressure-force-reading"]'),
  ).toHaveText("—");
  const geometry = () =>
    instrument
      .locator('[data-instrument="pressure-footprint"]')
      .evaluate((el) => ({
        width: Number(el.getAttribute("width")),
        height: Number(el.getAttribute("height")),
      }));
  const height = () =>
    instrument
      .locator('[data-instrument="pressure-block-front"]')
      .evaluate((el) => (el as SVGGraphicsElement).getBBox().height);
  const parse = (s: string) => Number(s.replace(",", "."));
  async function run(count: number) {
    await instrument
      .getByRole("button", { name: "Запустити дослід", exact: true })
      .click();
    await expect(instrument.locator(".virtual-results")).toBeVisible();
    await expect(instrument.locator(".virtual-results dd")).toHaveCount(count);
    await expect(
      instrument.getByRole("button", {
        name: "Перенести покази в таблицю",
        exact: true,
      }),
    ).toBeDisabled();
    return instrument.locator(".virtual-results dd").allTextContents();
  }
  const initial = await geometry(),
    initialHeight = await height();
  let values = await run(3);
  expect(parse(values[0])).toBe(2);
  const face = instrument.getByLabel("Опорна грань", { exact: true });
  await face.selectOption("1");
  await expect(instrument.locator(".virtual-results")).toHaveCount(0);
  let g = await geometry();
  expect(g.width).toBe(initial.width);
  expect(g.height / initial.height).toBeCloseTo(0.5, 5);
  expect((await height()) / initialHeight).toBeCloseTo(2, 5);
  values = await run(3);
  expect(parse(values[0])).toBe(2);
  await face.selectOption("2");
  g = await geometry();
  expect(g.width / initial.width).toBeCloseTo(0.5, 5);
  expect(g.height / initial.height).toBeCloseTo(0.5, 5);
  expect((await height()) / initialHeight).toBeCloseTo(4, 5);
  values = await run(3);
  expect(parse(values[0])).toBe(2);
  expect(parse(values[1]) * parse(values[2]) * 1200 ** 2).toBeCloseTo(
    g.width * g.height,
    5,
  );
  await instrument.getByLabel("Довжина бруска", { exact: true }).press("End");
  expect((await height()) / initialHeight).toBeCloseTo(6, 5);
  await tabs.getByRole("tab").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab").last()).toBeFocused();
  await expect(instrument.locator(".virtual-results")).toHaveCount(0);
  values = await run(2);
  const small = values.map(parse);
  expect(small).toEqual([0.0032, 3]);
  const footprint = await geometry();
  await instrument
    .getByLabel("Кількість тягарців", { exact: true })
    .press("End");
  values = await run(2);
  expect(values.map(parse)).toEqual([0.0032, 5]);
  expect(await geometry()).toEqual(footprint);
  await expect(
    instrument.locator('[data-instrument="pressure-load"]'),
  ).toHaveCount(3);
  await expect(
    instrument.locator('[data-instrument="pressure-area-reading"]'),
  ).toHaveText("0,0032 м²");
  await expect(
    instrument.locator('[data-instrument="pressure-force-reading"]'),
  ).toHaveText("5 Н");
  // A stationary block is observed with moving ruler cursors, not dropped.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await instrument
    .getByLabel("Кількість тягарців", { exact: true })
    .press("Home");
  const blockBefore = await instrument
    .locator('[data-instrument="pressure-block-front"]')
    .getAttribute("points");
  await instrument
    .getByRole("button", { name: "Запустити дослід", exact: true })
    .click();
  const cursor = () =>
    instrument
      .locator('[data-instrument="pressure-ruler-pointer-a"]')
      .getAttribute("x1");
  await page.waitForFunction(() => {
    const pointer = document.querySelector(
      '.virtual-lab [data-instrument="pressure-ruler-pointer-a"]',
    );
    return pointer && Number(pointer.getAttribute("x1")) > 100;
  });
  await instrument.getByRole("button", { name: "Пауза", exact: true }).click();
  const paused = await cursor();
  expect(Number(paused)).toBeGreaterThan(95);
  expect(Number(paused)).toBeLessThan(95 + footprint.width);
  await page.waitForTimeout(180);
  expect(await cursor()).toBe(paused);
  await expect(
    instrument.locator('[data-instrument="pressure-block-front"]'),
  ).toHaveAttribute("points", blockBefore!);
  await expect(instrument.locator('[data-pressure-reading="F"]')).toHaveText(
    "—",
  );
  await instrument
    .getByRole("button", { name: "Продовжити", exact: true })
    .click();
  await expect(instrument.locator(".virtual-results dd")).toHaveCount(2);
  expect(Number(await cursor()) - 95).toBeCloseTo(footprint.width, 5);
  await expect(instrument.locator('[data-pressure-reading="F"]')).toHaveText(
    "3",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  const model = page.locator(".weightlessness-figure");
  await expect(model.locator('[data-freefall-force="normal"]')).toHaveCount(1);
  const gravity = await model
    .locator('[data-freefall-force="gravity"]')
    .getAttribute("y2");
  await model
    .getByRole("button", { name: "Спільне вільне падіння", exact: true })
    .click();
  await expect(model.locator('[data-freefall-force="normal"]')).toHaveCount(0);
  await expect(
    model.locator('[data-freefall-force="gravity"]'),
  ).toHaveAttribute("y2", gravity!);
  await expect(model.locator("figcaption")).toContainText(
    "N = 0, вага P = 0; сила тяжіння діє",
  );
  await model
    .getByRole("button", { name: "Опора нерухома", exact: true })
    .click();
  await expect(model.locator('[data-freefall-force="normal"]')).toHaveCount(1);
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  const mobileLoads = instrument.getByLabel("Кількість тягарців", {
    exact: true,
  });
  await mobileLoads.scrollIntoViewIfNeeded();
  const slider = (await mobileLoads.boundingBox())!;
  await page.touchscreen.tap(
    slider.x + slider.width - 5,
    slider.y + slider.height / 2,
  );
  await expect(mobileLoads).toHaveValue("3");
  values = await run(2);
  expect(values.map(parse)).toEqual([0.0032, 5]);
  await expect(instrument.locator('[data-pressure-reading="F"]')).toBeVisible();
  expect(errors).toEqual([]);
  await page.emulateMedia({ media: "print" });
  await expect(instrument).not.toBeVisible();
  await expect(model.locator("svg")).toBeVisible();
  await expect(
    model.getByRole("button", { name: "Опора нерухома", exact: true }),
  ).not.toBeVisible();
});
