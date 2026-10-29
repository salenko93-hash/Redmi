import { test, expect, type Locator } from "@playwright/test";
const origin = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const seconds = async (clock: Locator) =>
  Number((await clock.getByRole("timer").innerText()).replace(",", "."));
test.use({ hasTouch: true });

test("manual timing stays independent of the ramp and survives expanded view, scrolling and mobile controls", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
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
    .getByRole("button", { name: "2 Експеримент", exact: true })
    .click();
  const lab = page.locator(".virtual-lab").first();
  let clock = lab.getByRole("region", {
    name: "Ручний секундомір",
    exact: true,
  });
  await expect(clock.getByRole("timer")).toHaveText("0,00");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await lab
    .getByRole("button", { name: "Запустити дослід", exact: true })
    .click();
  await expect(lab.locator(".virtual-results")).toBeVisible();
  await expect(clock.getByRole("timer")).toHaveText("0,00");
  await lab
    .getByRole("button", { name: "Скинути прилад", exact: true })
    .click();
  await clock
    .getByRole("button", { name: "Запустити секундомір", exact: true })
    .click();
  await expect.poll(() => seconds(clock)).toBeGreaterThan(0.1);
  await lab.getByRole("button", { name: "Розгорнути", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /Керування дослідом:/ });
  clock = dialog.getByRole("region", {
    name: "Ручний секундомір",
    exact: true,
  });
  await expect(
    clock.getByRole("button", { name: "Зупинити секундомір", exact: true }),
  ).toBeVisible();
  const before = await seconds(clock);
  await expect.poll(() => seconds(clock)).toBeGreaterThan(before + 0.1);
  await clock
    .getByRole("button", { name: "Зупинити секундомір", exact: true })
    .click();
  const stopped = await seconds(clock);
  await page.waitForTimeout(180);
  expect(await seconds(clock)).toBe(stopped);
  await page.keyboard.press("Escape");
  clock = lab.getByRole("region", { name: "Ручний секундомір", exact: true });
  expect(await seconds(clock)).toBe(stopped);
  await clock
    .getByRole("button", { name: "Продовжити секундомір", exact: true })
    .click();
  await lab
    .getByRole("button", { name: "Скинути прилад", exact: true })
    .click();
  await expect.poll(() => seconds(clock)).toBeGreaterThan(stopped + 0.1);
  await lab.getByLabel("Нахил жолоба", { exact: true }).fill("20");
  await expect(
    clock.getByRole("button", { name: "Зупинити секундомір", exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await lab
    .getByRole("button", { name: "Запустити дослід", exact: true })
    .click();
  await expect(lab.locator(".virtual-results")).toBeVisible();
  await expect(
    clock.getByRole("button", { name: "Зупинити секундомір", exact: true }),
  ).toBeVisible();
  const completed = await seconds(clock);
  await expect.poll(() => seconds(clock)).toBeGreaterThan(completed + 0.1);
  await clock
    .getByRole("button", { name: "Зупинити секундомір", exact: true })
    .click();
  await lab.getByRole("button", { name: "Розгорнути", exact: true }).click();
  clock = dialog.getByRole("region", {
    name: "Ручний секундомір",
    exact: true,
  });
  await dialog.locator(".virtual-settings").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const visibleClock = await clock.getByRole("timer").evaluate((el) => {
    const r = el.getBoundingClientRect(),
      top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return top === el || el.contains(top);
  });
  expect(visibleClock).toBe(true);
  await dialog.screenshot({
    path: testInfo.outputPath("manual-stopwatch-expanded.png"),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    clock.getByRole("button", { name: "Продовжити секундомір", exact: true }),
  ).toBeVisible();
  await clock
    .getByRole("button", { name: "Скинути секундомір", exact: true })
    .tap();
  await expect(clock.getByRole("timer")).toHaveText("0,00");
  await clock
    .getByRole("button", { name: "Запустити секундомір", exact: true })
    .tap();
  await expect.poll(() => seconds(clock)).toBeGreaterThan(0.1);
  await clock
    .getByRole("button", { name: "Зупинити секундомір", exact: true })
    .tap();
  await clock.screenshot({
    path: testInfo.outputPath("manual-stopwatch-mobile.png"),
  });
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
