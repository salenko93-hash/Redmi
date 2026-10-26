import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test("lab four replaces PDF, counts each weight, preserves balance direction and clarifies tare", async ({
  page,
}) => {
  await page.goto("/materials/4");
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
  const href = await page.locator(".lab-card").nth(3).getAttribute("href");
  await page.goto(href!);
  await expect(
    page.getByRole("link", { name: "Вебпам’ятка до роботи", exact: true }),
  ).toHaveAttribute("href", "/materials/4");
  await expect(page.locator('a[href="/originals/lab-4.pdf"]')).toHaveCount(0);
  await page.getByRole("button", { name: "3 Запитання", exact: true }).click();
  await expect(
    page.locator(".stones-figure .simulation-scene").first(),
  ).toBeVisible();
  await expect(page.locator(".stones-figure img")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Збільшити рисунок", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Збільшена схема терезів" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/materials/4");
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET" && r.url().includes("/api/assignments"))
      writes.push(r.url());
  });
  await expect(
    page.getByRole("heading", { name: "Вимірювання маси тіл", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(
      '#lab-four-guide a[href$=".pdf"], #lab-four-guide iframe, #lab-four-guide embed',
    ),
  ).toHaveCount(0);
  await expect(page.locator(".stones-figure")).toContainText(
    "масою мішечка знехтуй",
  );
  await expect(page.locator(".stones-loads")).toContainText("2 × 500 мг");
  await expect(page.locator(".stones-loads")).toContainText("1 × 50 г");
  const instrument = page.locator(".virtual-lab");
  const clear = instrument.getByRole("button", {
    name: "Прибрати всі важки",
    exact: true,
  });
  const pans = async () => [
    Number(
      await instrument
        .locator('[data-instrument="left-pan"]')
        .getAttribute("cy"),
    ),
    Number(
      await instrument
        .locator('[data-instrument="right-pan"]')
        .getAttribute("cy"),
    ),
  ];
  await expect(clear).toBeDisabled();
  let [left, right] = await pans();
  expect(left).toBeGreaterThan(right);
  await instrument
    .getByRole("button", { name: "Додати 100 г", exact: true })
    .click();
  [left, right] = await pans();
  expect(right).toBeGreaterThan(left);
  await clear.click();
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
  await expect(instrument.locator('[data-selected-weight="w20"]')).toHaveText(
    "2 × 20 г",
  );
  await expect(
    instrument.locator('[data-instrument="weight-bundle"][data-weight="w20"]'),
  ).toHaveAttribute("data-count", "2");
  await expect(
    instrument.locator('[data-selected-weight="w200mg"]'),
  ).toHaveText("2 × 200 мг");
  [left, right] = await pans();
  expect(left).toBeCloseTo(right, 5);
  await expect(instrument.locator(".balance-status")).toContainText(
    "Терези в рівновазі",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await instrument
    .getByRole("button", { name: "Запустити дослід", exact: true })
    .click();
  await expect(instrument.locator(".virtual-results")).toBeVisible();
  await expect(instrument.locator(".virtual-results dd")).toHaveCount(2);
  await expect(instrument.locator(".virtual-results")).not.toContainText(
    "46,47",
  );
  await expect(
    instrument.getByRole("button", {
      name: "Перенести покази в таблицю",
      exact: true,
    }),
  ).toBeDisabled();
  await instrument
    .getByLabel("Тіло на лівій шальці", { exact: true })
    .selectOption("3");
  await clear.click();
  await expect(
    instrument.getByLabel("Тіло на лівій шальці", { exact: true }),
  ).toHaveValue("3");
  await expect(instrument.locator("[data-selected-weight]")).toHaveCount(0);
  await expect(clear).toBeDisabled();
  await expect(instrument.locator(".virtual-results")).toHaveCount(0);
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
  await expect(page.locator(".stones-loads")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Кожен важок має значення",
      exact: true,
    }),
  ).toBeVisible();
});
