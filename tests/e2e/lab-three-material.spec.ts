import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test.use({ hasTouch: true });
test("lab three replaces PDF with three controlled pendulum series and consistent geometry", async ({
  page,
}) => {
  await page.goto("/materials/3");
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
  const href = await page.locator(".lab-card").nth(2).getAttribute("href");
  await page.goto(href!);
  await expect(
    page.getByRole("link", { name: "Вебпам’ятка до роботи", exact: true }),
  ).toHaveAttribute("href", "/materials/3");
  await expect(page.locator('a[href="/originals/lab-3.pdf"]')).toHaveCount(0);
  await page.goto("/materials/3");
  const errors: string[] = [],
    writes: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (r) => {
    if (r.method() !== "GET" && r.url().includes("/api/assignments"))
      writes.push(r.url());
  });
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await expect(
    page.getByRole("heading", {
      name: "Коливання нитяного маятника",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(
      '#lab-three-guide a[href$=".pdf"], #lab-three-guide iframe, #lab-three-guide embed',
    ),
  ).toHaveCount(0);
  await expect(page.locator("#guide-questions")).toContainText(
    "прямолінійні гармонічні коливання",
  );
  const tabs = page.getByRole("tablist", {
    name: "Тренувальні серії маятника",
  });
  await expect(tabs.getByRole("tab")).toHaveCount(3);
  const instrument = page.locator(".virtual-lab");
  await expect(instrument).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const stringLength = () =>
    instrument
      .locator('[data-instrument="pendulum-length"]')
      .evaluate((el) => (el as SVGLineElement).getTotalLength());
  const amplitudeWidth = () =>
    instrument
      .locator('[data-instrument="pendulum-amplitude"]')
      .evaluate((el) => (el as SVGLineElement).getTotalLength());
  async function run() {
    await instrument
      .getByRole("button", { name: "Запустити дослід", exact: true })
      .click();
    await expect(instrument.locator(".virtual-results")).toBeVisible();
    await expect(
      instrument.locator('[data-instrument="pendulum-count"]'),
    ).toHaveText("10 / 10");
    await expect(
      instrument.getByRole("button", {
        name: "Перенести покази в таблицю",
        exact: true,
      }),
    ).toBeDisabled();
    const values = await instrument
      .locator(".virtual-results dd")
      .allTextContents();
    return Number(values.at(-1)!.replace(",", "."));
  }
  await expect(
    instrument.locator('[data-instrument="pendulum-installation"]'),
  ).toHaveAttribute("data-series", "amplitude");
  const amplitude = instrument.getByLabel("Амплітуда", { exact: true });
  await expect(amplitude).toHaveValue("0.025");
  const width = await amplitudeWidth(),
    oneMetre = await stringLength();
  const baselineTime = await run();
  await amplitude.focus();
  await amplitude.press("End");
  await amplitude.press("ArrowLeft");
  await expect(amplitude).toHaveValue("0.055");
  expect((await amplitudeWidth()) / width).toBeCloseTo(0.055 / 0.025, 4);
  expect(await stringLength()).toBeCloseTo(oneMetre, 4);
  expect(await run()).toBeCloseTo(baselineTime, 4);
  await instrument.screenshot({
    path: test.info().outputPath("pendulum-amplitude.png"),
    caret: "initial",
  });
  await tabs.getByRole("tab", { name: /Амплітуда/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: /Довжина/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    instrument.locator('[data-instrument="pendulum-installation"]'),
  ).toHaveAttribute("data-series", "length");
  const length = instrument.getByLabel("Довжина маятника", { exact: true });
  await length.focus();
  await length.press("Home");
  const quarter = await stringLength();
  expect(oneMetre / quarter).toBeCloseTo(4, 4);
  expect(await run()).toBeCloseTo(baselineTime / 2, 4);
  await length.focus();
  await length.press("End");
  expect(await stringLength()).toBeCloseTo(oneMetre, 4);
  expect(await run()).toBeCloseTo(baselineTime, 4);
  await tabs.getByRole("tab", { name: /Довжина/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: /Маса/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    instrument.locator('[data-instrument="pendulum-installation"]'),
  ).toHaveAttribute("data-series", "mass");
  const mass = instrument.getByLabel("Маса кульки", { exact: true });
  const bob = instrument.locator('[data-instrument="pendulum-bob"]');
  const bobRadius = await bob.getAttribute("r");
  await mass.focus();
  await mass.press("Home");
  expect(await run()).toBeCloseTo(baselineTime, 4);
  await mass.focus();
  await mass.press("End");
  expect(await run()).toBeCloseTo(baselineTime, 4);
  await expect(bob).toHaveAttribute("r", bobRadius!);
  expect(await stringLength()).toBeCloseTo(oneMetre, 4);
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await expect(tabs).toBeVisible();
  for (const [name, label, series] of [
    [/Амплітуда/, "Амплітуда", "amplitude"],
    [/Довжина/, "Довжина маятника", "length"],
    [/Маса/, "Маса кульки", "mass"],
  ] as const) {
    await tabs.getByRole("tab", { name }).tap();
    const slider = instrument.getByLabel(label, { exact: true }),
      before = await slider.inputValue();
    await slider.scrollIntoViewIfNeeded();
    const box = (await slider.boundingBox())!;
    await slider.tap({ position: { x: box.width * 0.8, y: box.height / 2 } });
    expect(await slider.inputValue()).not.toBe(before);
    await expect(
      instrument.locator('[data-instrument="pendulum-installation"]'),
    ).toHaveAttribute("data-series", series);
    await expect(
      instrument.getByLabel("Час маятника", { exact: true }),
    ).toHaveText("0,00 с");
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const startX = await bob.getAttribute("cx"),
    clock = instrument.getByLabel("Час маятника", { exact: true });
  await instrument
    .getByRole("button", { name: "Запустити дослід", exact: true })
    .click();
  await expect(mass).toBeDisabled();
  await expect.poll(() => bob.getAttribute("cx")).not.toBe(startX);
  await instrument.getByRole("button", { name: "Пауза", exact: true }).click();
  const paused = await clock.innerText(),
    pausedX = await bob.getAttribute("cx");
  await page.waitForTimeout(120);
  await expect(clock).toHaveText(paused);
  await expect(bob).toHaveAttribute("cx", pausedX!);
  const gap = await instrument
    .locator('[data-instrument="pendulum-string"]')
    .evaluate((el) => {
      const line = el as SVGLineElement,
        bob = line.ownerSVGElement!.querySelector(
          '[data-instrument="pendulum-bob"]',
        ) as SVGCircleElement;
      return Math.hypot(
        line.x2.baseVal.value - bob.cx.baseVal.value,
        line.y2.baseVal.value - bob.cy.baseVal.value,
      );
    });
  expect(gap).toBeCloseTo(10, 3);
  const seconds = Number(paused.replace(",", ".").replace(" с", "")),
    period = 2 * Math.PI * Math.sqrt(1 / 10);
  expect(
    Math.abs(
      Number(pausedX) -
        (250 +
          230 * Math.sin(0.025 * Math.cos((2 * Math.PI * seconds) / period))),
    ),
  ).toBeLessThan(0.13);
  await instrument
    .getByRole("button", { name: "Продовжити", exact: true })
    .click();
  await expect.poll(() => clock.innerText()).not.toBe(paused);
  await instrument
    .getByRole("button", { name: "Скинути прилад", exact: true })
    .click();
  await expect(clock).toHaveText("0,00 с");
  await expect(
    instrument.getByLabel("Лічильник маятника", { exact: true }),
  ).toHaveText("0 / 10");
  expect(errors).toEqual([]);

  await page.emulateMedia({ media: "print" });
  await expect(tabs).not.toBeVisible();
  await expect(instrument).not.toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Один цикл — це рух туди й назад",
      exact: true,
    }),
  ).toBeVisible();
});
