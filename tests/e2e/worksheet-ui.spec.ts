import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test("teacher preview, ephemeral pupil trial, force vectors and adjacent figures", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET" && r.url().includes("/api/assignments/"))
      writes.push(r.url());
  });
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers: { Origin: base },
        data: { email: "teacher@demo.test", password: "LabDemo2026!" },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/library");
  const href = await page.locator(".lab-card").nth(9).getAttribute("href");
  await page.goto(href!);
  await expect(
    page.getByText("Перегляд шаблону — відповіді не зберігаються", {
      exact: true,
    }),
  ).toBeVisible();
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await page
    .getByRole("button", { name: "2 Експеримент", exact: true })
    .click();
  await expect(page.locator(".force-grid [data-force]")).toHaveCount(0);
  await expect(
    page.getByLabel("Сила тяжіння, схема 1", { exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Навчальний шаблон · тільки перегляд.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Спробувати як учень", exact: true })
    .click();
  await expect(
    page.getByText("Пробне проходження — відповіді не зберігаються", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByPlaceholder("Я припускаю, що… тому що…")
    .fill("Тестова відповідь, яка не має зберігатися.");
  await page
    .getByRole("button", { name: "2 Експеримент", exact: true })
    .click();
  const slider = page.getByLabel("Сила тяжіння, схема 1", { exact: true });
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(page.locator('[data-force="gravity"]')).toHaveCount(1);
  await expect(page.locator('[data-force="buoyancy"]')).toHaveCount(0);
  await page.getByLabel("Сила Архімеда, схема 1", { exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  const gravity = page.locator('[data-force="gravity"]'),
    buoyancy = page.locator('[data-force="buoyancy"]');
  expect(Number(await gravity.getAttribute("y2"))).toBeGreaterThan(
    Number(await gravity.getAttribute("y1")),
  );
  expect(Number(await buoyancy.getAttribute("y2"))).toBeLessThan(
    Number(await buoyancy.getAttribute("y1")),
  );
  await page.getByRole("button", { name: "3 Запитання", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator("#workspace-start")
        .evaluate((el) => el.getBoundingClientRect().top),
    )
    .toBeGreaterThanOrEqual(-1);
  await expect(page.locator(".question-figure")).toHaveCount(1);
  await expect(page.locator(".question-figure > svg")).toBeVisible();
  await expect(page.locator(".question-figure img")).toHaveCount(0);
  await expect(
    page.locator(".question-figure > svg [data-body-number]"),
  ).toHaveCount(3);
  await page
    .getByRole("button", { name: "Збільшити рисунок", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "4 Висновок", exact: true }).click();
  await page
    .getByRole("button", { name: "Завершити пробне проходження", exact: true })
    .click();
  await expect(page.getByRole("status").first()).toContainText(
    "Пробне проходження",
  );
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  expect(writes).toEqual([]);
  await page
    .getByRole("button", { name: "Повернутися до шаблону", exact: true })
    .click();
  await expect(page.getByPlaceholder("Я припускаю, що… тому що…")).toHaveValue(
    "",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "2 Експеримент", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await expect(
    page.getByText("Схему ще не побудовано", { exact: true }).first(),
  ).toBeVisible();
});
