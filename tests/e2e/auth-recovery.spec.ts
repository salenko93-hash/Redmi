import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
test("recovery opens by navigation without JavaScript, explains a wrong address and resets a password through the browser", async ({
  page,
  browser,
  playwright,
}) => {
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  try {
    const plain = await noJs.newPage();
    await plain.goto(base);
    await plain
      .getByRole("link", { name: "Забули пароль?", exact: true })
      .click();
    await expect(plain).toHaveURL(base + "/?mode=recover");
    await expect(
      plain.getByLabel("Код відновлення", { exact: true }),
    ).toBeVisible();
    await expect(
      plain.getByLabel("Новий пароль", { exact: true }),
    ).toBeVisible();
  } finally {
    await noJs.close();
  }
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const wrong = new URL(base);
  wrong.hostname = "127.0.0.1";
  await page.goto(wrong.origin + "/?mode=recover");
  await expect(page.locator(".auth-address-notice")).toContainText(base);
  await expect(
    page.getByRole("button", { name: "Відновити доступ", exact: true }),
  ).toBeDisabled();
  await page.getByRole("link", { name: base, exact: true }).click();
  await expect(page).toHaveURL(base + "/?mode=recover");
  await expect(page.locator(".auth-address-notice")).toHaveCount(0);
  const api = await playwright.request.newContext({ baseURL: base }),
    email = `recovery-ui-${Date.now()}@test.invalid`;
  try {
    const register = await api.post("/api/auth/register", {
      headers: { Origin: base },
      data: {
        email,
        name: "Перевірка відновлення",
        password: "OriginalPassword2026!",
      },
    });
    expect(register.status()).toBe(201);
    const registered = await register.json();
    await page.getByLabel("Електронна пошта", { exact: true }).fill(email);
    await page
      .getByLabel("Код відновлення", { exact: true })
      .fill(" " + registered.recoveryCode + " ");
    await page
      .getByLabel("Новий пароль", { exact: true })
      .fill("NewBrowserPassword2026!");
    await page
      .getByRole("button", { name: "Відновити доступ", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Збережіть код відновлення",
        exact: true,
      }),
    ).toBeVisible();
    const next = await page.locator(".recovery-code").innerText();
    expect(next).toHaveLength(64);
    expect(next).not.toBe(registered.recoveryCode);
    expect((await api.get("/api/me")).status()).toBe(401);
    await page
      .getByRole("button", { name: "Код збережено — увійти", exact: true })
      .click();
    await expect(page).toHaveURL(base + "/");
    await page.getByLabel("Електронна пошта", { exact: true }).fill(email);
    await page
      .getByLabel("Пароль", { exact: true })
      .fill("NewBrowserPassword2026!");
    await page.getByRole("button", { name: "Увійти", exact: true }).click();
    await expect(page).toHaveURL(base + "/dashboard");
    expect((await page.request.get(base + "/api/me")).status()).toBe(200);
    expect(errors).toEqual([]);
  } finally {
    await api.dispose();
  }
});
