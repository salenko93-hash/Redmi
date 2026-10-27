import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rotationGeometry,
  ROTATION_BALL_RADIUS,
  ROTATION_SCALE,
  type RotationView,
} from "../lib/rotation-view";
import { simulate, validateParameters } from "../lib/simulation";
const close = (a: number, b: number, tolerance = 1e-8) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
test("top and oblique views project the same physical circle while the thread stops at the sphere surface", () => {
  for (const view of ["top", "perspective"] as RotationView[])
    for (const radius of [0.1, 0.15, 0.3])
      for (const phase of [0, 0.0125, 0.025, 0.075, 0.3, 0.42, 1]) {
        const g = rotationGeometry(radius, 10, phase, view);
        close(
          Math.hypot(g.ball.x - g.cx, (g.ball.y - g.cy) / g.squash),
          radius * ROTATION_SCALE,
        );
        close(
          Math.hypot(g.ball.x - g.end.x, g.ball.y - g.end.y),
          ROTATION_BALL_RADIUS,
        );
        close(
          (g.end.x - g.cx) * (g.ball.y - g.cy) -
            (g.end.y - g.cy) * (g.ball.x - g.cx),
          0,
        );
        assert.ok(
          g.ball.x - ROTATION_BALL_RADIUS > 0 &&
            g.ball.x + ROTATION_BALL_RADIUS < 424,
        );
        assert.ok(
          g.ball.y - ROTATION_BALL_RADIUS > 64 &&
            g.ball.y + ROTATION_BALL_RADIUS < 409,
        );
        assert.ok(Math.hypot(g.end.x - g.cx, g.end.y - g.cy) > 0);
      }
});
test("turn counter starts at zero, counts full crossings and returns to the start after the selected turns", () => {
  for (const cycles of [10, 20, 30]) {
    assert.equal(rotationGeometry(0.15, cycles, 0).completed, 0);
    assert.equal(rotationGeometry(0.15, cycles, 0.9 / cycles).completed, 0);
    for (let completed = 1; completed <= cycles; completed++)
      assert.equal(
        rotationGeometry(0.15, cycles, completed / cycles).completed,
        completed,
      );
    const end = rotationGeometry(0.15, cycles, 1);
    close(end.ball.x, end.cx + end.r);
    close(end.ball.y, end.cy);
  }
});
test("view selection is presentation only and preserves existing period and frequency measurements", () => {
  const parameters = { radius: 0.15, speed: 0.6, cycles: 10 },
    result = simulate(2, "rotation", parameters);
  close(Number(result.readings.t), (10 * 2 * Math.PI * 0.15) / 0.6, 1e-5);
  for (const view of ["top", "perspective"] as RotationView[]) {
    const g = rotationGeometry(
      parameters.radius,
      parameters.cycles,
      0.35,
      view,
    );
    assert.equal(g.completed, 3);
    assert.deepEqual(
      simulate(2, "rotation", parameters).readings,
      result.readings,
    );
  }
  assert.equal(
    validateParameters(2, "rotation", { ...parameters, view: 1 }),
    false,
  );
});
