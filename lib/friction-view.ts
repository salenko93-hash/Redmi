export const FRICTION_FLOOR = 205;
export function frictionGeometry(side: number, phase: number) {
  const width = side === 0 ? 100 : 60;
  const height = side === 0 ? 45 : 75;
  const left = 55 + 200 * phase;
  const right = left + width;
  const pullY = FRICTION_FLOOR - height / 2;
  return {
    width,
    height,
    left,
    right,
    top: FRICTION_FLOOR - height,
    pullY,
    meterX: right + 28,
  };
}
