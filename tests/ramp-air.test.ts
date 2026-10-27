import { test } from "node:test";
import assert from "node:assert/strict";
import { rampMotion, rampBallProperties, rampGeometry } from "../lib/ramp";
import {
  initialParameters,
  simulate,
  validateSimulationRecords,
  type SimulationRecord,
} from "../lib/simulation";
import { answersSchema } from "../lib/validation";
import { labs } from "../lib/labs";
const close = (a: number, b: number, tolerance = 1e-7) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
test("closed-form ramp motion agrees with independently integrated rolling equations and remains below the energy limit", () => {
  for (const material of [0, 1])
    for (const diameter of [10, 50])
      for (const angle of [5, 35]) {
        const distance = 2,
          motion = rampMotion(distance, angle, material, diameter, 1);
        let x = 0,
          v = 0;
        const steps = 5000,
          dt = motion.time / steps;
        // RK4 integration of dx/dt=v, dv/dt=a-bv², independent of the closed-form trajectory.
        const acceleration = (velocity: number) =>
          motion.a - motion.b * velocity * velocity;
        for (let i = 0; i < steps; i++) {
          const k1 = acceleration(v),
            k2 = acceleration(v + (k1 * dt) / 2),
            k3 = acceleration(v + (k2 * dt) / 2),
            k4 = acceleration(v + k3 * dt);
          x +=
            (dt *
              (v +
                2 * (v + (k1 * dt) / 2) +
                2 * (v + (k2 * dt) / 2) +
                (v + k3 * dt))) /
            6;
          v += (dt * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
        }
        close(x, distance);
        close(v, motion.velocity(motion.time));
        assert.ok(v < Math.sqrt(2 * motion.a * distance));
        close(motion.position(0), 0);
        close(motion.position(motion.time), distance);
        let previous = 0;
        for (const phase of [0.1, 0.25, 0.5, 0.75, 1]) {
          const position = motion.position(phase * motion.time);
          assert.ok(position > previous);
          previous = position;
          const geometry = rampGeometry(
            distance,
            angle,
            diameter,
            phase,
            position / distance,
          );
          close(geometry.ballX / 200, position);
          close(geometry.rotations, position / ((Math.PI * diameter) / 1000));
        }
        close(
          motion.b,
          (0.5 * 1.2 * 0.47 * Math.PI * (diameter / 2000) ** 2) /
            (1.4 * rampBallProperties(material, diameter).mass),
        );
      }
});
test("versioned air records and legacy ideal records coexist, validate through the API schema and reject mismatched model tags", () => {
  const e = labs[0].content.experiments[0],
    legacy = { angle: 15, distance: 1.2 },
    p = initialParameters(1, e.id);
  const record = (
    parameters: Record<string, number>,
    rowIndex: number,
  ): SimulationRecord => ({
    modelVersion: simulate(1, e.id, parameters).modelVersion,
    labNumber: 1,
    experimentId: e.id,
    rowIndex,
    parameters,
    readings: simulate(1, e.id, parameters).readings,
    recordedAt: new Date().toISOString(),
  });
  const old = record(legacy, 0),
    current = record(p, 1),
    oldBall = record({ ...legacy, material: 1, diameter: 20 }, 2);
  assert.equal(old.modelVersion, 1);
  assert.equal(current.modelVersion, 2);
  assert.equal(
    validateSimulationRecords(1, [e], [old, current, oldBall]),
    null,
  );
  assert.ok(
    answersSchema.safeParse({ simulationRecords: [old, current, oldBall] })
      .success,
  );
  assert.ok(
    validateSimulationRecords(1, [e], [{ ...current, modelVersion: 1 }]),
  );
  assert.ok(validateSimulationRecords(1, [e], [{ ...old, modelVersion: 2 }]));
  assert.ok(
    validateSimulationRecords(
      1,
      [e],
      [{ ...current, parameters: { ...p, airResistance: 0 } }],
    ),
  );
  assert.ok(
    validateSimulationRecords(
      1,
      [e],
      [{ ...current, readings: { ...current.readings, t: old.readings.t } }],
    ),
  );
  assert.ok(
    !answersSchema.safeParse({
      simulationRecords: [{ ...current, modelVersion: 3 }],
    }).success,
  );
});
