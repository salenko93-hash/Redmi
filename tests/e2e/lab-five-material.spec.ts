import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test.use({ hasTouch: true });
test("lab five replaces PDF and preserves dimensions, displaced volume, tare and independent calculations", async ({
  page,
}) => {
  await page.goto("/materials/5");
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
  const href = await page.locator(".lab-card").nth(4).getAttribute("href");
  await page.goto(href!);
  await expect(
    page.getByRole("link", { name: "Вебпам’ятка до роботи", exact: true }),
  ).toHaveAttribute("href", "/materials/5");
  await expect(page.locator('a[href="/originals/lab-5.pdf"]')).toHaveCount(0);
  await page.getByRole("button", { name: "3 Запитання", exact: true }).click();
  await expect(page.locator(".oil-label-figure")).toBeVisible();
  await expect(page.locator(".oil-label-figure img")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Збільшити етикетку", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Збільшена етикетка олії" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "2 Експеримент", exact: true })
    .click();
  const reference = page.locator(".density-reference");
  await expect(
    reference.getByRole("heading", { name: "Таблиця густин речовин" }),
  ).toBeVisible();
  await reference.getByRole("button", { name: "Гази 8", exact: true }).click();
  await reference.getByLabel("Знайти речовину").fill("водень");
  await expect(reference.locator("tbody tr:visible")).toHaveCount(1);
  await expect(reference.locator("tbody tr:visible")).toContainText("0,00009");
  await expect(page.locator(".tools summary")).toHaveCount(0);
  await expect(page.locator(".tools .stopwatch")).toHaveCount(0);
  const calculator = page.getByRole("region", {
    name: "Калькулятор",
    exact: true,
  });
  const calculation = calculator.getByLabel("Арифметичний вираз");
  const storageBefore = await page.evaluate(() => JSON.stringify(localStorage));
  await calculation.fill("(152 − 32) ÷ 40");
  await calculation.press("Enter");
  await expect(calculator.getByLabel("Результат калькулятора")).toHaveText("3");
  await calculator.getByRole("button", { name: "C", exact: true }).click();
  for (const key of ["7", "×", "8", "Обчислити"])
    await calculator.getByRole("button", { name: key, exact: true }).click();
  await expect(calculator.getByLabel("Результат калькулятора")).toHaveText(
    "56",
  );
  await calculation.fill("1/(2-2)");
  await calculation.press("Enter");
  await expect(calculator.getByRole("alert")).toHaveText(
    "На нуль ділити не можна.",
  );
  await calculation.fill("1,25 + 0.75");
  await calculator
    .getByRole("button", { name: "Обчислити", exact: true })
    .click();
  await expect(calculator.getByLabel("Результат калькулятора")).toHaveText("2");
  await expect(calculator.getByRole("alert")).toHaveCount(0);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(
    storageBefore,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await calculator.getByRole("button", { name: "C", exact: true }).tap();
  for (const key of ["2", ",", "5", "×", "4", "Обчислити"])
    await calculator.getByRole("button", { name: key, exact: true }).tap();
  await expect(calculator.getByLabel("Результат калькулятора")).toHaveText(
    "10",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/materials/5");
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
      name: "Густина твердих тіл і рідин",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(
      '#lab-five-guide a[href$=".pdf"], #lab-five-guide iframe, #lab-five-guide embed',
    ),
  ).toHaveCount(0);
  const label = page.locator(".oil-label-layout").first();
  await expect(label.locator("dd").nth(0)).toHaveText("782 г");
  await expect(label.locator("dd").nth(1)).toHaveText("0,85 л");
  const tabs = page.getByRole("tablist", { name: "Тренувальні серії густини" });
  await expect(tabs.getByRole("tab")).toHaveCount(3);
  const instrument = page.locator(".virtual-lab");
  await expect(instrument).toHaveCount(1);
  const toolbarPosition = await instrument.evaluate((el) => {
    const scene = el
      .querySelector("svg.simulation-scene")!
      .getBoundingClientRect();
    const toolbar = el
      .querySelector(".virtual-toolbar")!
      .getBoundingClientRect();
    const controls = el
      .querySelector(".virtual-controls")!
      .getBoundingClientRect();
    return {
      gap: toolbar.top - scene.bottom,
      above: toolbar.bottom <= controls.top,
    };
  });
  expect(toolbarPosition.gap).toBeGreaterThanOrEqual(0);
  expect(toolbarPosition.gap).toBeLessThanOrEqual(20);
  expect(toolbarPosition.above).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const dimensions = () =>
    instrument
      .locator('[data-instrument="density-block-front"]')
      .evaluate((el) => {
        const b = (el as SVGGraphicsElement).getBBox();
        return { width: b.width, height: b.height };
      });
  const initial = await dimensions();
  await instrument.getByLabel("Довжина", { exact: true }).press("End");
  expect((await dimensions()).width / initial.width).toBeCloseTo(2, 5);
  await instrument.getByLabel("Висота", { exact: true }).press("End");
  expect((await dimensions()).height / initial.height).toBeCloseTo(2.5, 5);
  const depth = () =>
    instrument
      .locator('[data-instrument="density-block-top"]')
      .evaluate((el) => (el as SVGGraphicsElement).getBBox().height);
  const startDepth = await depth();
  await instrument.getByLabel("Ширина", { exact: true }).press("End");
  expect((await depth()) / startDepth).toBeCloseTo(2.5, 5);
  async function run(count: number) {
    await instrument
      .getByRole("button", { name: "Запустити дослід", exact: true })
      .click();
    await expect(instrument.locator(".virtual-results")).toBeVisible();
    await expect(instrument.locator(".virtual-results dd")).toHaveCount(count);
    await expect(
      instrument.getByRole("button", {
        name: "Перенести покази в таблицю",
        exact: true,
      }),
    ).toBeDisabled();
    return instrument.locator(".virtual-results dd").allTextContents();
  }
  let readings = await run(4);
  await expect(
    instrument.locator('[data-instrument="density-mass"]'),
  ).toHaveText(readings[0].replace(".", ",") + " г");
  await tabs.getByRole("tab").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab").nth(1)).toBeFocused();
  await expect(instrument.locator(".virtual-results")).toHaveCount(0);
  await instrument
    .getByLabel("Початковий об’єм води", { exact: true })
    .press("Home");
  await instrument.getByLabel("Масштаб зразка", { exact: true }).press("End");
  readings = await run(3);
  const displacement = async () => {
    const values = await instrument
      .locator('[data-instrument="cylinder-water"]')
      .evaluateAll((els) =>
        els.map((el) => Number(el.getAttribute("data-volume"))),
      );
    return values[1] - values[0];
  };
  expect(await displacement()).toBeCloseTo(67.5, 5);
  const rock = instrument.locator('[data-instrument="density-rock"]');
  const rockBox = await rock.evaluate((el) => {
    const b = (el as SVGGraphicsElement).getBBox();
    return { y: b.y, bottom: b.y + b.height, width: b.width };
  });
  const surface = Number(
    await instrument.locator('[data-cylinder="after"] rect').getAttribute("y"),
  );
  expect(rockBox.y).toBeGreaterThan(surface);
  expect(rockBox.bottom).toBeLessThan(300);
  await expect(instrument).toContainText("Тонка спиця");
  await expect(
    instrument.locator('[data-instrument="density-mass"]'),
  ).toHaveText(readings[0].replace(".", ",") + " г");
  await instrument.getByLabel("Масштаб зразка", { exact: true }).press("Home");
  await run(3);
  expect(await displacement()).toBeCloseTo(2.5, 5);
  expect(
    rockBox.width /
      (await rock.evaluate((el) => (el as SVGGraphicsElement).getBBox().width)),
  ).toBeCloseTo(3, 5);
  await tabs.getByRole("tab").nth(1).focus();
  await page.keyboard.press("End");
  await expect(tabs.getByRole("tab").last()).toBeFocused();
  await instrument.getByLabel("Об’єм рідини", { exact: true }).press("Home");
  const parse = (s: string) => Number(s.replace(",", "."));
  const small = (await run(3)).map(parse);
  await instrument.getByLabel("Об’єм рідини", { exact: true }).press("End");
  readings = await run(3);
  const large = readings.map(parse);
  expect(large[0]).toBe(small[0]);
  expect((large[1] - large[0]) / (small[1] - small[0])).toBeCloseTo(3, 5);
  expect(large[2]).toBe(150);
  await expect(
    instrument.locator('[data-instrument="liquid-total-mass"]'),
  ).toHaveText(readings[1].replace(".", ",") + " г");
  await expect(
    instrument.locator('[data-instrument="cylinder-water"]'),
  ).toHaveAttribute("data-volume", "150");
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  const materialReference = page.locator(".density-reference");
  await materialReference
    .getByRole("button", { name: "Рідини 16", exact: true })
    .click();
  await materialReference.getByLabel("Знайти речовину").fill("олово");
  await expect(materialReference.locator("tbody tr:visible")).toHaveCount(1);
  await expect(materialReference.locator("tbody tr:visible")).toContainText(
    "409 °C",
  );
  await expect(materialReference.locator("tbody tr:visible")).toContainText(
    "6,83",
  );
  await materialReference
    .getByLabel("Знайти речовину")
    .fill("немаєтакоїречовини");
  await expect(materialReference.locator(".density-empty")).toBeVisible();
  await materialReference.getByLabel("Знайти речовину").fill("вода");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.emulateMedia({ media: "print" });
  await expect(materialReference.locator("tbody tr:visible")).toHaveCount(52);
  await expect(
    materialReference.locator(".density-reference-controls"),
  ).not.toBeVisible();
  await expect(instrument).not.toBeVisible();
  await expect(label).toBeVisible();
});
