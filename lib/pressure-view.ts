export const PRESSURE_SCALE = 1200;
export const PRESSURE_SCENE_HEIGHT = 630;
export const PRESSURE_BASE = 285;
export const pressureCoordinate = (value: number) => Number(value.toFixed(4));
// An observation cursor, not a moving body or a transient contact force.
export function pressureObservation(a: number, b: number, phase: number) {
  const progress = Math.max(0, Math.min(1, phase));
  return {
    x: pressureCoordinate(a * PRESSURE_SCALE * progress),
    y: pressureCoordinate(b * PRESSURE_SCALE * progress),
  };
}
export function pressureGeometry(
  l: number,
  d: number,
  h: number,
  face: number,
) {
  const [a, b, height] = [
    [l, d, h],
    [l, h, d],
    [d, h, l],
  ][face];
  return {
    a,
    b,
    height,
    width: a * PRESSURE_SCALE,
    depth: b * PRESSURE_SCALE,
    vertical: height * PRESSURE_SCALE,
    dx: b * PRESSURE_SCALE * 0.55,
    dy: b * PRESSURE_SCALE * 0.32,
  };
}
