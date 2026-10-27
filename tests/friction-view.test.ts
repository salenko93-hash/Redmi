import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FRICTION_FLOOR,
  FRICTION_ROPE_LENGTH,
  FRICTION_METER_PX_PER_N,
  frictionGeometry,
  frictionMeterGeometry,
} from "../lib/friction-view";
import { simulate, initialParameters } from "../lib/simulation";

test("friction apparatus keeps both faces on the board with a horizontal attached rope and room for the meter", () => {
  for (const side of [0, 1])
    for (let i = 0; i <= 20; i++) {
      const g = frictionGeometry(side, i / 20);
      assert.equal(g.top + g.height, FRICTION_FLOOR);
      assert.equal(g.right, g.left + g.width);
      assert.equal(g.pullY, g.top + g.height / 2);
      assert.equal(g.meterX - g.right, FRICTION_ROPE_LENGTH);
      assert.ok(
        g.left - 18 >= 24 &&
          g.meterX + frictionMeterGeometry(2.25).right <= 580,
        "the moving apparatus must remain on screen",
      );
      assert.ok(
        g.width / 2 - 8 - 17 >= -18 && g.width / 2 - 8 + 17 <= g.width,
        "weights must fit the selected face",
      );
    }
  const wide = frictionGeometry(0, 0),
    narrow = frictionGeometry(1, 0);
  assert.ok(narrow.width < wide.width && narrow.height > wide.height);
  assert.equal(wide.width, narrow.height);
  assert.equal(wide.height, narrow.width);
  assert.equal(wide.width * wide.height, narrow.width * narrow.height);
  assert.ok(
    narrow.pullY < wide.pullY,
    "turning the block must also raise the horizontal pull attachment",
  );
});

test("the mechanical pointer and Newton scale share the spring extension over every supported load", () => {
  let previous = 0;
  for (let force = 0; force <= 5; force += 0.1) {
    const g = frictionMeterGeometry(force);
    assert.ok(
      Math.abs((g.zeroX - g.pointerX) / FRICTION_METER_PX_PER_N - force) <
        1e-10,
    );
    assert.ok(g.anchorX - g.pointerX >= previous);
    previous = g.anchorX - g.pointerX;
    assert.ok(
      g.pointerX >= g.caseX + 30 - 1e-8 && g.pointerX <= g.caseX + 110 + 1e-8,
    );
  }
  for (const surface of [0, 1, 2])
    for (const loads of [1, 2, 3]) {
      const p = { ...initialParameters(7, "friction"), surface, loads };
      const r = simulate(7, "friction", p);
      for (const side of [0, 1]) {
        const other = simulate(7, "friction", { ...p, side });
        assert.equal(other.readings.F, r.readings.F);
        assert.equal(other.readings.N, r.readings.N);
        const body = frictionGeometry(side, 1);
        assert.ok(
          (r.values.F * body.height) / 2 < (r.values.N * body.width) / 2,
          "the chosen block proportions must allow horizontal sliding without tipping in the supported range",
        );
        assert.ok(
          frictionGeometry(side, 1).meterX +
            frictionMeterGeometry(r.values.F).right <=
            580,
        );
      }
      assert.equal(r.readings.mu, undefined);
    }
});
