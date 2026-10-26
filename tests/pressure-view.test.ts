import { test } from "node:test";
import assert from "node:assert/strict";
import { pressureGeometry, PRESSURE_SCALE } from "../lib/pressure-view";
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
            100 + g.width + g.dx < 350 && 260 - g.vertical - g.dy > 60,
            "the block must fit beside the readings",
          );
          assert.ok(
            350 + g.depth < 440,
            "the footprint must fit below the apparatus",
          );
          assert.equal(r.readings.p, undefined);
          assert.equal(r.readings.S, undefined);
        }
});
