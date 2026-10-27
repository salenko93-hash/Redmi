/** Orthographic views of the same circular kinematics; display mode never changes measurements. */
export type RotationView = "perspective" | "top";
export const ROTATION_SCALE = 400;
export const ROTATION_CENTER = { x: 215, y: 233 };
export const ROTATION_BALL_RADIUS = 12;
export function rotationGeometry(
  radius: number,
  cycles: number,
  phase: number,
  view: RotationView = "perspective",
) {
  const fraction = Math.max(0, Math.min(1, phase)),
    r = radius * ROTATION_SCALE;
  const squash = view === "top" ? 1 : 0.68,
    theta = fraction * cycles * Math.PI * 2;
  const cx = ROTATION_CENTER.x,
    cy = ROTATION_CENTER.y;
  const point = (angle: number, distance = r) => ({
    x: cx + distance * Math.cos(angle),
    y: cy + distance * squash * Math.sin(angle),
  });
  const ball = point(theta),
    dx = ball.x - cx,
    dy = ball.y - cy,
    projectedRadius = Math.hypot(dx, dy);
  const end = {
    x: ball.x - (ROTATION_BALL_RADIUS * dx) / projectedRadius,
    y: ball.y - (ROTATION_BALL_RADIUS * dy) / projectedRadius,
  };
  return {
    r,
    cx,
    cy,
    squash,
    theta,
    fraction,
    ball,
    end,
    point,
    completed: Math.min(cycles, Math.floor(fraction * cycles + 1e-8)),
    planeTransform: `translate(0 ${cy * (1 - squash)}) scale(1 ${squash})`,
  };
}
