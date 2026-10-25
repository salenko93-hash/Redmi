import { test, expect, type Locator } from "@playwright/test";

for (const touch of [false, true]) {
  test.describe(touch ? "touch ramp controls" : "desktop ramp controls", () => {
    test.use({
      viewport: touch
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      hasTouch: touch,
    });

    test("sliders change actual slope, path and ball travel before and after a run", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const base = process.env.E2E_BASE_URL ?? "http://localhost:3100";
      expect(
        (
          await page.request.post("/api/auth/login", {
            headers: { Origin: base },
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

      const instrument = page.locator(".virtual-lab").first();
      const distance = instrument.getByLabel("Довжина шляху", { exact: true });
      const angle = instrument.getByLabel("Нахил жолоба", { exact: true });
      const ramp = instrument.locator('[data-instrument="ramp"]');
      const path = instrument.locator('[data-instrument="path"]');
      const ball = instrument.locator('[data-instrument="ball"]');
      const pathLength = () =>
        path.evaluate((el) => (el as SVGLineElement).getTotalLength());
      async function geometry() {
        return ramp.evaluate((el) => {
          const line = el as SVGLineElement;
          const matrix = line.getScreenCTM()!;
          const start = new DOMPoint(
            line.x1.baseVal.value,
            line.y1.baseVal.value,
          ).matrixTransform(matrix);
          const end = new DOMPoint(
            line.x2.baseVal.value,
            line.y2.baseVal.value,
          ).matrixTransform(matrix);
          return {
            angle:
              (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI,
            length: line.getTotalLength(),
          };
        });
      }
      async function checkAngle() {
        expect((await geometry()).angle).toBeCloseTo(
          Number(await angle.inputValue()),
          5,
        );
      }
      async function pointAt(slider: Locator, fraction: number) {
        await slider.scrollIntoViewIfNeeded();
        const box = (await slider.boundingBox())!;
        const position = { x: box.width * fraction, y: box.height / 2 };
        if (touch) await slider.tap({ position });
        else {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + position.x, box.y + position.y, {
            steps: 6,
          });
          await page.mouse.up();
        }
      }

      // Exercise native pointer/touch events, not just programmatic state changes.
      const left = (await angle.boundingBox())!,
        right = (await distance.boundingBox())!;
      expect(left.x).toBeLessThan(right.x);
      expect(left.y).toBeCloseTo(right.y, 0);
      await expect(distance).toHaveAttribute("max", "2");
      await expect(
        instrument.locator('[data-instrument="ruler"]'),
      ).toContainText("2 м");
      const initial = await geometry();
      await pointAt(angle, 0.85);
      expect((await geometry()).angle).not.toBeCloseTo(initial.angle);
      await checkAngle();
      const initialPath = await pathLength();
      await pointAt(distance, 0.25);
      expect(await pathLength()).toBeLessThan(initialPath);
      expect((await geometry()).length).toBeCloseTo(initial.length, 5);
      await checkAngle();

      await angle.focus();
      await angle.press("Home");
      await checkAngle();
      await distance.focus();
      await distance.press("Home");
      const short = await pathLength();
      await distance.press("End");
      expect((await pathLength()) / short).toBeCloseTo(2 / 0.2, 5);
      expect((await geometry()).length).toBeCloseTo(initial.length, 5);
      await angle.focus();
      await angle.press("End");
      await checkAngle();
      for (const label of ["start-label", "finish-label"]) {
        const rotation = await instrument
          .locator(`[data-instrument="${label}"]`)
          .evaluate((el) => {
            const m = (el as SVGGraphicsElement).getScreenCTM()!;
            return Math.atan2(m.b, m.a);
          });
        expect(rotation).toBeCloseTo(0, 6);
      }
      // Even at maximum slope and distance the ball stays within the scene.
      const bounds = await ball.evaluate((el) => {
        const scene = (
          el as SVGElement
        ).ownerSVGElement!.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        return {
          inside:
            rect.left >= scene.left &&
            rect.top >= scene.top &&
            rect.right <= scene.right &&
            rect.bottom <= scene.bottom,
        };
      });
      expect(bounds.inside).toBeTruthy();
      await instrument.screenshot({
        path: test.info().outputPath("two-metre-ramp.png"),
      });
      await expect(ball).toHaveAttribute("cx", "0");
      await instrument
        .getByRole("button", { name: "Запустити дослід", exact: true })
        .click();
      await expect(instrument.locator(".virtual-results")).toBeVisible();
      const fast = Number(
        (
          await instrument.locator(".virtual-results dd").nth(1).innerText()
        ).replace(",", "."),
      );
      expect(Number(await ball.getAttribute("cx"))).toBeCloseTo(
        await pathLength(),
        5,
      );
      await angle.focus();
      await angle.press("Home");
      await expect(ball).toHaveAttribute("cx", "0");
      await expect(instrument.locator(".virtual-results")).toHaveCount(0);
      await checkAngle();
      await instrument
        .getByRole("button", { name: "Запустити дослід", exact: true })
        .click();
      await expect(instrument.locator(".virtual-results")).toBeVisible();
      const slow = Number(
        (
          await instrument.locator(".virtual-results dd").nth(1).innerText()
        ).replace(",", "."),
      );
      expect(slow).toBeGreaterThan(fast);
      await distance.focus();
      await distance.press("Home");
      await instrument
        .getByRole("button", { name: "Запустити дослід", exact: true })
        .click();
      await expect(instrument.locator(".virtual-results")).toBeVisible();
      const shortTime = Number(
        (
          await instrument.locator(".virtual-results dd").nth(1).innerText()
        ).replace(",", "."),
      );
      expect(shortTime).toBeLessThan(slow);
      expect(Number(await ball.getAttribute("cx"))).toBeCloseTo(short, 5);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    });
  });
}
