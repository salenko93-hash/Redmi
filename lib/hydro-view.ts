export const HYDRO_ZERO = 90;
export const HYDRO_PX_PER_NEWTON = 12;
export const HYDRO_BODY_OFFSET = 185;
export const HYDRO_GAUGE_END = 230;
export const HYDRO_SCENE_HEIGHT = 800;
export const HYDRO_CM_TO_PX = 11;
export const HYDRO_CUP_WIDTH = 210;
export const HYDRO_CUP_DEPTH = 180;
export const hydroCoordinate = (value: number) => Number(value.toFixed(4));
export function hydroGeometry(
  volumeCm3: number,
  airForce: number,
  waterForce: number,
  phase: number,
) {
  const progress = Math.max(0, Math.min(1, phase));
  const size = Math.cbrt(volumeCm3) * HYDRO_CM_TO_PX;
  const emptySurface = 470 - 205 * progress;
  const buoyancy = airForce - waterForce;
  // A cylindrical vessel of fixed cross-section. Displaced sample volume raises
  // the free surface while the stand lifts the vessel. The sample is a cube.
  const cupAreaCm2 = Math.PI * (HYDRO_CUP_WIDTH / HYDRO_CM_TO_PX / 2) ** 2;
  const fullRise = (volumeCm3 / cupAreaCm2) * HYDRO_CM_TO_PX;
  // Solve static spring + buoyancy + conservation of water simultaneously.
  const fraction = Math.max(
    0,
    Math.min(
      1,
      (HYDRO_ZERO +
        HYDRO_PX_PER_NEWTON * airForce +
        HYDRO_BODY_OFFSET +
        size -
        emptySurface) /
        (size + HYDRO_PX_PER_NEWTON * buoyancy - fullRise),
    ),
  );
  const force = airForce - buoyancy * fraction;
  const pointer = HYDRO_ZERO + force * HYDRO_PX_PER_NEWTON;
  return {
    size,
    surface: emptySurface - fullRise * fraction,
    emptySurface,
    cupAreaCm2,
    rim: emptySurface - 16,
    bottom: emptySurface + HYDRO_CUP_DEPTH,
    force,
    fraction,
    pointer,
    bodyTop: pointer + HYDRO_BODY_OFFSET,
  };
}
