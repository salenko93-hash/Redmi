/** Only these experiments measure elapsed time; the remaining models show static readings. */
export function usesManualTiming(labNumber: number) {
  return labNumber >= 1 && labNumber <= 3;
}

/** Keep model provenance intact, but never fill a pupil's stopwatch measurement from it. */
export function transferredMeasurements(
  labNumber: number,
  readings: Record<string, string>,
  previous: Record<string, string> = {},
) {
  const next = { ...readings };
  if (usesManualTiming(labNumber)) next.t = previous.t ?? "";
  return next;
}
