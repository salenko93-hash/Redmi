import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pendulumGeometry,
  PENDULUM_SCALE,
  PENDULUM_BOB_RADIUS,
} from "../lib/pendulum-view";
import { simulate, initialParameters } from "../lib/simulation";
const close = (a: number, b: number, tolerance = 1e-8) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
test("pendulum cord attaches at the bob surface while the effective length reaches its centre in all three series", () => {
  for (const [length, amplitude] of [
    [1, 0.02],
    [1, 0.025],
    [1, 0.055],
    [1, 0.06],
    [0.25, 0.025],
    [0.5, 0.025],
    [0.75, 0.025],
  ])
    for (const phase of [0, 0.0125, 0.025, 0.05, 0.075, 0.1, 0.32, 1]) {
      const g = pendulumGeometry(length, amplitude, 10, phase);
      close(
        Math.hypot(g.bob.x - g.pivot.x, g.bob.y - g.pivot.y),
        length * PENDULUM_SCALE,
      );
      close(
        Math.hypot(g.bob.x - g.attachment.x, g.bob.y - g.attachment.y),
        PENDULUM_BOB_RADIUS,
      );
      close(
        Math.hypot(g.attachment.x - g.pivot.x, g.attachment.y - g.pivot.y) +
          PENDULUM_BOB_RADIUS,
        g.displayLength,
      );
      close(g.angle * length, g.coordinate);
      close((g.coordinateX - g.pivot.x) / 3000, g.coordinate);
      close(g.equilibrium.y - g.pivot.y, g.displayLength);
      assert.ok(
        g.bob.x - PENDULUM_BOB_RADIUS > 115 &&
          g.bob.x + PENDULUM_BOB_RADIUS < 351,
      );
      assert.ok(
        g.bob.y - PENDULUM_BOB_RADIUS > g.pivot.y &&
          g.bob.y + PENDULUM_BOB_RADIUS < 380,
      );
    }
  close(
    pendulumGeometry(1, 0.025, 10, 0).displayLength /
      pendulumGeometry(0.25, 0.025, 10, 0).displayLength,
    4,
  );
});
test("one cycle starts at zero, goes to the opposite extreme and returns before incrementing the counter", () => {
  for (const cycles of [10, 20, 30]) {
    close(pendulumGeometry(1, 0.025, cycles, 0).coordinate, 0.025);
    close(pendulumGeometry(1, 0.025, cycles, 0.25 / cycles).coordinate, 0);
    close(pendulumGeometry(1, 0.025, cycles, 0.5 / cycles).coordinate, -0.025);
    assert.equal(
      pendulumGeometry(1, 0.025, cycles, 0.99 / cycles).completed,
      0,
    );
    for (let i = 1; i <= cycles; i++)
      assert.equal(pendulumGeometry(1, 0.025, cycles, i / cycles).completed, i);
    close(pendulumGeometry(1, 0.025, cycles, 1).coordinate, 0.025);
  }
});
test("realistic presentation keeps v1 readings, the square-root length dependence and mass independence", () => {
  for (const series of ["amplitude", "length", "mass"])
    assert.equal(
      simulate(3, series, initialParameters(3, series)).modelVersion,
      1,
    );
  const first = simulate(3, "amplitude", { amplitude: 0.025, cycles: 10 }),
    wide = simulate(3, "amplitude", { amplitude: 0.055, cycles: 10 });
  close(first.values.T, 2 * Math.PI * Math.sqrt(1 / 10));
  close(first.values.t, wide.values.t);
  const short = simulate(3, "length", { length: 0.25, cycles: 10 });
  close(first.values.T / short.values.T, 2);
  const light = simulate(3, "mass", { mass: 0.05, cycles: 10 }),
    heavy = simulate(3, "mass", { mass: 0.25, cycles: 10 });
  close(light.values.t, heavy.values.t);
  close(light.values.length, heavy.values.length);
});
