import { test } from "node:test";
import assert from "node:assert/strict";
import { controlValue } from "../lib/simulation-control";
import { labs } from "../lib/labs";
import {
  simulationSetup,
  initialParameters,
  validateParameters,
} from "../lib/simulation";
test("precise editors retain model step alignment without floating point artifacts", () => {
  assert.equal(controlValue("0,085", 0.06, 0.12, 0.01), 0.09);
  assert.equal(controlValue("0.25", 0.2, 2, 0.1), 0.3);
  assert.equal(controlValue("0.015", 0.01, 0.02, 0.005), 0.015);
  for (const lab of labs)
    for (const exp of lab.content.experiments) {
      const initial = initialParameters(lab.number, exp.id);
      for (const c of simulationSetup(lab.number, exp.id).controls) {
        if (c.options) continue;
        for (const raw of [c.min, c.max, (c.min + c.max) / 2]) {
          const value = controlValue(String(raw), c.min, c.max, c.step);
          assert.notEqual(value, null);
          assert.ok(
            validateParameters(lab.number, exp.id, {
              ...initial,
              [c.key]: value!,
            }),
          );
        }
      }
    }
});
test("empty and invalid edits leave the current experiment value intact", () => {
  for (const raw of ["", " ", "NaN", "Infinity", "-1", "81"])
    assert.equal(controlValue(raw, 40, 80, 10), null);
});
