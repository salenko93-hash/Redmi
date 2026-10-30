import { test, expect, type Locator } from "@playwright/test";
import { labs } from "../../lib/labs";
import { initialParameters, simulate } from "../../lib/simulation";
const origin = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const seconds = async (clock: Locator) =>
  Number((await clock.getByRole("timer").innerText()).replace(",", "."));
test.use({ hasTouch: true });

test("rotation and all pendulum series use manual real-time clocks and preserve typed times in the expanded table", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1920, height: 900 });
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers: { Origin: origin },
        data: { email: "teacher@demo.test", password: "LabDemo2026!" },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/library");
  const links = await page
    .locator(".lab-card")
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLAnchorElement).href));
  for (const number of [2, 3]) {
    await page.goto(links[number - 1]);
    await page
      .getByRole("button", { name: "Спробувати як учень", exact: true })
      .click();
    await page
      .getByRole("button", { name: "2 Експеримент", exact: true })
      .click();
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: "reduce" });
    const instruments = page.locator(".virtual-lab");
    for (const [seriesIndex, lab] of (await instruments.all()).entries()) {
      await lab
        .getByRole("button", { name: "Розгорнути", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      const clock = dialog.getByRole("region", {
        name: "Ручний секундомір",
        exact: true,
      });
      const modelTime = dialog.locator(
        number === 2
          ? '[data-instrument="rotation-time"]'
          : '[data-instrument="pendulum-time"]',
      );
      await clock
        .getByRole("button", { name: "Запустити секундомір", exact: true })
        .click();
      await page.clock.runFor(1000);
      await clock
        .getByRole("button", { name: "Зупинити секундомір", exact: true })
        .click();
      const modelSeconds = Number(
        (await modelTime.textContent())!.replace(",", ".").replace(" с", ""),
      );
      expect(modelSeconds).toBeGreaterThanOrEqual(0.98);
      expect(modelSeconds).toBeLessThan(1.3);
      // Display rounds the model to hundredths and floors the manual clock.
      expect(Math.abs((await seconds(clock)) - modelSeconds)).toBeLessThan(
        0.011,
      );
      const pausedTime = await seconds(clock),
        pausedModel = (await modelTime.textContent())!;
      await page.clock.runFor(500);
      expect(await seconds(clock)).toBe(pausedTime);
      await expect(modelTime).toHaveText(pausedModel);
      await clock
        .getByRole("button", { name: "Продовжити секундомір", exact: true })
        .click();
      const experimentId = labs[number - 1].content.experiments[seriesIndex].id;
      const duration = simulate(
        number,
        experimentId,
        initialParameters(number, experimentId),
      ).duration;
      await page.clock.fastForward(
        Math.ceil(duration * 1000 - pausedTime * 1000) + 150,
      );
      await expect(clock.getByRole("status")).toHaveText(
        "Задану кількість циклів виконано — натисніть «Стоп»",
      );
      const transfer = dialog.getByRole("button", {
        name: "Перенести покази в таблицю",
        exact: true,
      });
      await expect(transfer).toBeDisabled();
      await expect(
        dialog.locator(".experiment-settings-panel input").first(),
      ).toBeDisabled();
      const atFinish = await seconds(clock);
      await page.clock.runFor(300);
      expect(await seconds(clock)).toBeGreaterThan(atFinish);
      await clock
        .getByRole("button", { name: "Зупинити секундомір", exact: true })
        .click();
      const table = dialog.getByRole("region", {
        name: "Таблиця дослідів",
        exact: true,
      });
      const row = table.locator(".experiment-row").first();
      const time = row.getByRole("textbox", { name: /: Час$/ });
      const period = row.getByRole("textbox", { name: /: Період$/ });
      await expect(time).toHaveValue("");
      await transfer.click();
      await dialog
        .getByRole("button", { name: "Підтвердити перенесення", exact: true })
        .click();
      await expect(time).toHaveValue("");
      await time.fill("12,34");
      await period.fill("999");
      await dialog
        .getByRole("combobox", { name: /Рядок для/ })
        .selectOption("0");
      await transfer.click();
      await dialog
        .getByRole("button", { name: "Підтвердити перенесення", exact: true })
        .click();
      await expect(time).toHaveValue("12,34");
      await expect(period).toHaveValue("");
      if (number === 2) {
        await dialog.evaluate((el) => {
          el.scrollTop = 0;
        });
        expect(
          await table
            .locator(".experiment-row")
            .last()
            .evaluate(
              (el) =>
                el.getBoundingClientRect().bottom <=
                el.closest("dialog")!.getBoundingClientRect().bottom - 8,
            ),
        ).toBe(true);
      }
      await dialog.screenshot({
        path: test
          .info()
          .outputPath(`lab-${number}-${seriesIndex + 1}-manual-workspace.png`),
      });
      const title = await dialog
        .locator(".experiment-dialog-title")
        .innerText();
      await page.keyboard.press("Escape");
      await expect(
        page
          .getByRole("textbox", { name: new RegExp(`^${title},.*: Час$`) })
          .first(),
      ).toHaveValue("12,34");
    }
  }
  expect(errors).toEqual([]);
});

