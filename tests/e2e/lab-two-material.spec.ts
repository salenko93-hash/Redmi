import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test.use({ hasTouch: true });
test("lab two web material replaces the PDF and the circular instrument follows its controls", async ({
  page,
}) => {
  const clientErrors: string[] = [];
  page.on("pageerror", (error) => clientErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") clientErrors.push(message.text());
  });
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
  const installation = instrument.locator(
    '[data-instrument="rotation-installation"]',
  );
  const timer = instrument.getByLabel("Час моделі", { exact: true });
  const countOutput = instrument.getByLabel("Повних обертів", { exact: true });
  const finalTime = await timer.innerText();
  await instrument.screenshot({
    path: test.info().outputPath("rotation-desktop.png"),
    caret: "initial",
  });
  await expect(installation).toHaveAttribute("data-view", "perspective");
  let shape = await orbit.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.height / rect.width;
  });
  expect(shape).toBeCloseTo(0.68, 5);
  await instrument
    .getByRole("button", { name: "Вигляд зверху", exact: true })
    .click();
  await expect(installation).toHaveAttribute("data-view", "top");
  shape = await orbit.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.height / rect.width;
  });
  expect(shape).toBeCloseTo(1, 5);
  await expect(timer).toHaveText(finalTime);
  await expect(countOutput).toHaveText("30 / 30");
  await instrument
    .getByRole("button", { name: "Об’ємний вигляд", exact: true })
    .click();
  await expect(timer).toHaveText(finalTime);
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
  await radius.scrollIntoViewIfNeeded();
  const sliderBox = (await radius.boundingBox())!;
  await radius.tap({
    position: { x: sliderBox.width * 0.2, y: sliderBox.height / 2 },
  });
  expect(await radius.inputValue()).not.toBe("0.3");
  await expect(timer).toHaveText("0,00 с");
  await expect(countOutput).toHaveText("0 / 30");
  await cycles.focus();
  await cycles.press("Home");
  const speed = instrument.getByLabel("Лінійна швидкість", { exact: true });
  await speed.focus();
  await speed.press("End");
  await radius.focus();
  await radius.press("End");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const ball = instrument.locator('[data-instrument="rotating-ball"]');
  const beforeX = Number(await ball.getAttribute("cx"));
  await instrument
    .getByRole("button", { name: "Запустити дослід", exact: true })
    .click();
  await expect(radius).toBeDisabled();
  await expect
    .poll(async () => Number(await ball.getAttribute("cx")))
    .not.toBe(beforeX);
  await instrument.getByRole("button", { name: "Пауза", exact: true }).click();
  await expect(
    instrument.getByRole("button", { name: "Продовжити", exact: true }),
  ).toBeVisible();
  const pausedTime = await timer.innerText(),
    pausedX = await ball.getAttribute("cx");
  await page.waitForTimeout(120);
  await expect(timer).toHaveText(pausedTime);
  await expect(ball).toHaveAttribute("cx", pausedX!);
  await instrument
    .getByRole("button", { name: "Вигляд зверху", exact: true })
    .click();
  await expect(timer).toHaveText(pausedTime);
  await expect(ball).toHaveAttribute("cx", pausedX!);
  const gap = await instrument
    .locator('[data-instrument="rotation-string"]')
    .evaluate((el) => {
      const line = el as SVGLineElement;
      const ball = line.ownerSVGElement!.querySelector(
        '[data-instrument="rotating-ball"]',
      ) as SVGCircleElement;
      return Math.hypot(
        line.x2.baseVal.value - ball.cx.baseVal.value,
        line.y2.baseVal.value - ball.cy.baseVal.value,
      );
    });
  expect(gap).toBeCloseTo(12, 4);
  await instrument
    .getByRole("button", { name: "Продовжити", exact: true })
    .click();
  await expect.poll(async () => timer.innerText()).not.toBe(pausedTime);
  await instrument
    .getByRole("button", { name: "Скинути прилад", exact: true })
    .click();
  await expect(timer).toHaveText("0,00 с");
  await expect(countOutput).toHaveText("0 / 10");
  await instrument.screenshot({
    path: test.info().outputPath("rotation-mobile.png"),
    caret: "initial",
  });
  expect(clientErrors).toEqual([]);
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
