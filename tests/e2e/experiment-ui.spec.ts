import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test.use({ hasTouch: true });
test("top navigation and right experiment controls keep precise edits, expanded mode and paused state usable", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  expect(
    (
      await page.request.post("/api/auth/register", {
        headers: { Origin: base },
        data: {
          email: `experiment-ui-${Date.now()}@test.invalid`,
          name: "Учень інтерфейсу",
          password: "LabDemo2026!",
        },
      })
    ).status(),
  ).toBe(201);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/library");
  await expect(
    page.getByRole("navigation", { name: "Головна навігація" }),
  ).toBeVisible();
  await expect(page.locator(".sidebar,.mobile-nav")).toHaveCount(0);
  expect(
    await page
      .locator(".main-wrapper")
      .evaluate((el) => getComputedStyle(el).marginLeft),
  ).toBe("0px");
  const href = await page.locator(".lab-card").nth(9).getAttribute("href");
  await page.goto(href!);
  await page
    .getByRole("button", { name: "2 Експеримент", exact: true })
    .click();
  const lab = page.locator(".virtual-lab");
  await lab.scrollIntoViewIfNeeded();
  await lab.evaluate((el) => el.scrollIntoView({ block: "start" }));
  const layout = await lab.evaluate((el) => {
    const scene = el.querySelector(".virtual-stage")!.getBoundingClientRect(),
      panel = el
        .querySelector(".virtual-control-panel")!
        .getBoundingClientRect(),
      run = el
        .querySelector(".virtual-toolbar button")!
        .getBoundingClientRect();
    return {
      scene: { right: scene.right, height: scene.height, top: scene.top },
      panel: { left: panel.left, top: panel.top },
      run: { left: run.left, top: run.top, bottom: run.bottom },
      height: innerHeight,
    };
  });
  expect(layout.panel.left).toBeGreaterThan(layout.scene.right);
  expect(layout.run.left).toBeGreaterThan(layout.scene.right);
  expect(layout.scene.height).toBeLessThan(550);
  expect(layout.run.bottom).toBeLessThan(layout.height);
  await page.screenshot({
    path: testInfo.outputPath("experiment-ui-desktop.png"),
    caret: "initial",
  });
  const exact = lab.getByLabel("Точне значення: Зовнішній об’єм пробірки", {
    exact: true,
  });
  await exact.fill("60");
  await exact.press("Enter");
  await expect(
    lab.getByLabel("Зовнішній об’єм пробірки", { exact: true }),
  ).toHaveValue("60");
  await lab
    .getByRole("button", {
      name: "Зменшити: Зовнішній об’єм пробірки",
      exact: true,
    })
    .click();
  await expect(exact).toHaveValue("50");
  await exact.fill("85");
  await exact.press("Enter");
  await expect(exact).toHaveValue("50");
  await expect(
    lab.getByText("Введи число від 40 до 80.", { exact: true }),
  ).toBeVisible();
  const sand = lab.getByLabel("Точне значення: Маса піску", { exact: true });
  await sand.fill("20");
  await sand.press("Enter");
  await lab
    .getByRole("button", { name: "Запустити дослід", exact: true })
    .click();
  await page.waitForFunction(() => {
    const e = document.querySelector(
      '.virtual-lab [data-instrument="floating-tube"]',
    ) as SVGGraphicsElement;
    return e && e.getBBox().y < 170;
  });
  await lab.getByRole("button", { name: "Розгорнути", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /Керування дослідом:/ });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByLabel("Точне значення: Маса піску", { exact: true }),
  ).toHaveValue("20");
  await dialog.getByRole("button", { name: "Пауза", exact: true }).click();
  const position = () =>
    page
      .locator('[data-instrument="floating-tube"]')
      .evaluate((el) => (el as SVGGraphicsElement).getBBox().y);
  const paused = await position();
  await page.waitForTimeout(180);
  expect(await position()).toBe(paused);
  await dialog.screenshot({
    path: testInfo.outputPath("experiment-ui-expanded.png"),
    caret: "initial",
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(await position()).toBe(paused);
  await expect(
    lab.getByRole("button", { name: "Розгорнути", exact: true }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  await lab.getByRole("button", { name: "Продовжити", exact: true }).click();
  await expect(lab.locator(".virtual-results")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await lab
    .getByRole("button", { name: "Зменшити: Маса піску", exact: true })
    .tap();
  await expect(sand).toHaveValue("19");
  await page
    .getByRole("navigation", { name: "Головна навігація" })
    .getByRole("link", { name: "Мій клас", exact: true })
    .click();
  await expect(page).toHaveURL(/\/classes/);
  expect(errors).toEqual([]);
});
