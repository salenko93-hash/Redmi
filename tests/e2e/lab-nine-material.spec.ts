import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test("lab nine replaces PDF with matching gauges, correct immersion and volume-dependent sample size", async ({
  page,
}) => {
  await page.goto("/materials/9");
  await expect(page).toHaveURL(base + "/");
  expect(
    (
      await page.request.post("/api/auth/register", {
        headers: { Origin: base },
        // Isolate this guide from the demo pupil used by multi-device tests.
        data: {
          email: `hydro-guide-${Date.now()}@test.invalid`,
          name: "Учень гідростатики",
          password: "LabDemo2026!",
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/library");
  const href = await page.locator(".lab-card").nth(8).getAttribute("href");
  await page.goto(href!);
  await expect(
    page.getByRole("link", { name: "Вебпам’ятка до роботи", exact: true }),
  ).toHaveAttribute("href", "/materials/9");
  await expect(page.locator('a[href="/originals/lab-9.pdf"]')).toHaveCount(0);
  await page.goto("/materials/9");
  const errors: string[] = [],
    writes: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.method() !== "GET" && r.url().includes("/api/assignments"))
      writes.push(r.url());
  });
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await expect(
    page.getByRole("heading", {
      name: "Два зважування. Одна густина.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(
      '#lab-nine-guide a[href$=".pdf"], #lab-nine-guide iframe, #lab-nine-guide embed',
    ),
  ).toHaveCount(0);
  const instrument = page.locator(".virtual-lab");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const geometry = () =>
    instrument.evaluate((el) => {
      const air = el.querySelector('[data-instrument="hydro-air-body"]')!,
        body = el.querySelector('[data-instrument="hydro-water-body"]')!,
        water = el.querySelector('[data-instrument="hydro-water"]')!;
      const num = (e: Element, k: string) => Number(e.getAttribute(k));
      return {
        airTop: num(air, "y"),
        top: num(body, "y"),
        height: num(body, "height"),
        surface: num(water, "y"),
        bottom: num(water, "y") + num(water, "height"),
        airPointer: num(
          el.querySelector('[data-instrument="hydro-air-pointer"]')!,
          "y1",
        ),
        waterPointer: num(
          el.querySelector('[data-instrument="hydro-water-pointer"]')!,
          "y1",
        ),
        stringEnd: num(
          el.querySelector('[data-instrument="hydro-water-string"]')!,
          "y2",
        ),
      };
    });
  const dry = await geometry();
  expect(dry.top).toBeGreaterThan(180);
  expect(dry.top + dry.height).toBeLessThan(dry.surface - 16);
  async function run() {
    await instrument
      .getByRole("button", { name: "Запустити дослід", exact: true })
      .click();
    await expect(instrument.locator(".virtual-results")).toBeVisible();
    await expect(instrument.locator(".virtual-results dd")).toHaveCount(3);
    await expect(
      instrument.getByRole("button", {
        name: "Перенести покази в таблицю",
        exact: true,
      }),
    ).toBeDisabled();
    const text = await instrument
      .locator(".virtual-results dd")
      .allTextContents();
    await expect(
      instrument.locator('[data-instrument="hydro-air-reading"]'),
    ).toHaveText(text[1].replace(".", ",") + " Н");
    await expect(
      instrument.locator('[data-instrument="hydro-water-reading"]'),
    ).toHaveText(text[2].replace(".", ",") + " Н");
    const g = await geometry();
    expect(g.top).toBeGreaterThan(g.surface);
    expect(g.top + g.height).toBeLessThan(g.bottom);
    expect(g.stringEnd).toBe(g.top);
    expect(g.waterPointer).toBeLessThan(g.airPointer);
    return { p1: Number(text[1]), p2: Number(text[2]), g };
  }
  const first = await run();
  await instrument.getByLabel("Об’єм зразка", { exact: true }).press("End");
  await expect(instrument.locator(".virtual-results")).toHaveCount(0);
  const larger = await run();
  expect(larger.p1 / first.p1).toBeCloseTo(2, 6);
  expect(larger.p2 / first.p2).toBeCloseTo(2, 6);
  expect(larger.g.height / first.g.height).toBeCloseTo(Math.cbrt(2), 6);
  expect(larger.g.airPointer - larger.g.waterPointer).toBeCloseTo(8, 6);
  await instrument
    .getByLabel("Невідомий зразок", { exact: true })
    .selectOption("2");
  const other = await run();
  expect(other.p1).toBeGreaterThan(larger.p1);
  expect(other.p1 - other.p2).toBeCloseTo(larger.p1 - larger.p2, 6);
  expect(other.g.height).toBeCloseTo(larger.g.height, 6);
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.emulateMedia({ media: "print" });
  await expect(instrument).not.toBeVisible();
  await expect(page.locator("#guide-method table")).toBeVisible();
});
