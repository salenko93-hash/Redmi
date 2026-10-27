import { test, expect } from "@playwright/test";
test.use({ hasTouch: true });
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test("lab nine replaces PDF with matching gauges, correct immersion and volume-dependent sample size", async ({
  page,
}) => {
  const errors: string[] = [],
    writes: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
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
  async function checkFormula() {
    for (const formula of await page.getByRole("math").all()) {
      if (!(await formula.isVisible())) continue;
      expect(
        await formula.evaluate((el) => {
          const denominator = Array.from(el.querySelectorAll("i")).at(-1)!;
          const range = document.createRange();
          range.selectNodeContents(denominator);
          return (
            range.getClientRects().length === 1 &&
            el.scrollWidth <= el.clientWidth + 1
          );
        }),
      ).toBe(true);
    }
  }
  await checkFormula();
  const instrument = page.locator(".virtual-lab");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const parse = (v: string) => Number(v.replace(",", "."));
  const geometry = () =>
    instrument.evaluate((el) => {
      const air = el.querySelector('[data-instrument="hydro-air-body"]')!,
        body = el.querySelector('[data-instrument="hydro-water-body"]')!,
        water = el.querySelector('[data-instrument="hydro-water"]')!;
      const num = (e: Element, k: string) => Number(e.getAttribute(k));
      const spring = el
        .querySelector('[data-instrument="hydro-water-spring"]')!
        .getAttribute("points")!
        .trim()
        .split(" ")
        .map((point) => point.split(",").map(Number));
      return {
        springEnd: spring.at(-1)![1],
        stringStart: num(
          el.querySelector('[data-instrument="hydro-water-string"]')!,
          "y1",
        ),
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
  async function run(name = "Запустити дослід") {
    await instrument.getByRole("button", { name, exact: true }).click();
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
    expect(g.stringEnd - g.stringStart).toBeCloseTo(28, 4);
    expect(g.springEnd).toBe(g.waterPointer);
    // Read the actual zero and ten marks rather than copied metadata.
    const calibrated = await instrument
      .locator('[data-instrument="hydro-water-gauge"]')
      .evaluate((el) => {
        const zero =
          Number(
            el.querySelector('[data-gauge-value="0"]')!.getAttribute("y"),
          ) - 3;
        const ten =
          Number(
            el.querySelector('[data-gauge-value="10"]')!.getAttribute("y"),
          ) - 3;
        const needle = Number(
          el
            .querySelector('[data-instrument="hydro-water-pointer"]')!
            .getAttribute("y1"),
        );
        return ((needle - zero) / (ten - zero)) * 10;
      });
    expect(calibrated).toBeCloseTo(parse(text[2]), 4);
    expect(g.waterPointer).toBeLessThan(g.airPointer);
    return { p1: parse(text[1]), p2: parse(text[2]), g };
  }
  const first = await run();
  await instrument.getByLabel("Об’єм зразка", { exact: true }).press("End");
  await expect(instrument.locator(".virtual-results")).toHaveCount(0);
  const larger = await run();
  expect(larger.p1 / first.p1).toBeCloseTo(2, 6);
  expect(larger.p2 / first.p2).toBeCloseTo(2, 6);
  expect(larger.g.height / first.g.height).toBeCloseTo(Math.cbrt(2), 4);
  expect(larger.g.airPointer - larger.g.waterPointer).toBeCloseTo(12, 4);
  await instrument
    .getByLabel("Невідомий зразок", { exact: true })
    .selectOption("2");
  const other = await run();
  expect(other.p1).toBeGreaterThan(larger.p1);
  expect(other.p1 - other.p2).toBeCloseTo(larger.p1 - larger.p2, 6);
  expect(other.g.height).toBeCloseTo(larger.g.height, 4);
  // Pause a partial immersion: water, pointer and string must freeze together.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await instrument
    .getByRole("button", { name: "Запустити дослід", exact: true })
    .click();
  await page.waitForFunction(() => {
    const value = Number(
      document
        .querySelector('.virtual-lab [data-instrument="hydro-installation"]')
        ?.getAttribute("data-submerged-fraction"),
    );
    return value > 0.05 && value < 0.8;
  });
  await instrument.getByRole("button", { name: "Пауза", exact: true }).click();
  const paused = await geometry();
  expect(paused.waterPointer).toBeLessThan(paused.airPointer);
  expect(paused.top).toBeLessThan(paused.surface);
  expect(paused.top + paused.height).toBeGreaterThan(paused.surface);
  expect(paused.stringEnd - paused.stringStart).toBeCloseTo(28, 4);
  await page.waitForTimeout(180);
  expect(await geometry()).toEqual(paused);
  await expect(instrument.locator('[data-hydro-reading="P2"]')).toHaveText("—");
  await run("Продовжити");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await checkFormula();
  const volume = instrument.getByLabel("Об’єм зразка", { exact: true });
  await volume.scrollIntoViewIfNeeded();
  const box = (await volume.boundingBox())!;
  await page.touchscreen.tap(box.x + 5, box.y + box.height / 2);
  await expect(volume).toHaveValue("20");
  const small = await run();
  expect(small.p1).toBeCloseTo(1.792, 5);
  await expect(instrument.locator('[data-hydro-reading="P1"]')).toBeVisible();
  expect(errors).toEqual([]);
  await page.emulateMedia({ media: "print" });
  await expect(instrument).not.toBeVisible();
  await expect(page.locator("#guide-method table")).toBeVisible();
});
