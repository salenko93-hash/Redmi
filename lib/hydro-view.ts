export const HYDRO_ZERO = 80;
export const HYDRO_PX_PER_NEWTON = 8;
export function hydroGeometry(
  volumeCm3: number,
  airForce: number,
  waterForce: number,
  phase: number,
) {
  const size = Math.cbrt(volumeCm3) * 11;
  const surface = 355 - 165 * phase;
  const buoyancy = airForce - waterForce;
  // Static balance while the beaker rises around a uniform prismatic sample.
  const fraction = Math.max(
    0,
    Math.min(
      1,
      (HYDRO_ZERO + HYDRO_PX_PER_NEWTON * airForce + 130 + size - surface) /
        (size + HYDRO_PX_PER_NEWTON * buoyancy),
    ),
  );
  const force = airForce - buoyancy * fraction;
  const pointer = HYDRO_ZERO + force * HYDRO_PX_PER_NEWTON;
  return {
    size,
    surface,
    bottom: surface + 165,
    force,
    fraction,
    pointer,
    bodyTop: pointer + 130,
  };
}
