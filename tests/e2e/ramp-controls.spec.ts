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
      const conditions = instrument.getByLabel("Умови руху", { exact: true });
      await expect(conditions).toHaveValue("1");
      await conditions.selectOption("0");
      const distance = instrument.getByLabel("Довжина шляху", { exact: true });
      const angle = instrument.getByLabel("Нахил жолоба", { exact: true });
      const ramp = instrument.locator('[data-instrument="ramp"]');
      const path = instrument.locator('[data-instrument="path"]');
      const ball = instrument.locator('[data-instrument="ball"]');
      const material = instrument.getByLabel("Матеріал кульки", {
        exact: true,
      });
      const diameter = instrument.getByLabel("Діаметр кульки", { exact: true });
      const mass = instrument.getByLabel("Маса кульки", { exact: true });
      const massInGrams = async () =>
        Number(await mass.getAttribute("data-mass-grams"));
      await expect(diameter).toHaveValue("20");
      const steelMass = await massInGrams();
      const radius20 = Number(await ball.getAttribute("r"));
      await diameter.focus();
      for (let i = 0; i < 20; i++) await diameter.press("ArrowRight");
      expect(await massInGrams()).toBeCloseTo(steelMass * 8, 8);
      expect(Number(await ball.getAttribute("r"))).toBeCloseTo(radius20 * 2, 8);
      await material.selectOption("1");
      expect(await massInGrams()).toBeCloseTo((steelMass * 8 * 900) / 7800, 8);
      await expect(ball).toHaveAttribute("data-material", "1");
      await diameter.press("End");
      await expect(diameter).toHaveValue("50");

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

      const beforeDiameter = await diameter.inputValue();
      await pointAt(diameter, 0.4);
      expect(await diameter.inputValue()).not.toBe(beforeDiameter);
      await diameter.focus();
      await diameter.press("End");
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
      await material.selectOption("0");
      await expect(instrument.locator(".virtual-results")).toHaveCount(0);
      await expect(ball).toHaveAttribute("cx", "0");
      await instrument
        .getByRole("button", { name: "Запустити дослід", exact: true })
        .click();
      await expect(instrument.locator(".virtual-results")).toBeVisible();
      expect(
        Number(
          (
            await instrument.locator(".virtual-results dd").nth(1).innerText()
          ).replace(",", "."),
        ),
      ).toBeCloseTo(shortTime, 5);
      expect(
        Number(
          await instrument
            .locator('[data-instrument="ball-mark"]')
            .getAttribute("data-rotations"),
        ),
      ).toBeCloseTo(Number(await distance.inputValue()) / (Math.PI * 0.05), 6);

      await page.emulateMedia({ reducedMotion: "no-preference" });
      await angle.focus();
      await angle.press("Home");
      await distance.focus();
      await distance.press("End");
      await diameter.focus();
      await diameter.press("Home");
      await instrument
        .getByRole("button", { name: "Запустити дослід", exact: true })
        .click();
      await expect(diameter).toBeDisabled();
      await expect
        .poll(async () => Number(await ball.getAttribute("cx")))
        .toBeGreaterThan(0);
      const marker = instrument.locator('[data-instrument="ball-mark"]');
      const beforeRotation = await marker.getAttribute("transform");
      await expect
        .poll(async () => marker.getAttribute("transform"))
        .not.toBe(beforeRotation);
      await instrument
        .getByRole("button", { name: "Пауза", exact: true })
        .click();
      await expect(
        instrument.getByRole("button", { name: "Продовжити", exact: true }),
      ).toBeVisible();
      const pausedPosition = Number(await ball.getAttribute("cx"));
      await page.waitForTimeout(120);
      expect(Number(await ball.getAttribute("cx"))).toBeCloseTo(
        pausedPosition,
        5,
      );
      await expect(diameter).toBeEnabled();
      await material.selectOption("1");
      await expect(ball).toHaveAttribute("cx", "0");
      await expect(marker).toHaveAttribute("data-rotations", "0");
      await conditions.selectOption("1");
      await distance.focus();
      await distance.press("End");
      await diameter.focus();
      await diameter.press("Home");
      async function measure() {
        await instrument
          .getByRole("button", { name: "Запустити дослід", exact: true })
          .click();
        await expect(instrument.locator(".virtual-results")).toBeVisible();
        return Number(
          (
            await instrument.locator(".virtual-results dd").nth(1).innerText()
          ).replace(",", "."),
        );
      }
      await material.selectOption("0");
      const steelAir = await measure();
      const clock = instrument.getByLabel("Час скочування", { exact: true });
      await expect(clock).toHaveText(
        steelAir.toFixed(3).replace(".", ",") + " с",
      );
      await material.selectOption("1");
      await expect(clock).toHaveText("0,000 с");
      const plasticAir = await measure();
      expect(plasticAir).toBeGreaterThan(steelAir);
      await conditions.selectOption("0");
      const plasticIdeal = await measure();
      await material.selectOption("0");
      const steelIdeal = await measure();
      expect(steelIdeal).toBe(plasticIdeal);
      expect(steelAir).toBeGreaterThan(steelIdeal);
      expect(plasticAir / steelAir).toBeLessThan(1.1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    });
  });
}
