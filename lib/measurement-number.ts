export function number(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const clean = String(value).trim().replace(/\s/g, "").replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(clean))
    return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}
