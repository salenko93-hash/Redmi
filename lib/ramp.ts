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
  travelFraction = Math.min(1, Math.max(0, phase)) ** 2,
) {
  const length = RAMP_LENGTH * RAMP_SCALE,
    travel = distance * RAMP_SCALE;
  const radians = (angle * Math.PI) / 180,
    endX = 530,
    endY = 295;
  const startX = endX - length * Math.cos(radians),
    startY = endY - length * Math.sin(radians);
  const radius = (diameterMM / 2000) * RAMP_SCALE * RAMP_BALL_MAGNIFICATION;
  const fraction = Math.min(1, Math.max(0, travelFraction));
  const ballX = travel * fraction,
    ballY = -radius - 2;
  const rotations = (distance * fraction) / ((Math.PI * diameterMM) / 1000);
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

export const RAMP_AIR_DENSITY = 1.2; // kg/m³, approximate room-temperature still air.
export const RAMP_DRAG_COEFFICIENT = 0.47; // Constant sphere Cd: an educational approximation.
/** Rolling solid sphere: (m + I/R²) dv/dt = mg sin(alpha) - k v², I = 2mR²/5. */
export function rampMotion(
  distance: number,
  angle: number,
  material = 0,
  diameterMM = 20,
  airResistance = 0,
  gravity = 10,
) {
  const ball = rampBallProperties(material, diameterMM),
    a = (5 / 7) * gravity * Math.sin((angle * Math.PI) / 180),
    area = Math.PI * ball.radius ** 2,
    drag =
      airResistance === 1
        ? 0.5 * RAMP_AIR_DENSITY * RAMP_DRAG_COEFFICIENT * area
        : 0,
    b = drag / (1.4 * ball.mass),
    idealTime = Math.sqrt((2 * distance) / a),
    time =
      b === 0
        ? idealTime
        : Math.asinh(Math.sqrt(Math.expm1(2 * b * distance))) /
          Math.sqrt(a * b);
  const position = (elapsed: number) => {
    const t = Math.max(0, Math.min(time, elapsed));
    if (t === time) return distance;
    if (b === 0) return (a * t * t) / 2;
    const z = Math.sqrt(a * b) * t;
    return Math.log1p(2 * Math.sinh(z / 2) ** 2) / b;
  };
  const velocity = (elapsed: number) => {
    const t = Math.max(0, Math.min(time, elapsed));
    return b === 0 ? a * t : Math.sqrt(a / b) * Math.tanh(Math.sqrt(a * b) * t);
  };
  return { a, b, drag, time, idealTime, position, velocity };
}
