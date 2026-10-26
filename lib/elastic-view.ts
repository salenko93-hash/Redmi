/** Fixed visual scale shared by the element, length brackets and centimetre ruler. */
export const ELASTIC_ANCHOR = 52;
export const ELASTIC_PX_PER_CM = 5.8;
export function elasticGeometry(
  initialCm: number,
  extensionM: number,
  phase: number,
) {
  const restEnd = ELASTIC_ANCHOR + initialCm * ELASTIC_PX_PER_CM;
  const end = restEnd + phase * extensionM * 100 * ELASTIC_PX_PER_CM;
  return { restEnd, end, length: end - ELASTIC_ANCHOR };
}
