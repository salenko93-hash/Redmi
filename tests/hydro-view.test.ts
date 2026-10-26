import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hydroGeometry,
  HYDRO_ZERO,
  HYDRO_PX_PER_NEWTON,
} from "../lib/hydro-view";
import { initialParameters, simulate } from "../lib/simulation";

test("hydro view balances partial immersion, stays outside the gauge and fully submerges all supported samples", () => {
  for (const sample of [0, 1, 2])
    for (let volume = 20; volume <= 100; volume += 10) {
      const r = simulate(9, "hydro", {
        ...initialParameters(9, "hydro"),
        sample,
        volume,
      });
      let previous = r.values.P1;
      for (let frame = 0; frame <= 40; frame++) {
        const g = hydroGeometry(volume, r.values.P1, r.values.P2, frame / 40);
        assert.ok(
          g.force <= previous + 1e-10 && g.force >= r.values.P2 - 1e-10,
        );
        const wet = Math.max(
          0,
          Math.min(1, (g.bodyTop + g.size - g.surface) / g.size),
        );
        assert.ok(
          Math.abs(wet - g.fraction) < 1e-10,
          "buoyancy must match actual submerged fraction",
        );
        assert.ok(
          Math.abs(
            g.force - (r.values.P1 - (r.values.P1 - r.values.P2) * wet),
          ) < 1e-10,
        );
        assert.ok(
          Math.abs((g.pointer - HYDRO_ZERO) / HYDRO_PX_PER_NEWTON - g.force) <
            1e-10,
        );
        assert.ok(
          g.bodyTop > 180 && g.surface > 180 && g.bottom < 540,
          "sample and water must remain below the instrument and within the scene",
        );
        previous = g.force;
      }
      const start = hydroGeometry(volume, r.values.P1, r.values.P2, 0);
      assert.equal(start.fraction, 0);
      assert.ok(start.bodyTop + start.size < start.surface - 16);
      const end = hydroGeometry(volume, r.values.P1, r.values.P2, 1);
      assert.equal(end.fraction, 1);
      assert.ok(Math.abs(end.force - r.values.P2) < 1e-10);
      assert.ok(
        end.bodyTop > end.surface && end.bodyTop + end.size < end.bottom,
      );
      assert.equal(r.readings.rho, undefined);
    }
});
