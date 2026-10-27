/** A queued animation frame may predate effect initialization. Never run time backwards. */
export function advanceSimulationClock(
  phase: number,
  last: number,
  now: number,
  milliseconds: number,
) {
  return {
    phase: Math.min(1, phase + Math.max(0, now - last) / milliseconds),
    last: Math.max(last, now),
  };
}
