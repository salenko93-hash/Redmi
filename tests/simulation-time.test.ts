import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceSimulationClock } from "../lib/simulation-time";

test("an earlier queued frame cannot create negative liquid volume or mass", () => {
  let state = { phase: 0, last: 1000 };
  for (const now of [995, 999, 1000, 1016, 1015, 1032]) {
    const next = advanceSimulationClock(state.phase, state.last, now, 1000);
    assert.ok(next.phase >= state.phase);
    assert.ok(100 * next.phase >= 0);
    assert.ok(60 + 100 * next.phase >= 60);
    assert.ok(next.last >= state.last);
    state = next;
  }
  assert.equal(state.phase, 0.032);
});

test("resuming keeps accumulated progress, advances at model speed and stops at completion", () => {
  const resumed = advanceSimulationClock(0.25, 2000, 2250, 1000);
  assert.equal(resumed.phase, 0.5);
  assert.equal(
    advanceSimulationClock(resumed.phase, resumed.last, 2400, 1000).phase,
    0.65,
  );
  assert.equal(advanceSimulationClock(0.65, 2400, 10000, 1000).phase, 1);
});
