export const BALANCE_TOLERANCE_GRAMS = 0.005;
export const BALANCE_PIVOT = { x: 300, y: 138 };
export const BALANCE_ARM = 170;
export const BALANCE_PAN_DROP = 115;
export function balanceGeometry(difference: number) {
  const balanced = Math.abs(difference) < BALANCE_TOLERANCE_GRAMS;
  const angle =
    ((balanced ? 0 : Math.max(-10, Math.min(10, -difference))) * Math.PI) / 180;
  const dx = BALANCE_ARM * Math.cos(angle),
    dy = BALANCE_ARM * Math.sin(angle);
  return {
    angle,
    balanced,
    state: balanced ? "balanced" : difference > 0 ? "left" : "right",
    left: { x: BALANCE_PIVOT.x - dx, y: BALANCE_PIVOT.y - dy },
    right: { x: BALANCE_PIVOT.x + dx, y: BALANCE_PIVOT.y + dy },
    leftPan: BALANCE_PIVOT.y - dy + BALANCE_PAN_DROP,
    rightPan: BALANCE_PIVOT.y + dy + BALANCE_PAN_DROP,
    pointer: {
      x: BALANCE_PIVOT.x + 62 * Math.sin(angle),
      y: BALANCE_PIVOT.y - 62 * Math.cos(angle),
    },
  };
}
/** Dense selections use smaller grouped glyphs. Counts and denominations are never truncated. */
export function balanceLoadPositions(count: number) {
  if (count <= 3)
    return Array.from({ length: count }, (_, i) => ({
      x: (i - (count - 1) / 2) * 39,
      y: -1,
      scale: 0.9,
      compact: false,
    }));
  // One row rests on the pan. Dense selections use two shallow perspective rows,
  // rather than suspending weights above one another in mid-air.
  const rows = count <= 6 ? [6] : [6, 6],
    spacing = count <= 6 ? [22] : [20, 20],
    height = count <= 6 ? [0] : [4, -2],
    scales = count <= 6 ? [0.8] : [0.55, 0.6];
  let remaining = count;
  return rows.flatMap((capacity, row) => {
    const n = Math.min(capacity, remaining);
    remaining -= n;
    return Array.from({ length: n }, (_, i) => ({
      x: (i - (n - 1) / 2) * spacing[row],
      y: -1 - height[row],
      scale: scales[row],
      compact: true,
    }));
  });
}
