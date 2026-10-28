import { provisionTestAdmin, releaseTestAdmin } from "../helpers/admin-account";
import { test, expect } from "@playwright/test";
import { Client } from "pg";
const origin = process.env.E2E_BASE_URL || "http://localhost:3100";
const headers = { Origin: origin };

test("invitation copy handles secure clipboard, absent API, denied permission and manual selection", async ({
  page,
  context,
}) => {
  const target = process.env.DATABASE_URL;
  if (!target || !new URL(target).pathname.endsWith("_test"))
    throw new Error("Disposable database required");
  const db = new Client({ connectionString: target });
  await db.connect();
  const demo = await provisionTestAdmin(db);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await db.query('UPDATE "User" SET "isAdmin"=true WHERE id=$1', [demo.id]);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    expect(
      (
        await page.request.post("/api/auth/login", {
          headers,
          data: { email: demo.email, password: "LabDemo2026!" },
        })
      ).status(),
    ).toBe(200);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin");
    const region = page.getByRole("region", {
      name: "Запрошення нового вчителя",
    });
    await region
      .getByLabel("Email учителя", { exact: true })
      .fill(`copy-${Date.now()}@test.invalid`);
    await region
      .getByRole("button", { name: "Створити запрошення", exact: true })
      .click();
    const field = region.getByLabel("Код запрошення вчителя", { exact: true });
    await expect(field).toBeVisible();
    const token = await field.inputValue();
    const button = region.getByRole("button", {
      name: "Скопіювати запрошення",
      exact: true,
    });
    await button.click();
    await expect(
      region.getByText("Код скопійовано.", { exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      token,
    );

    // Preserve the real clipboard reader, then reproduce HTTP's absent API.
    await page.evaluate(async () => {
      const clipboard = navigator.clipboard;
      (window as any).__copyTestClipboard = clipboard;
      await clipboard.writeText("");
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: undefined,
      });
    });
    await button.click();
    await expect(
      region.getByText("Код скопійовано.", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => (window as any).__copyTestClipboard.readText()),
    ).toBe(token);

    // A present API can reject due to browser permissions; the fallback still copies.
    await page.evaluate(async () => {
      await (window as any).__copyTestClipboard.writeText("");
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw new DOMException("Denied", "NotAllowedError");
          },
        },
      });
    });
    await button.click();
    await expect(
      region.getByText("Код скопійовано.", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => (window as any).__copyTestClipboard.readText()),
    ).toBe(token);

    // Never claim success when both clipboard methods fail.
    await page.evaluate(() => {
      document.execCommand = () => false;
    });
    await button.click();
    await expect(
      region.getByText(/Код виділено\. Натисніть Ctrl\+C/),
    ).toBeVisible();
    await expect(
      region.getByText("Код скопійовано.", { exact: true }),
    ).toHaveCount(0);
    await expect(field).toBeFocused();
    expect(
      await field.evaluate((element: HTMLTextAreaElement) => [
        element.selectionStart,
        element.selectionEnd,
      ]),
    ).toEqual([0, token.length]);
    expect(errors).toEqual([]);
  } finally {
    await releaseTestAdmin(db, demo.id);
    await db.end();
  }
});
