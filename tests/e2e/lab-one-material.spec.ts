import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";

test("lab one replaces its PDF with a responsive web material and native chart", async ({
  page,
}) => {
  await page.goto("/materials/1");
  await expect(page).toHaveURL(base + "/");
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers: { Origin: base },
        data: { email: "teacher@demo.test", password: "LabDemo2026!" },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/library");
  const href = await page.locator(".lab-card").first().getAttribute("href");
  await page.goto(href!);
  await expect(
    page.getByRole("link", { name: "Вебпам’ятка до роботи", exact: true }),
  ).toHaveAttribute("href", "/materials/1");
  await expect(page.locator('a[href="/originals/lab-1.pdf"]')).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Сучасна вебпам’ятка/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "3 Запитання", exact: true }).click();
  await expect(page.locator(".speed-time-plot").first()).toBeVisible();
  await expect(page.locator(".question-figure img")).toHaveCount(0);
  const interval = page.getByRole("button", { name: "20–30 с", exact: true });
  await interval.click();
  await expect(interval).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Збільшити графік", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Збільшений графік швидкості" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByText("Текстові дані графіка", { exact: true }).click();
  await expect(page.getByRole("table")).toContainText("100");

  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET" && r.url().includes("/api/assignments"))
      writes.push(r.url());
  });
  await page.goto("/materials/1");
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await expect(
    page.getByRole("heading", { name: "Середня швидкість руху", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(
      "#lab-one-guide iframe, #lab-one-guide object, #lab-one-guide embed",
    ),
  ).toHaveCount(0);
  await expect(page.locator('#lab-one-guide a[href$=".pdf"]')).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "Зміст вебпам’ятки" })
      .getByRole("link"),
  ).toHaveCount(6);
  await page.locator('a[href="#guide-method"]').first().click();
  await expect(
    page.getByRole("heading", {
      name: "Змінюй шлях. Решту умов зберігай.",
      exact: true,
    }),
  ).toBeInViewport();
  await expect(page.locator("#guide-questions")).toContainText("240 км");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const instrument = page.locator(".virtual-lab");
  await instrument
    .getByRole("button", { name: "Запустити дослід", exact: true })
    .click();
  await expect(instrument.locator(".virtual-results")).toBeVisible();
  await expect(
    instrument.getByRole("button", {
      name: "Перенести покази в таблицю",
      exact: true,
    }),
  ).toBeDisabled();
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await expect(
    page.locator("#guide-questions .speed-time-plot").first(),
  ).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".virtual-lab")).not.toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Одна формула. Два вимірювання.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator("#guide-questions .speed-time-plot").first(),
  ).toBeVisible();
});
