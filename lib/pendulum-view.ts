/** Small-angle pendulum geometry. Length is measured from the suspension point to the bob centre. */
export const PENDULUM_SCALE = 230;
export const PENDULUM_PIVOT = { x: 250, y: 92 };
export const PENDULUM_BOB_RADIUS = 10; // Schematic bob; displayed radius does not define its physical size.
export const PENDULUM_COORDINATE_SCALE = 3000; // Separate, explicitly enlarged arc-coordinate ruler.
export function pendulumGeometry(
  length: number,
  amplitude: number,
  cycles: number,
  phase: number,
) {
  const fraction = Math.max(0, Math.min(1, phase)),
    coordinate = amplitude * Math.cos(fraction * cycles * 2 * Math.PI),
    angle = coordinate / length;
  const displayLength = length * PENDULUM_SCALE,
    { x: px, y: py } = PENDULUM_PIVOT;
  const point = (theta: number, radius = displayLength) => ({
    x: px + radius * Math.sin(theta),
    y: py + radius * Math.cos(theta),
  });
  return {
    fraction,
    coordinate,
    angle,
    displayLength,
    pivot: PENDULUM_PIVOT,
    bob: point(angle),
    attachment: point(angle, displayLength - PENDULUM_BOB_RADIUS),
    left: point(-amplitude / length),
    right: point(amplitude / length),
    equilibrium: point(0),
    completed: Math.min(cycles, Math.floor(fraction * cycles + 1e-8)),
    coordinateX: px + coordinate * PENDULUM_COORDINATE_SCALE,
    amplitudeLeft: px - amplitude * PENDULUM_COORDINATE_SCALE,
    amplitudeRight: px + amplitude * PENDULUM_COORDINATE_SCALE,
  };
}
