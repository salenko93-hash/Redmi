export const FLOATING_SURFACE = 150;
export const FLOATING_FLOOR = 390;
/** Submerged volume fraction of a vertical cylinder with a hemispherical bottom. */
export function tubeFraction(depth: number, radius: number, height: number) {
  const d = Math.max(0, Math.min(height, depth));
  const total = radius * radius * (height - radius / 3);
  return d <= radius
    ? (d * d * (radius - d / 3)) / total
    : ((2 / 3) * radius ** 3 + radius * radius * (d - radius)) / total;
}
export function tubeDepth(fraction: number, radius: number, height: number) {
  let lo = 0,
    hi = height;
  for (let i = 0; i < 45; i++) {
    const mid = (lo + hi) / 2;
    if (tubeFraction(mid, radius, height) < fraction) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
export function tubePath(
  cx: number,
  top: number,
  radius: number,
  height: number,
) {
  return `M${cx - radius} ${top}H${cx + radius}V${top + height - radius}A${radius} ${radius} 0 0 1 ${cx - radius} ${top + height - radius}Z`;
}
export function floatingGeometry(
  volume: number,
  fraction: number,
  state: number,
  phase: number,
) {
  const s = Math.cbrt(volume / 50),
    radius = 18 * s,
    height = 110 * s;
  const start = FLOATING_SURFACE + 35;
  const final =
    state > 0
      ? FLOATING_FLOOR - height
      : state === 0
        ? start
        : FLOATING_SURFACE - height + tubeDepth(fraction, radius, height);
  const top = start + phase * (final - start);
  const immersed = tubeFraction(
    top + height - FLOATING_SURFACE,
    radius,
    height,
  );
  return {
    radius,
    height,
    top,
    bottom: top + height,
    immersed,
    onBottom: state > 0 && phase === 1,
  };
}
