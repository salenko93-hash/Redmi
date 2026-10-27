import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pressureGeometry,
  pressureObservation,
  PRESSURE_SCALE,
  PRESSURE_BASE,
  PRESSURE_SCENE_HEIGHT,
} from "../lib/pressure-view";
import { initialParameters, simulate } from "../lib/simulation";

test("three pressure orientations preserve the cuboid and match contact dimensions over the full supported range", () => {
  for (let li = 6; li <= 12; li++)
    for (let di = 3; di <= 5; di++)
      for (const h of [0.01, 0.015, 0.02])
        for (const face of [0, 1, 2]) {
          const l = li / 100,
            d = di / 100;
          const g = pressureGeometry(l, d, h, face);
          const r = simulate(8, "area", {
            ...initialParameters(8, "area"),
            l,
            d,
            h,
            face,
          });
          assert.ok(
            Math.abs(g.a * g.b * g.height - l * d * h) < 1e-12,
            "turning the block must preserve volume",
          );
          assert.equal(g.a, Number(r.readings.a));
          assert.equal(g.b, Number(r.readings.b));
          assert.ok(
            Math.abs((g.width * g.depth) / PRESSURE_SCALE ** 2 - r.values.S) <
              1e-12,
          );
          assert.equal(g.vertical, g.height * PRESSURE_SCALE);
          assert.ok(
            100 + g.width + g.dx < 350 &&
              PRESSURE_BASE - g.vertical - g.dy > 70,
            "the block must fit beside the readings",
          );
          assert.ok(
            445 + g.depth < 530,
            "the footprint must fit below the apparatus",
          );
          assert.equal(r.readings.p, undefined);
          assert.equal(r.readings.S, undefined);
        }
});

test("pressure observation cursors stay on the calibrated rulers without changing the static block", () => {
  for (const face of [0, 1, 2]) {
    const g = pressureGeometry(0.12, 0.05, 0.02, face);
    assert.deepEqual(pressureObservation(g.a, g.b, -1), { x: 0, y: 0 });
    assert.deepEqual(pressureObservation(g.a, g.b, 2), {
      x: g.width,
      y: g.depth,
    });
    const half = pressureObservation(g.a, g.b, 0.5);
    assert.equal(half.x * 2, g.width);
    assert.equal(half.y * 2, g.depth);
    assert.ok(
      g.width <= 12 * 12 && g.depth <= 5 * 12,
      "millimetre rulers must cover each allowed face",
    );
    assert.ok(
      PRESSURE_BASE - g.vertical - g.dy > 70,
      "the tallest block must clear the scene header",
    );
    assert.ok(
      445 + g.depth < 530 && 553 < PRESSURE_SCENE_HEIGHT,
      "top view must remain between the two rulers",
    );
  }
});
