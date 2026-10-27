import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CYLINDER_BASE,
  CYLINDER_CAPACITY,
  cylinderLevel,
  densityBlockGeometry,
  densityImmersion,
  rockOutline,
} from "../lib/density-view";
import { initialParameters, simulate } from "../lib/simulation";
import { expected } from "../lib/physics";
import { labs } from "../lib/labs";

test("displacement view stays monotonic and fully submerges every supported sample", () => {
  for (const water of [50, 100, 150])
    for (let step = 0; step <= 10; step++) {
      const size = 0.5 + step * 0.1,
        volume = 20 * size ** 3;
      let previous = water;
      const initial = densityImmersion(water, volume, size, 0);
      assert.ok(
        initial.centerY + initial.radius < initial.surface,
        "sample starts above the water for every allowed size",
      );
      for (let frame = 0; frame <= 20; frame++) {
        const state = densityImmersion(water, volume, size, frame / 20);
        assert.ok(state.reading >= previous - 1e-7);
        assert.ok(
          state.reading >= water - 1e-7 &&
            state.reading <= water + volume + 1e-7,
        );
        previous = state.reading;
      }
      const final = densityImmersion(water, volume, size, 1);
      assert.equal(final.reading, water + volume);
      for (const [, y] of rockOutline) {
        const actual = final.centerY + y * final.radius;
        assert.ok(
          actual >= final.surface,
          "entire sample must be below the liquid surface",
        );
        assert.ok(
          actual < CYLINDER_BASE,
          "sample must fit above the cylinder bottom",
        );
      }
    }
});

test("graduated cylinders share one linear scale and fit the full volume range", () => {
  assert.equal(cylinderLevel(0), CYLINDER_BASE);
  for (let volume = 0; volume <= CYLINDER_CAPACITY; volume += 10) {
    assert.ok(cylinderLevel(volume) >= 125);
    if (volume > 0)
      assert.ok(
        Math.abs(cylinderLevel(volume - 10) - cylinderLevel(volume) - 9) < 1e-9,
      );
  }
  assert.ok(150 + 20 * 1.5 ** 3 < CYLINDER_CAPACITY);
});

test("block dimensions preserve fixed scales while all allowed specimens fit the measurement scene", () => {
  const first = densityBlockGeometry(4, 2, 2),
    last = densityBlockGeometry(8, 5, 5);
  assert.equal(last.length / first.length, 2);
  assert.equal(last.height / first.height, 2.5);
  assert.equal(last.depthX / first.depthX, 2.5);
  assert.equal(last.depthY / first.depthY, 2.5);
  assert.equal(first.length / 4, first.height / 2);
  assert.ok(last.x + last.length + last.depthX < 420);
  assert.ok(last.base - last.height - last.depthY > 60);
});

test("density series convert independently calculated density to SI without returning it as a reading", () => {
  for (const e of labs[4].content.experiments) {
    const p = initialParameters(5, e.id),
      r = simulate(5, e.id, p);
    assert.equal(r.readings.rho, undefined);
    assert.equal(r.readings.rhoSI, undefined);
    const field = e.fields.find((f) => f.key === "rhoSI")!;
    assert.equal(expected(field, { rho: "0,92" }), 920);
  }
});
