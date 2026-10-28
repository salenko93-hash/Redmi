/** Keep editor values on the same step grid used by model validation. */
export function controlValue(
  raw: string,
  min: number,
  max: number,
  step: number,
) {
  if (!raw.trim()) return null;
  const value = Number(raw.replace(",", "."));
  if (!Number.isFinite(value) || value < min || value > max) return null;
  const position = Number(((value - min) / step).toPrecision(12));
  const snapped = min + Math.round(position) * step;
  return Number(Math.min(max, Math.max(min, snapped)).toPrecision(12));
}