test("stopwatch alone controls the ramp; the bottom table is editable in expanded view and keeps pupil timings", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1920, height: 900 });
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers: { Origin: origin },
        data: { email: "teacher@demo.test", password: "LabDemo2026!" },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/library");
  const href = await page.locator(".lab-card").first().getAttribute("href");
  await page.goto(href!);
  await page
    .getByRole("button", { name: "Спробувати як учень", exact: true })
    .click();
  await page
    .getByRole("button", { name: "2 Експеримент", exact: true })
    .click();
  const lab = page.locator(".virtual-lab").first();
  await expect(
    lab.getByRole("region", { name: "Властивості кульки", exact: true }),
  ).toHaveCount(0);
  const formula = page.getByRole("region", {
    name: "Формула середньої швидкості",
    exact: true,
  });
  await expect(formula).toContainText("шлях, м");
  await expect(formula).toContainText("час, с");
  await expect(page.locator(".work-aside")).not.toContainText("ВАШ МАРШРУТ");
  expect(
    await formula
      .locator(".lab-speed-formula")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(25);
  const normalTable = lab.getByRole("region", {
    name: "Таблиця дослідів",
    exact: true,
  });
  await expect(normalTable).toBeVisible();
  expect(
    await normalTable.evaluate((el) => {
      const parent = el.parentElement!;
      return (
        parent.classList.contains("experiment-data-panel") &&
        el.previousElementSibling?.classList.contains("virtual-transfer") &&
        el.previousElementSibling?.previousElementSibling?.classList.contains(
          "experiment-settings-panel",
        )
      );
    }),
  ).toBe(true);
  const settings = lab.getByRole("region", {
    name: "Параметри досліду",
    exact: true,
  });
  expect(
    await settings.evaluate(
      (el) =>
        el.getBoundingClientRect().top >=
        el
          .closest(".virtual-instrument")!
          .querySelector(".virtual-layout")!
          .getBoundingClientRect().bottom,
    ),
  ).toBe(true);
  await expect(
    lab.locator(".ramp-control-panel input, .ramp-control-panel select"),
  ).toHaveCount(0);
  let clock = lab.getByRole("region", {
    name: "Ручний секундомір",
    exact: true,
  });
  await expect(
    lab.getByRole("button", { name: "Запустити дослід", exact: true }),
  ).toHaveCount(0);
  await expect(
    lab.getByRole("button", { name: "Скинути прилад", exact: true }),
  ).toHaveCount(0);
  await expect(clock.getByRole("timer")).toHaveText("0,00");
  const ball = () => page.locator('[data-instrument="ball"]').first();
  const position = async () => Number(await ball().getAttribute("cx"));
  await lab.getByLabel("Нахил жолоба", { exact: true }).fill("5");
  await lab.getByLabel("Довжина шляху", { exact: true }).fill("2");
  await clock
    .getByRole("button", { name: "Запустити секундомір", exact: true })
    .click();
  await expect.poll(position).toBeGreaterThan(0);
  await clock
    .getByRole("button", { name: "Зупинити секундомір", exact: true })
    .click();
  const paused = await position(),
    pausedTime = await seconds(clock);
  await page.waitForTimeout(150);
  expect(await position()).toBe(paused);
  expect(await seconds(clock)).toBe(pausedTime);
  await lab.getByRole("button", { name: "Розгорнути", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /Керування дослідом:/ });
  const expandedSettings = dialog.getByRole("region", {
    name: "Параметри досліду",
    exact: true,
  });
  expect(
    await expandedSettings.locator(".virtual-control").evaluateAll((nodes) => {
      const rects = nodes.map((el) => el.getBoundingClientRect());
      return (
        rects.length === 5 && rects.every((r) => Math.abs(r.y - rects[0].y) < 1)
      );
    }),
  ).toBe(true);
  clock = dialog.getByRole("region", {
    name: "Ручний секундомір",
    exact: true,
  });
  expect(await seconds(clock)).toBe(pausedTime);
  await clock
    .getByRole("button", { name: "Продовжити секундомір", exact: true })
    .click();
  await expect.poll(position).toBeGreaterThan(paused);
  await clock
    .getByRole("button", { name: "Скинути секундомір", exact: true })
    .click();
  await expect(clock.getByRole("timer")).toHaveText("0,00");
  expect(await position()).toBe(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await clock
    .getByRole("button", { name: "Запустити секундомір", exact: true })
    .click();
  await expect.poll(position).toBeGreaterThan(0);
  await expect(
    dialog.getByLabel("Діаметр кульки", { exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", {
      name: "Перенести покази в таблицю",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(clock.getByRole("status")).toHaveText(
    "Кулька на фініші — натисніть «Стоп»",
    { timeout: 7000 },
  );
  const finishedPosition = await position(),
    afterFinish = await seconds(clock);
  await expect.poll(() => seconds(clock)).toBeGreaterThan(afterFinish + 0.1);
  expect(await position()).toBe(finishedPosition);
  await clock
    .getByRole("button", { name: "Зупинити секундомір", exact: true })
    .click();
  const finalTime = await seconds(clock);
  await expect(
    dialog.getByRole("button", {
      name: "Перенести покази в таблицю",
      exact: true,
    }),
  ).toBeEnabled();
  const table = dialog.getByRole("region", {
    name: "Таблиця дослідів",
    exact: true,
  });
  expect(
    await table.evaluate((el) => {
      const instrument = el.closest(".virtual-instrument")!;
      const layout = instrument
        .querySelector(".virtual-layout")!
        .getBoundingClientRect();
      return el.getBoundingClientRect().top >= layout.bottom;
    }),
  ).toBe(true);
  const row = table.locator(".experiment-row").first();
  await expect(row.locator("input").nth(1)).toHaveValue("");
  await row.locator("input").nth(1).fill("2,57");
  await row.locator("input").nth(2).fill("999");
  await dialog
    .getByRole("button", { name: "Перенести покази в таблицю", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Підтвердити перенесення", exact: true })
    .click();
  await expect(row.locator("input").nth(0)).toHaveValue("2");
  await expect(row.locator("input").nth(1)).toHaveValue("2,57");
  await expect(row.locator("input").nth(2)).toHaveValue("");
  for (const index of [1, 2]) {
    await dialog
      .getByLabel("Рядок для Скочування кульки", { exact: true })
      .selectOption(String(index));
    await dialog
      .getByRole("button", { name: "Перенести покази в таблицю", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Підтвердити перенесення", exact: true })
      .click();
  }
  await dialog.evaluate((el) => {
    el.scrollTop = 0;
  });
  await expect
    .poll(() =>
      dialog.evaluate((el) => {
        const rows = el.querySelectorAll(".experiment-row");
        const stage = el
          .querySelector(".virtual-stage")!
          .getBoundingClientRect();
        const bench = el
          .querySelector('[data-instrument="bench"]')!
          .getBoundingClientRect();
        const ruler = el
          .querySelector('[data-instrument="ruler"]')!
          .getBoundingClientRect();
        return (
          rows.length === 3 &&
          rows[2].getBoundingClientRect().bottom <=
            el.getBoundingClientRect().bottom - 8 &&
          bench.width >= stage.width * 0.9 &&
          ruler.bottom < bench.top
        );
      }),
    )
    .toBe(true);
  await dialog.screenshot({
    path: testInfo.outputPath("stopwatch-controls-bottom-table-desktop.png"),
  });
  await clock
    .getByRole("button", { name: "Новий дослід секундоміром", exact: true })
    .click();
  await expect.poll(() => seconds(clock)).toBeLessThan(finalTime);
  await clock
    .getByRole("button", { name: "Зупинити секундомір", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Таблиця дослідів", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.locator(".experiment-row").first().locator("input").nth(1),
  ).toHaveValue("2,57");
  await lab.locator(":scope > summary").click();
  await expect(
    page.getByRole("region", { name: "Таблиця дослідів", exact: true }),
  ).toBeVisible();
  await lab.locator(":scope > summary").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await lab.getByRole("button", { name: "Розгорнути", exact: true }).tap();
  expect(
    await expandedSettings.evaluate(
      (el) =>
        el.scrollHeight <= el.clientHeight + 1 &&
        el.scrollWidth <= el.clientWidth + 1,
    ),
  ).toBe(true);
  clock = dialog.getByRole("region", {
    name: "Ручний секундомір",
    exact: true,
  });
  await clock
    .getByRole("button", { name: "Скинути секундомір", exact: true })
    .tap();
  await clock
    .getByRole("button", { name: "Запустити секундомір", exact: true })
    .tap();
  await expect.poll(position).toBeGreaterThan(0);
  await clock
    .getByRole("button", { name: "Зупинити секундомір", exact: true })
    .tap();
  await table
    .locator(".experiment-row")
    .nth(1)
    .locator("input")
    .nth(1)
    .fill("3,14");
  await table.screenshot({
    path: testInfo.outputPath("bottom-table-mobile.png"),
  });
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.keyboard.press("Escape");
  await expect(
    page.locator(".experiment-row").nth(1).locator("input").nth(1),
  ).toHaveValue("3,14");
  expect(errors).toEqual([]);
});
