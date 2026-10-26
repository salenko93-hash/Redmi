import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test("lab seven replaces PDF, controls load and face, keeps the rope attached and balances forces", async ({
  page,
}) => {
  await page.goto("/materials/7");
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
  const href = await page.locator(".lab-card").nth(6).getAttribute("href");
  await page.goto(href!);
  await expect(
    page.getByRole("link", { name: "Вебпам’ятка до роботи", exact: true }),
  ).toHaveAttribute("href", "/materials/7");
  await expect(page.locator('a[href="/originals/lab-7.pdf"]')).toHaveCount(0);
  await page.goto("/materials/7");
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
      name: "Тертя: виміряй опір ковзанню",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(
      '#lab-seven-guide a[href$=".pdf"], #lab-seven-guide iframe, #lab-seven-guide embed',
    ),
  ).toHaveCount(0);
  await expect(page.locator("#guide-questions")).toContainText(
    "брусок уже ковзає вправо",
  );
  const instrument = page.locator(".virtual-lab");
  const parse = (s: string) => Number(s.replace(",", "."));
  await page.emulateMedia({ reducedMotion: "reduce" });
  async function run() {
    await instrument
      .getByRole("button", { name: "Запустити дослід", exact: true })
      .click();
    await expect(instrument.locator(".virtual-results")).toBeVisible();
    await expect(instrument.locator(".virtual-results dd")).toHaveCount(2);
    await expect(
      instrument.getByRole("button", {
        name: "Перенести покази в таблицю",
        exact: true,
      }),
    ).toBeDisabled();
    const readings = await instrument
      .locator(".virtual-results dd")
      .allTextContents();
    await expect(
      instrument.locator('[data-instrument="friction-force-reading"]'),
    ).toHaveText(readings[1].replace(".", ",") + " Н");
    await expect(
      instrument.locator('[data-instrument="friction-normal-reading"]'),
    ).toHaveText(readings[0].replace(".", ",") + " Н");
    const rope = await instrument
      .locator('[data-instrument="friction-rope"]')
      .evaluate((el) => ({
        x1: Number(el.getAttribute("x1")),
        x2: Number(el.getAttribute("x2")),
        y1: Number(el.getAttribute("y1")),
        y2: Number(el.getAttribute("y2")),
      }));
    const block = await instrument
      .locator('[data-instrument="friction-block"]')
      .evaluate((el) => {
        const b = el.getBoundingClientRect();
        return { right: b.right, width: b.width, height: b.height };
      });
    expect(rope.y1).toBe(rope.y2);
    expect(rope.x2 - rope.x1).toBe(28);
    const aligned = await instrument
      .locator('[data-instrument="friction-rope"]')
      .evaluate(
        (el) =>
          Math.abs(
            el.getBoundingClientRect().left -
              el
                .closest("svg")!
                .querySelector('[data-instrument="friction-block"]')!
                .getBoundingClientRect().right,
          ) < 1,
      );
    expect(aligned).toBeTruthy();
    const forces = await instrument
      .locator("[data-force]")
      .evaluateAll((els) =>
        Object.fromEntries(
          els.map((el) => [
            el.getAttribute("data-force"),
            {
              x1: Number(el.getAttribute("x1")),
              x2: Number(el.getAttribute("x2")),
              y1: Number(el.getAttribute("y1")),
              y2: Number(el.getAttribute("y2")),
            },
          ]),
        ),
      );
    expect(forces.normal.y2).toBeLessThan(forces.normal.y1);
    expect(forces.weight.y2).toBeGreaterThan(forces.weight.y1);
    expect(forces.pull.x2).toBeGreaterThan(forces.pull.x1);
    expect(forces.friction.x2).toBeLessThan(forces.friction.x1);
    expect(forces.normal.y1 - forces.normal.y2).toBe(
      forces.weight.y2 - forces.weight.y1,
    );
    expect(forces.pull.x2 - forces.pull.x1).toBe(
      forces.friction.x1 - forces.friction.x2,
    );
    return { n: parse(readings[0]), f: parse(readings[1]), block, rope };
  }
  const first = await run();
  const loads = instrument.getByLabel("Кількість тягарців", { exact: true });
  await loads.press("End");
  await expect(instrument.locator(".virtual-results")).toHaveCount(0);
  const heavy = await run();
  expect(heavy.n).toBe(5);
  expect(first.n).toBe(3);
  expect(heavy.f / heavy.n).toBeCloseTo(first.f / first.n, 6);
  await expect(
    instrument.locator('[data-instrument="friction-load"]'),
  ).toHaveCount(3);
  await instrument
    .getByLabel("Положення бруска", { exact: true })
    .selectOption("1");
  const narrow = await run();
  expect(narrow.f).toBe(heavy.f);
  expect(narrow.n).toBe(heavy.n);
  expect(narrow.block.width).toBeLessThan(heavy.block.width);
  expect(narrow.block.height).toBeGreaterThan(heavy.block.height);
  expect(narrow.rope.y1).toBeLessThan(heavy.rope.y1);
  await instrument.getByLabel("Поверхні", { exact: true }).selectOption("1");
  const rough = await run();
  expect(rough.n).toBe(narrow.n);
  expect(rough.f).toBeGreaterThan(narrow.f);
  await instrument.getByLabel("Поверхні", { exact: true }).selectOption("2");
  const smooth = await run();
  expect(smooth.n).toBe(narrow.n);
  expect(smooth.f).toBeLessThan(narrow.f);
  expect(errors).toEqual([]);
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
  await expect(page.locator("#guide-method table")).toBeVisible();
});
