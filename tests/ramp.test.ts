import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rampBallProperties,
  rampGeometry,
  RAMP_BALL_MAGNIFICATION,
  RAMP_SCALE,
} from "../lib/ramp";
import {
  initialParameters,
  simulate,
  validateParameters,
  validateSimulationRecords,
  type SimulationRecord,
} from "../lib/simulation";
import { labs } from "../lib/labs";
import {
  legacyRampCreative,
  previousRampCreative,
  rampCreative,
  rampCreativeInstruction,
} from "../lib/lab-one-material";
const close = (a: number, b: number, tolerance = 1e-10) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
test("solid steel and polypropylene spheres conserve density and have cubic mass growth", () => {
  const steel = rampBallProperties(0, 20),
    plastic = rampBallProperties(1, 20);
  close(steel.mass, (7800 * Math.PI * 0.02 ** 3) / 6);
  close(plastic.mass, (900 * Math.PI * 0.02 ** 3) / 6);
  close(steel.mass / plastic.mass, 7800 / 900);
  for (const material of [0, 1])
    for (const diameter of [10, 15, 20, 25]) {
      const small = rampBallProperties(material, diameter),
        large = rampBallProperties(material, diameter * 2);
      close(large.mass / small.mass, 8);
      close(large.volume / small.volume, 8);
    }
});
test("ideal rolling time stays independent of material and diameter and legacy records validate unchanged", () => {
  const experiment = labs[0].content.experiments[0],
    parameters = { angle: 15, distance: 1.2 };
  const original = simulate(1, experiment.id, parameters);
  for (const material of [0, 1])
    for (const diameter of [10, 20, 50]) {
      const result = simulate(1, experiment.id, {
        ...parameters,
        material,
        diameter,
      });
      assert.deepEqual(result.readings, original.readings);
      close(result.values.mass, rampBallProperties(material, diameter).mass);
    }
  const record: SimulationRecord = {
    modelVersion: 1,
    labNumber: 1,
    experimentId: experiment.id,
    rowIndex: 0,
    parameters,
    readings: original.readings,
    recordedAt: new Date().toISOString(),
  };
  assert.equal(validateSimulationRecords(1, [experiment], [record]), null);
  const current = initialParameters(1, experiment.id);
  const changes: Record<string, number>[] = [
    { diameter: 0 },
    { diameter: 51 },
    { diameter: 20.5 },
    { material: 2 },
    { material: Infinity },
    { mass: 100 },
  ];
  for (const change of changes)
    assert.equal(
      validateParameters(1, experiment.id, { ...current, ...change }),
      false,
    );
  assert.equal(
    validateParameters(1, experiment.id, { ...parameters, material: 0 }),
    false,
  );
  assert.equal(
    validateParameters(1, experiment.id, { ...parameters, diameter: 20 }),
    false,
  );
});
test("enlarged spheres remain tangent to the track, fit the scene and meet the adjusted finish face", () => {
  for (const angle of [5, 15, 25, 35])
    for (const diameter of [10, 20, 35, 50])
      for (const distance of [0.2, 1.2, 2])
        for (const phase of [0, 0.2, 0.5, 0.8, 1]) {
          const view = rampGeometry(distance, angle, diameter, phase);
          close(view.length, 2 * RAMP_SCALE);
          assert.ok(view.stopX + 12 <= view.railLength);
          close(
            view.radius,
            (diameter / 2000) * RAMP_SCALE * RAMP_BALL_MAGNIFICATION,
          );
          close(
            -(view.ball.x - view.startX) * Math.sin(view.radians) +
              (view.ball.y - view.startY) * Math.cos(view.radians),
            -view.radius - 2,
          );
          assert.ok(
            view.ball.x - view.radius >= 0 && view.ball.x + view.radius <= 600,
          );
          assert.ok(
            view.ball.y - view.radius >= 0 && view.ball.y + view.radius <= 410,
          );
          if (phase === 1) close(view.ballX + view.radius, view.stopX);
          else assert.ok(view.ballX + view.radius < view.stopX);
          close(
            view.rotations,
            (distance * phase ** 2) / ((Math.PI * diameter) / 1000),
          );
        }
});
test("updated stock creative guidance keeps teacher wording and explains changing material and diameter", () => {
  assert.equal(rampCreativeInstruction(legacyRampCreative), rampCreative);
  assert.equal(rampCreativeInstruction(previousRampCreative), rampCreative);
  assert.equal(
    rampCreativeInstruction("Авторський дослід учителя"),
    "Авторський дослід учителя",
  );
});

test("air drag slows a lighter solid sphere more without changing its density, and disappears in ideal mode", () => {
  for (const angle of [5, 15, 35])
    for (const distance of [0.2, 1.2, 2])
      for (const diameter of [10, 20, 50]) {
        const base = { angle, distance, diameter, airResistance: 1 };
        const steel = simulate(1, "speed", { ...base, material: 0 }),
          plastic = simulate(1, "speed", { ...base, material: 1 });
        const ideal = simulate(1, "speed", {
          ...base,
          material: 1,
          airResistance: 0,
        });
        assert.ok(
          plastic.values.t > steel.values.t && steel.values.t > ideal.values.t,
        );
        assert.ok(plastic.values.t / steel.values.t < 1.1); // No artificial visual slowdown multiplier.
        assert.equal(steel.modelVersion, 2);
        assert.equal(ideal.modelVersion, 1);
        close(plastic.values.b / steel.values.b, 7800 / 900);
      }
});
