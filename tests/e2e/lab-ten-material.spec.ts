import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test("lab ten replaces the final PDF, balances floating forces and preserves the same body in salt water", async ({
  page,
}) => {
  await page.goto("/materials/10");
  await expect(page).toHaveURL(base + "/");
  expect(
    (
      await page.request.post("/api/auth/register", {
        headers: { Origin: base },
        data: {
          email: `floating-guide-${Date.now()}@test.invalid`,
          name: "Учень плавучості",
          password: "LabDemo2026!",
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/library");
  const href = await page.locator(".lab-card").nth(9).getAttribute("href");
  await page.goto(href!);
  await expect(
    page.getByRole("link", { name: "Вебпам’ятка до роботи", exact: true }),
  ).toHaveAttribute("href", "/materials/10");
  await expect(page.locator('a[href="/originals/lab-10.pdf"]')).toHaveCount(0);
  await page.getByRole("button", { name: "3 Запитання", exact: true }).click();
  await expect(page.locator(".floating-bodies-figure")).toBeVisible();
  await expect(page.locator(".floating-bodies-figure img")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Збільшити рисунок", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Збільшений рисунок плаваючих тіл" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/materials/10");
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
      name: "Тоне, зависає чи плаває?",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(
      '#lab-ten-guide a[href$=".pdf"], #lab-ten-guide iframe, #lab-ten-guide embed',
    ),
  ).toHaveCount(0);
  const figure = page.locator(".floating-bodies-figure");
  await figure.getByRole("button", { name: "Тіло 2", exact: true }).click();
  await expect(
    figure.locator('[data-body-number="1"]').first(),
  ).toHaveAttribute("opacity", "0.25");
  await expect(
    figure.locator('[data-body-number="2"]').first(),
  ).toHaveAttribute("opacity", "1");
  const instrument = page.locator(".virtual-lab");
  await page.emulateMedia({ reducedMotion: "reduce" });
  async function forceLengths() {
    return instrument
      .locator("[data-floating-force]")
      .evaluateAll((els) =>
        Object.fromEntries(
          els.map((el) => [
            el.getAttribute("data-floating-force"),
            Number(el.getAttribute("y2")) - Number(el.getAttribute("y1")),
          ]),
        ),
      );
  }
  const tube = () =>
    instrument.locator('[data-instrument="floating-tube"]').evaluate((el) => {
      const b = (el as SVGGraphicsElement).getBBox();
      return {
        top: b.y,
        bottom: b.y + b.height,
        height: b.height,
        radius: b.width / 2,
      };
    });
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
    const values = await instrument
      .locator(".virtual-results dd")
      .allTextContents();
    return { v: Number(values[0]), m: Number(values[1]), state: values[2] };
  }
  await expect(
    instrument.locator('[data-floating-force="support"]'),
  ).toHaveCount(0);
  const sinking = await run();
  expect(sinking).toMatchObject({ v: 50, m: 60 });
  let forces = await forceLengths();
  expect(forces.gravity).toBeGreaterThan(0);
  expect(forces.buoyancy).toBeLessThan(0);
  expect(forces.support).toBeLessThan(0);
  expect(forces.gravity + forces.buoyancy + forces.support).toBeCloseTo(0, 7);
  expect((await tube()).bottom).toBeCloseTo(390, 5);
  const sand = instrument.getByLabel("Маса піску", { exact: true });
  async function setSand(n: number) {
    await sand.press("Home");
    for (let i = 0; i < n; i++) await sand.press("ArrowRight");
  }
  await setSand(30);
  await expect(
    instrument.locator('[data-floating-force="support"]'),
  ).toHaveCount(0);
  const neutral = await run();
  expect(neutral).toMatchObject({ v: 50, m: 50 });
  expect(neutral.state).toContain("рівновага всередині");
  forces = await forceLengths();
  expect(forces.support).toBeUndefined();
  expect(forces.gravity + forces.buoyancy).toBeCloseTo(0, 7);
  expect((await tube()).top).toBeGreaterThan(150);
  await instrument.getByLabel("Рідина", { exact: true }).selectOption("1");
  const salted = await run();
  expect(salted.v).toBe(neutral.v);
  expect(salted.m).toBe(neutral.m);
  expect(salted.state).toContain("на поверхні");
  const g = await tube(),
    depth = g.bottom - 150;
  const fraction =
    depth <= g.radius
      ? (depth ** 2 * (g.radius - depth / 3)) /
        (g.radius ** 2 * (g.height - g.radius / 3))
      : ((2 / 3) * g.radius ** 3 + g.radius ** 2 * (depth - g.radius)) /
        (g.radius ** 2 * (g.height - g.radius / 3));
  expect(fraction).toBeCloseTo(1 / 1.03, 6);
  forces = await forceLengths();
  expect(forces.gravity + forces.buoyancy).toBeCloseTo(0, 6);
  await expect(instrument.locator(".virtual-results")).toContainText(
    "Солона вода — додаткове дослідження",
  );
  await instrument.getByLabel("Рідина", { exact: true }).selectOption("0");
  await setSand(20);
  const floating = await run();
  expect(floating).toMatchObject({ v: 50, m: 40 });
  expect((await tube()).top).toBeLessThan(150);
  forces = await forceLengths();
  expect(forces.support).toBeUndefined();
  expect(forces.gravity + forces.buoyancy).toBeCloseTo(0, 6);
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
  await expect(figure.locator('[data-body-number="1"]').first()).toHaveCSS(
    "opacity",
    "1",
  );
});
