export const FLOATING_SURFACE = 150;
export const FLOATING_FLOOR = 390;
export const FLOATING_SCENE_HEIGHT = 640;
export const FLOATING_FORCE_ORIGIN = 355;
export const FLOATING_CUP_RADIUS = 80;
export const FLOATING_PIXEL_VOLUME = (Math.PI * 18 ** 2 * (110 - 18 / 3)) / 50;
export const floatingCoordinate = (v: number) => Number(v.toFixed(4));
// A stated model for dry, loose sand and the space taken by glass and stopper.
export const floatingSandCapacity = (volume: number) =>
  Math.min(80, Math.floor((volume - 10) * 1.6));
export function floatingSandGeometry(
  volume: number,
  mass: number,
  radius: number,
  height: number,
) {
  const scale = Math.cbrt((volume - 10) / volume);
  const innerRadius = radius * scale,
    innerHeight = height * scale;
  return {
    radius: innerRadius,
    height: innerHeight,
    depth: tubeDepth(
      Math.min(1, mass / ((volume - 10) * 1.6)),
      innerRadius,
      innerHeight,
    ),
  };
}
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
  const q = floatingCoordinate;
  return `M${q(cx - radius)} ${q(top)}H${q(cx + radius)}V${q(top + height - radius)}A${q(radius)} ${q(radius)} 0 0 1 ${q(cx - radius)} ${q(top + height - radius)}Z`;
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
  const progress = Math.max(0, Math.min(1, phase));
  const fullRise =
    (volume * FLOATING_PIXEL_VOLUME) / (Math.PI * FLOATING_CUP_RADIUS ** 2);
  const start = FLOATING_SURFACE - fullRise + 35;
  const final =
    state > 0
      ? FLOATING_FLOOR - height
      : state === 0
        ? start
        : FLOATING_SURFACE -
          fullRise * fraction -
          height +
          tubeDepth(fraction, radius, height);
  const top = start + progress * (final - start);
  let low = FLOATING_SURFACE - fullRise,
    high = FLOATING_SURFACE;
  for (let i = 0; i < 45; i++) {
    const mid = (low + high) / 2;
    const wet = tubeFraction(top + height - mid, radius, height);
    if (mid - FLOATING_SURFACE + fullRise * wet > 0) high = mid;
    else low = mid;
  }
  const surface = (low + high) / 2;
  const immersed = tubeFraction(top + height - surface, radius, height);
  return {
    radius,
    height,
    top,
    bottom: top + height,
    surface,
    immersed,
    onBottom: state > 0 && progress === 1,
  };
}
