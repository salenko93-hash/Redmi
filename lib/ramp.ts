/** Solid homogeneous spheres. Density values are representative classroom values, kg/m³. */
export const rampMaterials = [
  {
    name: "Сталева кулька",
    shortName: "Сталь",
    density: 7800,
    light: "#f7fbff",
    middle: "#b5c6d2",
    dark: "#475b6b",
    edge: "#3d5261",
    mark: "#314958",
  },
  {
    name: "Пластмасова кулька (поліпропілен)",
    shortName: "Пластмаса · PP",
    density: 900,
    light: "#c1ecff",
    middle: "#38a7d3",
    dark: "#126486",
    edge: "#155b78",
    mark: "#e4f7ff",
  },
] as const;
export const RAMP_LENGTH = 2;
export const RAMP_SCALE = 200;
// Same magnification for both materials; all diameters remain proportional.
export const RAMP_BALL_MAGNIFICATION = 4;
export function rampBallProperties(material = 0, diameterMM = 20) {
  const selected = rampMaterials[material] ?? rampMaterials[0];
  const diameter = diameterMM / 1000,
    radius = diameter / 2,
    volume = (Math.PI * diameter ** 3) / 6;
  return {
    diameter,
    radius,
    volume,
    density: selected.density,
    mass: selected.density * volume,
  };
}
export function rampGeometry(
  distance: number,
  angle: number,
  diameterMM: number,
  phase: number,
) {
  const length = RAMP_LENGTH * RAMP_SCALE,
    travel = distance * RAMP_SCALE;
  const radians = (angle * Math.PI) / 180,
    endX = 530,
    endY = 295;
  const startX = endX - length * Math.cos(radians),
    startY = endY - length * Math.sin(radians);
  const radius = (diameterMM / 2000) * RAMP_SCALE * RAMP_BALL_MAGNIFICATION;
  const fraction = Math.min(1, Math.max(0, phase));
  const ballX = travel * fraction ** 2,
    ballY = -radius - 2;
  const rotations =
    (distance * fraction ** 2) / ((Math.PI * diameterMM) / 1000);
  const stopX = travel + radius,
    stopHeight = Math.max(29, radius * 2 + 6);
  const point = (x: number, y: number) => ({
    x: startX + x * Math.cos(radians) - y * Math.sin(radians),
    y: startY + x * Math.sin(radians) + y * Math.cos(radians),
  });
  return {
    length,
    railLength: length + 40,
    travel,
    radians,
    startX,
    startY,
    endX,
    endY,
    radius,
    ballX,
    ballY,
    rotations,
    rotation: (rotations * 360) % 360,
    stopX,
    stopHeight,
    ball: point(ballX, ballY),
    start: point(0, ballY),
    finish: point(travel, ballY),
    stopTop: point(stopX + 6, -stopHeight),
    point,
  };
}
