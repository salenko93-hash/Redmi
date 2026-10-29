import { test } from "node:test";
import assert from "node:assert/strict";
import {
  G,
  initialParameters,
  simulate,
  simulationSetup,
  validateParameters,
  validateSimulationRecords,
  type SimulationRecord,
} from "../lib/simulation";
import { labs } from "../lib/labs";
import {
  transferredMeasurements,
  usesManualTiming,
} from "../lib/experiment-timing";
const close = (a: number, b: number, tolerance = 1e-4) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`);
test("only time-measuring experiments preserve pupil times on model transfer", () => {
  for (const lab of labs) {
    const timed = lab.content.experiments.some((e) =>
      e.fields.some((f) => f.key === "t" && !f.calculated),
    );
    assert.equal(usesManualTiming(lab.number), timed);
    for (const experiment of lab.content.experiments) {
      const parameters = initialParameters(lab.number, experiment.id);
      const readings = simulate(lab.number, experiment.id, parameters).readings;
      const original = { ...readings };
      const previous = { t: "12,34", T: "999", v: "999", density: "999" };
      const transferred = transferredMeasurements(
        lab.number,
        readings,
        previous,
      );
      assert.deepEqual(readings, original);
      assert.equal(previous.t, "12,34");
      assert.equal(transferred.T, undefined);
      assert.equal(transferred.v, undefined);
      if (timed) {
        assert.equal(transferred.t, "12,34");
        assert.equal(transferredMeasurements(lab.number, readings).t, "");
        assert.notEqual(transferred.t, readings.t);
      } else assert.deepEqual(transferred, readings);
    }
  }
});
test("every experiment has a valid model and finite readings", () => {
  for (const lab of labs)
    for (const e of lab.content.experiments) {
      const p = initialParameters(lab.number, e.id);
      assert.ok(validateParameters(lab.number, e.id, p));
      const r = simulate(lab.number, e.id, p);
      assert.ok(r.duration > 0);
      for (const v of Object.values(r.values)) assert.ok(Number.isFinite(v));
      assert.ok(simulationSetup(lab.number, e.id).assumption.length > 20);
    }
});
test("rolling sphere, rotation and pendulum follow their stated models", () => {
  let p = initialParameters(1, "speed");
  p.airResistance = 0;
  p.angle = 30;
  p.distance = 1;
  let r = simulate(1, "speed", p);
  close(r.values.a, (5 / 7) * G * 0.5);
  close(+r.readings.t, Math.sqrt(2 / r.values.a));
  p = initialParameters(2, "rotation");
  const first = simulate(2, "rotation", p);
  p.cycles = 20;
  close(simulate(2, "rotation", p).values.t, 2 * first.values.t);
  p = initialParameters(3, "length");
  p.length = 1;
  const long = simulate(3, "length", p);
  p.length = 0.25;
  close(simulate(3, "length", p).values.T, long.values.T / 2);
  p = initialParameters(3, "mass");
  const m1 = simulate(3, "mass", p);
  p.mass = 0.25;
  close(simulate(3, "mass", p).values.T, m1.values.T);
});
test("small-angle pendulum accepts worksheet amplitudes and preserves prior model readings", () => {
  const p = initialParameters(3, "amplitude");
  const original = simulate(3, "amplitude", { ...p, amplitude: 0.03 });
  for (const amplitude of [0.025, 0.055]) {
    assert.ok(validateParameters(3, "amplitude", { ...p, amplitude }));
    const r = simulate(3, "amplitude", { ...p, amplitude });
    close(r.values.T, original.values.T);
    close(+r.readings.A, amplitude);
  }
});
test("the two-metre ramp accepts its full scale and preserves earlier readings", () => {
  const p = initialParameters(1, "speed");
  p.airResistance = 0;
  p.distance = 1.5;
  const old = simulate(1, "speed", p);
  p.distance = 2;
  assert.ok(validateParameters(1, "speed", p));
  const full = simulate(1, "speed", p);
  assert.equal(full.readings.l, "2");
  close(full.values.t / old.values.t, Math.sqrt(2 / 1.5));
  p.distance = 2.1;
  assert.equal(validateParameters(1, "speed", p), false);
});
test("balance requires actual equilibrium and does not provide the calculated mass", () => {
  const p = initialParameters(4, "weigh");
  assert.equal(simulate(4, "weigh", p).canRecord, false);
  Object.assign(p, { w20: 2, w5: 1, w1: 1, w200mg: 2, w50mg: 1, w20mg: 1 });
  const r = simulate(4, "weigh", p);
  assert.ok(r.canRecord);
  close(r.values.total, 46.47);
  assert.equal(r.readings.mass, undefined);
});
test("density models conserve mass and displaced volume", () => {
  let p = initialParameters(5, "regular");
  p.sample = 1;
  let r = simulate(5, "regular", p);
  close(+r.readings.m / (p.l * p.d * p.h), 2.7);
  p = initialParameters(5, "irregular");
  r = simulate(5, "irregular", p);
  close(+r.readings.V2 - +r.readings.V1, r.values.V);
  close(+r.readings.m / r.values.V, 0.7);
  p = initialParameters(5, "liquid");
  p.sample = 2;
  r = simulate(5, "liquid", p);
  close((+r.readings.m2 - +r.readings.m1) / +r.readings.V, 1.26);
});
test("nonlinear rubber is reversible and differs from an ideal spring", () => {
  const p = initialParameters(6, "elastic");
  const r1 = simulate(6, "elastic", p);
  close(20 * r1.values.x + 25000 * r1.values.x ** 3, r1.values.F);
  p.mass = 400;
  const r2 = simulate(6, "elastic", p);
  assert.ok(r2.values.F / r2.values.x > r1.values.F / r1.values.x);
  p.material = 1;
  const spring = simulate(6, "elastic", p);
  close(spring.values.F / spring.values.x, 20);
  p.mass = 0;
  const unloaded = simulate(6, "elastic", p);
  close(+unloaded.readings.l, p.initial);
  assert.equal(unloaded.canRecord, false);
});
test("friction and pressure separate load from contact area", () => {
  let p = initialParameters(7, "friction");
  const a = simulate(7, "friction", p);
  p.side = 1;
  close(simulate(7, "friction", p).values.F, a.values.F);
  p.loads = 3;
  const b = simulate(7, "friction", p);
  close(b.values.F / b.values.N, a.values.F / a.values.N);
  p = initialParameters(8, "area");
  const f1 = simulate(8, "area", p);
  p.face = 2;
  const f2 = simulate(8, "area", p);
  close(f1.values.F, f2.values.F);
  close(f1.values.pressure * f1.values.S, f2.values.pressure * f2.values.S);
});
test("hydrostatic weighing recovers material density", () => {
  const p = initialParameters(9, "hydro");
  for (let sample = 0; sample < 3; sample++) {
    p.sample = sample;
    const r = simulate(9, "hydro", p);
    close(
      (1000 * +r.readings.P1) / (+r.readings.P1 - +r.readings.P2),
      [2700, 7870, 8960][sample],
      0.01,
    );
  }
});
test("floating distinguishes surface equilibrium, neutrality and bottom support", () => {
  const p = initialParameters(10, "floating");
  p.sand = 30;
  let r = simulate(10, "floating", p);
  assert.equal(r.values.state, 0);
  close(r.values.weight, r.values.buoyancy);
  p.sand = 0;
  r = simulate(10, "floating", p);
  assert.equal(r.values.state, -1);
  close(r.values.weight, r.values.buoyancy);
  close(r.values.fraction, 0.4);
  p.sand = 60;
  r = simulate(10, "floating", p);
  assert.equal(r.values.state, 1);
  close(r.values.buoyancy + r.values.support, r.values.weight);
  p.sand = 30;
  p.liquid = 1;
  r = simulate(10, "floating", p);
  assert.equal(r.values.state, -1);
  assert.equal(r.canRecord, false);
});
test("provenance rejects tampered outputs, duplicates and invalid parameters", () => {
  const e = labs[0].content.experiments[0],
    p = initialParameters(1, e.id),
    r = simulate(1, e.id, p);
  const record: SimulationRecord = {
    modelVersion: r.modelVersion,
    labNumber: 1,
    experimentId: e.id,
    rowIndex: 0,
    parameters: p,
    readings: r.readings,
    recordedAt: new Date().toISOString(),
  };
  assert.equal(validateSimulationRecords(1, [e], [record]), null);
  assert.ok(validateSimulationRecords(1, [e], [record, record]));
  assert.ok(
    validateSimulationRecords(
      1,
      [e],
      [{ ...record, readings: { ...record.readings, t: "999" } }],
    ),
  );
  assert.ok(!validateParameters(1, e.id, { ...p, angle: Infinity }));
  assert.ok(!validateParameters(1, e.id, { ...p, unknown: 2 }));
  assert.ok(!validateParameters(1, e.id, { ...p, angle: 5.2 }));
});
