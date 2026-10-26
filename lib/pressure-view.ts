export const PRESSURE_SCALE = 1200;
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
