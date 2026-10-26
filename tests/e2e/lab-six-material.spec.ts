import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test("lab six replaces PDF and shows calibrated elastic lengths, unloading and a native spring graph", async ({
  page,
}) => {
  await page.goto("/materials/6");
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
  const href = await page.locator(".lab-card").nth(5).getAttribute("href");
  await page.goto(href!);
  await expect(
    page.getByRole("link", { name: "Вебпам’ятка до роботи", exact: true }),
  ).toHaveAttribute("href", "/materials/6");
  await expect(page.locator('a[href="/originals/lab-6.pdf"]')).toHaveCount(0);
  await page.getByRole("button", { name: "3 Запитання", exact: true }).click();
  await expect(page.locator(".stiffness-figure svg").first()).toBeVisible();
  await expect(page.locator(".stiffness-figure img")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Збільшити графік", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Збільшений графік пружин" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/materials/6");
  const writes: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET" && r.url().includes("/api/assignments"))
      writes.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await expect(
    page.getByRole("heading", {
      name: "Пружність: що розповідає розтягнення",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(
      '#lab-six-guide a[href$=".pdf"], #lab-six-guide iframe, #lab-six-guide embed',
    ),
  ).toHaveCount(0);
  const figure = page.locator(".stiffness-figure");
  await figure.getByRole("button", { name: "Пружина 2", exact: true }).click();
  await expect(
    figure.getByRole("button", { name: "Пружина 2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    figure.locator('[data-spring-line="1"]').first(),
  ).toHaveAttribute("opacity", "0.25");
  await expect(
    figure.locator('[data-spring-line="2"]').first(),
  ).toHaveAttribute("opacity", "1");
  const instrument = page.locator(".virtual-lab");
  const mass = instrument.getByLabel("Маса вантажу", { exact: true });
  const initial = instrument.getByLabel("Початкова довжина", { exact: true });
  const material = instrument.getByLabel("Пружний елемент", { exact: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const length = () =>
    instrument
      .locator('[data-instrument="elastic-length"]')
      .evaluate((el) => (el as SVGLineElement).getTotalLength());
  const read = (s: string) => Number(s.replace(",", "."));
  async function run() {
    await instrument
      .getByRole("button", { name: "Запустити дослід", exact: true })
      .click();
    await expect(instrument.locator(".virtual-results")).toBeVisible();
    await expect(instrument.locator(".virtual-results dd")).toHaveCount(4);
    await expect(
      instrument.getByRole("button", {
        name: "Перенести покази в таблицю",
        exact: true,
      }),
    ).toBeDisabled();
    const values = await instrument
      .locator(".virtual-results dd")
      .allTextContents();
    await expect(
      instrument.locator('[data-instrument="elastic-length-reading"]'),
    ).toHaveText(values[3].replace(".", ",") + " см");
    expect((await length()) / 5.8).toBeCloseTo(read(values[3]), 3);
    return values.map(read);
  }
  const rubberSmall = await run();
  await expect(
    instrument.locator('[data-instrument="elastic-element"]'),
  ).toHaveJSProperty("tagName", "line");
  await mass.press("End");
  await expect(instrument.locator(".virtual-results")).toHaveCount(0);
  const rubberLarge = await run();
  expect(rubberLarge[1] / (rubberLarge[3] - rubberLarge[2])).toBeGreaterThan(
    rubberSmall[1] / (rubberSmall[3] - rubberSmall[2]),
  );
  await expect(
    instrument.locator('[data-instrument="elastic-load"]'),
  ).toHaveCount(4);
  await material.selectOption("1");
  await expect(
    instrument.locator('[data-instrument="elastic-element"]'),
  ).toHaveJSProperty("tagName", "polyline");
  const springLarge = await run();
  expect(springLarge[3] - springLarge[2]).toBeCloseTo(20, 3);
  await mass.press("Home");
  await mass.press("ArrowRight");
  const springSmall = await run();
  expect(
    (springLarge[3] - springLarge[2]) / (springSmall[3] - springSmall[2]),
  ).toBeCloseTo(4, 3);
  await initial.press("End");
  const longer = await run();
  expect(longer[2]).toBe(25);
  expect(longer[3] - springSmall[3]).toBeCloseTo(10, 3);
  await mass.press("Home");
  const unloaded = await run();
  expect(unloaded[2]).toBe(unloaded[3]);
  await expect(
    instrument.locator('[data-instrument="elastic-extension"]'),
  ).toHaveCount(0);
  await expect(
    instrument.locator('[data-instrument="elastic-load"]'),
  ).toHaveCount(0);
  await expect(instrument.locator(".virtual-results")).toContainText(
    "повернувся до початкової довжини",
  );
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
  await expect(figure.locator("svg").first()).toBeVisible();
  await expect(
    figure.getByRole("button", { name: "Пружина 2", exact: true }),
  ).not.toBeVisible();
});
