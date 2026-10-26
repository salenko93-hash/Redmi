import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test("lab two web material replaces the PDF and the circular instrument follows its controls", async ({
  page,
}) => {
  await page.goto("/materials/2");
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
  const href = await page.locator(".lab-card").nth(1).getAttribute("href");
  await page.goto(href!);
  await expect(
    page.getByRole("link", { name: "Вебпам’ятка до роботи", exact: true }),
  ).toHaveAttribute("href", "/materials/2");
  await expect(page.locator('a[href="/originals/lab-2.pdf"]')).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Сучасна вебпам’ятка до роботи № 2/ }),
  ).toBeVisible();
  await page.goto("/materials/2");
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET" && r.url().includes("/api/assignments"))
      writes.push(r.url());
  });
  await expect(
    page.getByRole("heading", {
      name: "Період і частота обертання",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(
      "#lab-two-guide iframe, #lab-two-guide object, #lab-two-guide embed",
    ),
  ).toHaveCount(0);
  await expect(page.locator('#lab-two-guide a[href$=".pdf"]')).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "Зміст вебпам’ятки" })
      .getByRole("link"),
  ).toHaveCount(6);
  await expect(page.locator("#guide-questions")).toContainText("24 години");
  await expect(page.locator("#guide-method")).toContainText(
    "почни відлік із 0",
  );
  const instrument = page.locator(".virtual-lab");
  const radius = instrument.getByLabel("Радіус кола", { exact: true });
  const orbit = instrument.locator('[data-instrument="orbit"]');
  await radius.focus();
  await radius.press("Home");
  const small = Number(await orbit.getAttribute("r"));
  await radius.press("End");
  expect(Number(await orbit.getAttribute("r")) / small).toBeCloseTo(3, 5);
  const cycles = instrument.getByLabel("Повних циклів", { exact: true });
  await cycles.focus();
  await cycles.press("Home");
  await page.emulateMedia({ reducedMotion: "reduce" });
  let first = 0;
  for (const count of [10, 20, 30]) {
    if (count > 10) {
      await cycles.focus();
      await cycles.press("ArrowRight");
    }
    await expect(
      instrument.locator('[data-instrument="rotation-count"]'),
    ).toHaveText(`0 / ${count}`);
    await instrument
      .getByRole("button", { name: "Запустити дослід", exact: true })
      .click();
    await expect(instrument.locator(".virtual-results")).toBeVisible();
    await expect(
      instrument.locator('[data-instrument="rotation-count"]'),
    ).toHaveText(`${count} / ${count}`);
    const time = Number(
      (
        await instrument.locator(".virtual-results dd").nth(1).innerText()
      ).replace(",", "."),
    );
    if (count === 10) first = time;
    else expect(time).toBeCloseTo((first * count) / 10, 4);
    const ball = instrument.locator('[data-instrument="rotating-ball"]');
    expect(Number(await ball.getAttribute("cx"))).toBeCloseTo(
      Number(await orbit.getAttribute("cx")) +
        Number(await orbit.getAttribute("r")),
      5,
    );
    expect(Number(await ball.getAttribute("cy"))).toBeCloseTo(
      Number(await orbit.getAttribute("cy")),
      5,
    );
    await expect(
      instrument.getByRole("button", {
        name: "Перенести покази в таблицю",
        exact: true,
      }),
    ).toBeDisabled();
  }
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await expect(
    instrument.locator('[data-instrument="rotation-count"]'),
  ).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(instrument).not.toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Час одного оберту. Оберти за секунду.",
      exact: true,
    }),
  ).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await expect(
    page.getByRole("link", { name: "До моїх завдань" }),
  ).toHaveAttribute("href", "/dashboard");
});
