import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tubeFraction,
  tubeDepth,
  floatingGeometry,
  FLOATING_SURFACE,
  FLOATING_FLOOR,
  FLOATING_CUP_RADIUS,
  FLOATING_PIXEL_VOLUME,
  FLOATING_FORCE_ORIGIN,
  floatingSandCapacity,
  floatingSandGeometry,
} from "../lib/floating-view";
import { initialParameters, simulate } from "../lib/simulation";
test("rounded-bottom tube immersion is a volume fraction and has an invertible profile", () => {
  for (const volume of [40, 50, 60, 70, 80]) {
    const s = Math.cbrt(volume / 50),
      r = 18 * s,
      h = 110 * s;
    assert.equal(tubeFraction(0, r, h), 0);
    assert.ok(Math.abs(tubeFraction(h, r, h) - 1) < 1e-12);
    const hemisphere = (2 * r) / 3 / (h - r / 3);
    assert.ok(Math.abs(tubeFraction(r, r, h) - hemisphere) < 1e-12);
    for (let n = 0; n <= 100; n++) {
      const f = n / 100,
        d = tubeDepth(f, r, h);
      assert.ok(Math.abs(tubeFraction(d, r, h) - f) < 1e-11);
    }
    assert.ok(
      Math.abs(tubeFraction(h / 2, r, h) - 0.5) > 0.01,
      "half the height is not half the volume for a rounded bottom",
    );
  }
});
test("all floating states fit the vessel and final immersed volume agrees with unchanged force readings", () => {
  for (const volume of [40, 50, 60, 70, 80])
    for (let sand = 0; sand <= 80; sand++)
      for (const liquid of [0, 1]) {
        const r = simulate(10, "floating", {
          ...initialParameters(10, "floating"),
          volume,
          sand,
          liquid,
        });
        const { state, fraction, weight } = r.values;
        for (let frame = 0; frame <= 10; frame++) {
          const g = floatingGeometry(volume, fraction, state, frame / 10);
          assert.ok(g.top > 50 && g.bottom <= FLOATING_FLOOR + 1e-9);
          assert.ok(g.immersed >= 0 && g.immersed <= 1 + 1e-12);
          const displacement =
            ((FLOATING_SURFACE - g.surface) *
              Math.PI *
              FLOATING_CUP_RADIUS ** 2) /
            FLOATING_PIXEL_VOLUME;
          assert.ok(
            Math.abs(displacement - volume * g.immersed) < 1e-9,
            "liquid displacement must equal the submerged external volume",
          );
          const currentBuoyancy =
            (liquid === 0 ? 1 : 1.03) * volume * 0.01 * g.immersed;
          assert.ok(
            FLOATING_FORCE_ORIGIN - currentBuoyancy * 100 > 268,
            "the upward arrow must clear the force heading",
          );
          assert.ok(
            FLOATING_FORCE_ORIGIN + weight * 100 < 470,
            "the downward arrow must fit the force card",
          );
          if (frame < 10) assert.equal(g.onBottom, false);
        }
        const g = floatingGeometry(volume, fraction, state, 1);
        const buoyancy = (liquid === 0 ? 1 : 1.03) * volume * 0.01 * g.immersed;
        const support = g.onBottom ? weight - buoyancy : 0;
        assert.ok(Math.abs(buoyancy - r.values.buoyancy) < 1e-10);
        assert.ok(Math.abs(support - r.values.support) < 1e-10);
        assert.ok(Math.abs(buoyancy + support - weight) < 1e-10);
        if (state > 0) assert.ok(Math.abs(g.bottom - FLOATING_FLOOR) < 1e-9);
        else if (state === 0) assert.ok(g.top > FLOATING_SURFACE);
        else assert.ok(g.top < FLOATING_SURFACE && g.bottom > FLOATING_SURFACE);
      }
});

test("sand fill uses bulk volume and remains inside the modelled closed tube capacity", () => {
  for (const volume of [40, 50, 60, 70, 80]) {
    const s = Math.cbrt(volume / 50),
      r = 18 * s,
      h = 110 * s;
    const limit = floatingSandCapacity(volume);
    assert.ok(limit <= 80 && limit <= (volume - 10) * 1.6);
    assert.ok(limit >= volume - 20, "neutral buoyancy must remain reachable");
    for (let mass = 0; mass <= limit; mass++) {
      const g = floatingSandGeometry(volume, mass, r, h);
      const innerVolume =
        ((g.radius ** 2 * (g.height - g.radius / 3)) / (r * r * (h - r / 3))) *
        volume;
      assert.ok(Math.abs(innerVolume - (volume - 10)) < 1e-10);
      assert.ok(
        h - 1.5 - g.height >= 4,
        "the inner cavity must remain below the stopper",
      );
      assert.ok(
        Math.abs(
          tubeFraction(g.depth, g.radius, g.height) * innerVolume - mass / 1.6,
        ) < 1e-10,
      );
    }
  }
});
