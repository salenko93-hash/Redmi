/** Fixed visual scale shared by the element, length brackets and centimetre ruler. */
export const ELASTIC_ANCHOR = 102;
export const ELASTIC_PX_PER_CM = 6.8;
export const ELASTIC_AXIS = 295;
export const ELASTIC_SCENE_HEIGHT = 610;
export const elasticCoordinate = (value: number) => Number(value.toFixed(4));
export function elasticTransition(
  start: number,
  target: number,
  phase: number,
) {
  return start + (target - start) * Math.max(0, Math.min(1, phase));
}
export function elasticGeometry(
  initialCm: number,
  extensionM: number,
  phase: number,
  startExtensionM = 0,
) {
  const restEnd = ELASTIC_ANCHOR + initialCm * ELASTIC_PX_PER_CM;
  const extension = elasticTransition(startExtensionM, extensionM, phase);
  const end = restEnd + extension * 100 * ELASTIC_PX_PER_CM;
  return { restEnd, end, length: end - ELASTIC_ANCHOR };
}
/** A fixed number of wire turns: load changes pitch, never the number of coils. */
export function elasticCoils(top: number, end: number, axis = ELASTIC_AXIS) {
  const turns = 12,
    lead = 8,
    span = end - top - 2 * lead,
    radius = 12;
  const point = (angle: number) =>
    [
      elasticCoordinate(axis + radius * Math.sin(angle)),
      elasticCoordinate(
        top +
          lead +
          (span * angle) / (turns * 2 * Math.PI) +
          2 * Math.cos(angle),
      ),
    ] as const;
  const segments = Array.from({ length: turns * 2 }, (_, half) =>
    Array.from({ length: 13 }, (_, step) => point((half + step / 12) * Math.PI))
      .map((p) => p.join(","))
      .join(" "),
  );
  return { segments, turns, start: point(0), end: point(turns * 2 * Math.PI) };
}
export function elasticCordWidth(initialCm: number, lengthPx: number) {
  return elasticCoordinate(
    8 * Math.sqrt((initialCm * ELASTIC_PX_PER_CM) / lengthPx),
  );
}
