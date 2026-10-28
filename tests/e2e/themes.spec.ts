import { test, expect } from "@playwright/test";
import { themes, THEME_COOKIE } from "../../lib/themes";
const base = process.env.E2E_BASE_URL || "http://localhost:3100";
const headers = { Origin: base };
test("color themes persist in SSR, work on phones and preserve a paused experiment", async ({
  page,
  context,
  browser,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "forest");
  await page
    .getByLabel("Електронна пошта", { exact: true })
    .fill("appearance@test.invalid");
  const picker = page.getByLabel("Кольорова тема", { exact: true });
  for (const theme of themes) {
    await picker.selectOption(theme.id);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme.id);
    await expect(
      page.getByLabel("Електронна пошта", { exact: true }),
    ).toHaveValue("appearance@test.invalid");
    const rgb = theme.accent.match(/[\da-f]{2}/g)!.map((v) => parseInt(v, 16));
    await expect(
      page.getByRole("button", { name: "Увійти", exact: true }),
    ).toHaveCSS("background-color", `rgb(${rgb.join(", ")})`);
    await page.screenshot({
      path: testInfo.outputPath(`theme-${theme.id}-desktop.png`),
      fullPage: true,
      caret: "initial",
    });
  }
  await picker.selectOption("ocean");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ocean");
  expect(await (await page.request.get("/")).text()).toContain(
    'data-theme="ocean"',
  );
  const noJS = await browser.newContext({
    baseURL: base,
    javaScriptEnabled: false,
  });
  try {
    await noJS.addCookies(
      (await context.cookies()).filter((c) => c.name === THEME_COOKIE),
    );
    const ssr = await noJS.newPage();
    await ssr.goto("/");
    await expect(ssr.locator("html")).toHaveAttribute("data-theme", "ocean");
    await noJS.addCookies([
      { name: THEME_COOKIE, value: "invalid-palette", url: base },
    ]);
    await ssr.reload();
    await expect(ssr.locator("html")).toHaveAttribute("data-theme", "forest");
  } finally {
    await noJS.close();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: testInfo.outputPath("theme-ocean-mobile.png"),
    fullPage: true,
    caret: "initial",
  });
  expect(
    (
      await page.request.post("/api/auth/register", {
        headers,
        data: {
          name: "Колірний простір",
          email: `theme-${Date.now()}@test.invalid`,
          password: "ColorTest2026!",
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/account");
  await expect(page.getByRole("radio")).toHaveCount(5);
  await page.getByRole("radio", { name: "Лаванда", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "lavender");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(
    page.getByRole("button", {
      name: "Вийти з облікового запису",
      exact: true,
    }),
  ).toHaveCSS("background-color", "rgb(103, 68, 135)");
  await page.screenshot({
    path: testInfo.outputPath("theme-picker-desktop.png"),
    fullPage: true,
    caret: "initial",
  });
  await page.goto("/library");
  const href = await page.locator(".lab-card").first().getAttribute("href");
  await page.goto(href!);
  await page
    .getByRole("button", { name: "2 Експеримент", exact: true })
    .click();
  const lab = page.locator(".virtual-lab").first();
  await lab
    .getByRole("button", { name: "Запустити дослід", exact: true })
    .click();
  await lab.getByRole("button", { name: "Пауза", exact: true }).click();
  const scene = await lab.locator(".simulation-scene").innerHTML();
  await page.locator(".nav-account summary").click();
  await page
    .locator(".nav-account-menu")
    .getByLabel("Кольорова тема", { exact: true })
    .selectOption("sunrise");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sunrise");
  expect(await lab.locator(".simulation-scene").innerHTML()).toBe(scene);
  await expect(
    lab.getByRole("button", { name: "Продовжити", exact: true }),
  ).toBeVisible();
  await page.locator(".nav-account summary").click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sunrise");
  expect(errors).toEqual([]);
});
