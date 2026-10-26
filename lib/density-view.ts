/** Geometry of a schematic prism-shaped rock and a calibrated cylinder. */
export const CYLINDER_BASE = 300;
export const ML_TO_PIXELS = 0.75;
export const rockOutline: readonly (readonly [number, number])[] = [
  [-0.9, -1],
  [0.7, -0.95],
  [1, -0.6],
  [0.95, 0.8],
  [0.5, 1],
  [-0.8, 0.9],
  [-1, 0.4],
  [-1, -0.6],
];
type Point = [number, number];
function area(points: Point[]) {
  return (
    Math.abs(
      points.reduce((sum, p, i) => {
        const q = points[(i + 1) % points.length];
        return sum + p[0] * q[1] - q[0] * p[1];
      }, 0),
    ) / 2
  );
}
function submergedFraction(centerY: number, radius: number, surface: number) {
  const points: Point[] = rockOutline.map(([x, y]) => [
    x * radius,
    centerY + y * radius,
  ]);
  const clipped: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    const aWet = a[1] >= surface,
      bWet = b[1] >= surface;
    if (aWet) clipped.push(a);
    if (aWet !== bWet)
      clipped.push([
        a[0] + ((b[0] - a[0]) * (surface - a[1])) / (b[1] - a[1]),
        surface,
      ]);
  }
  return clipped.length < 3 ? 0 : area(clipped) / area(points);
}
export function densityImmersion(
  water: number,
  volume: number,
  size: number,
  phase: number,
) {
  const radius = 22 * size;
  const centerY =
    73 + radius + phase * (CYLINDER_BASE - radius - 5 - (73 + radius));
  let low = water,
    high = water + volume;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const displaced =
      volume *
      submergedFraction(centerY, radius, CYLINDER_BASE - mid * ML_TO_PIXELS);
    if (mid - water < displaced) low = mid;
    else high = mid;
  }
  const reading =
    phase <= 0 ? water : phase >= 1 ? water + volume : (low + high) / 2;
  return {
    radius,
    centerY,
    reading,
    surface: CYLINDER_BASE - reading * ML_TO_PIXELS,
  };
}
