export const FRICTION_FLOOR = 280;
export const FRICTION_SCENE_HEIGHT = 630;
export const FRICTION_ROPE_LENGTH = 24;
export const FRICTION_METER_PX_PER_N = 16;
export const frictionCoordinate = (value: number) => Number(value.toFixed(4));
export function frictionMeterGeometry(force: number) {
  const caseX = 18 + force * FRICTION_METER_PX_PER_N;
  return {
    caseX,
    pointerX: 128,
    zeroX: caseX + 110,
    anchorX: caseX + 132,
    right: caseX + 178,
  };
}
export function frictionGeometry(side: number, phase: number) {
  const width = side === 0 ? 108 : 54;
  const height = side === 0 ? 54 : 108;
  const left = 80 + 125 * Math.max(0, Math.min(1, phase));
  const right = left + width;
  const pullY = FRICTION_FLOOR - height / 2;
  return {
    width,
    height,
    left,
    right,
    top: FRICTION_FLOOR - height,
    pullY,
    meterX: right + FRICTION_ROPE_LENGTH,
  };
}
