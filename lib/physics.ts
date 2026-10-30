import type { Answers, Experiment, Field, LabContent } from "./types";
import {
  emptyRampInquiry,
  isRampInquiry,
  rampInquiryGaps,
} from "./ramp-inquiry";
export function number(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const clean = String(value).trim().replace(/\s/g, "").replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(clean))
    return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}
export function expected(
  field: Field,
  row: Record<string, string>,
): number | null {
  const f = field.calculated;
  if (!f) return null;
  const v = f.args.map((a) => number(row[a]));
  if (v.some((x) => x === null)) return null;
  const ns = v as number[];
  let result: number;
  switch (f.op) {
    case "divide":
      result = ns[0] / ns[1];
      break;
    case "multiply":
      result = ns.reduce((a, b) => a * b, 1);
      break;
    case "subtract":
      result = ns[0] - ns[1];
      break;
    case "sum":
      result = ns.reduce((a, b) => a + b, 0);
      break;
    case "hydro":
      result = ns[0] / (ns[0] - ns[1]);
      break;
  }
  result *= f.factor ?? 1;
  return Number.isFinite(result) ? result : null;
}
export function matches(actual: string, want: number): boolean {
  const v = number(actual);
  if (v === null) return false;
  // Half a displayed decimal unit, bounded to avoid accepting coarse rounding.
  const dec =
    actual.trim().replace(",", ".").split(".")[1]?.split(/[eE]/)[0].length ?? 0;
  const rounding = 0.5 * Math.pow(10, -dec);
  return (
    Math.abs(v - want) <=
    Math.max(
      Math.abs(want) * 0.005,
      Math.min(rounding, Math.abs(want) * 0.03),
      1e-9,
    )
  );
}
export function fieldFeedback(
  field: Field,
  row: Record<string, string>,
): string | null {
  const raw = row[field.key];
  if (!raw?.trim()) return null;
  if (field.type === "text") return null;
  const val = number(raw);
  if (val === null) return "Введіть число. Можна використовувати кому.";
  if (field.positive && val <= 0) return "Значення має бути додатним.";
  if (field.integer && !Number.isInteger(val))
    return "Кількість повних циклів має бути цілою.";
  if (field.calculated) {
    const want = expected(field, row);
    if (want === null || want <= 0)
      return "Перевірте вихідні вимірювання та знаменник.";
    if (!matches(raw, want)) return "Перевірте формулу, одиниці й округлення.";
  }
  return null;
}
export function emptyAnswers(content: LabContent): Answers {
  return {
    ...(isRampInquiry(content) ? { rampInquiry: emptyRampInquiry() } : {}),
    prediction: "",
    experiments: Object.fromEntries(
      content.experiments.map((e) => [
        e.id,
        e.rows.map((_, i) => ({ ...e.defaults?.[i] })),
      ]),
    ),
    questions: content.questions.map(() => ""),
    conclusion: ["", "", "", ""],
    creative: "",
    source: "",
    diagram: content.diagram
      ? Array.from({ length: 3 }, () => ({
          gravity: 0,
          buoyancy: 0,
          support: 0,
          state: "",
        }))
      : undefined,
  };
}
export function completeness(content: LabContent, a: Answers): string[] {
  const errors: string[] = [];
  if (isRampInquiry(content)) {
    errors.push(...rampInquiryGaps(a));
    const repeats = a.rampInquiry?.repeats;
    if (
      repeats &&
      [repeats.distance, ...repeats.times, repeats.summary].some((x) =>
        x.trim(),
      )
    ) {
      if (number(repeats.distance) === null || number(repeats.distance)! <= 0)
        errors.push("Повторна перевірка: введіть додатний шлях у метрах.");
      repeats.times.forEach((t, i) => {
        if (number(t) === null || number(t)! <= 0)
          errors.push(
            `Повторна перевірка ${i + 1}: введіть додатний час у секундах.`,
          );
      });
    }
  }
  if (!a.prediction?.trim()) errors.push("Запишіть прогноз.");
  for (const e of content.experiments)
    for (let i = 0; i < e.rows.length; i++)
      for (const f of e.fields) {
        const raw = a.experiments?.[e.id]?.[i]?.[f.key];
        if (!raw?.trim()) errors.push(`${e.title}, ${e.rows[i]}: ${f.label}.`);
        else if (f.type !== "text") {
          const v = number(raw);
          if (
            v === null ||
            (f.positive && v <= 0) ||
            (f.integer && !Number.isInteger(v))
          )
            errors.push(`${e.rows[i]}: перевірте поле «${f.label}».`);
        }
      }
  content.questions.forEach((_, i) => {
    if (!a.questions?.[i]?.trim())
      errors.push(`Дайте відповідь на запитання ${i + 1}.`);
  });
  for (let i = 0; i < 4; i++)
    if (!a.conclusion?.[i]?.trim())
      errors.push(`Заповніть частину висновку ${i + 1}.`);
  if (content.diagram) {
    if (a.diagram?.length !== 3) errors.push("Побудуйте три схеми сил.");
    else
      a.diagram.forEach((d, i) => {
        if (!d.state.trim() || d.gravity <= 0 || d.buoyancy <= 0)
          errors.push(`Схема сил ${i + 1}: задайте сили та опишіть стан тіла.`);
      });
  }
  return errors;
}
export function checkCalculations(content: LabContent, a: Answers) {
  return content.experiments.flatMap((e) =>
    e.rows.flatMap((_, i) =>
      e.fields
        .filter((f) => f.calculated)
        .map((f) => ({
          experiment: e.title,
          row: i + 1,
          field: f.label,
          actual: a.experiments?.[e.id]?.[i]?.[f.key] ?? "",
          expected: expected(f, a.experiments?.[e.id]?.[i] ?? {}),
          error: fieldFeedback(f, a.experiments?.[e.id]?.[i] ?? {}),
        })),
    ),
  );
}
export function progress(content: LabContent, a: Answers) {
  const total =
    1 +
    content.experiments.reduce(
      (n, e) => n + e.rows.length * e.fields.length,
      0,
    ) +
    content.questions.length +
    4 +
    (isRampInquiry(content) ? 10 : 0) +
    (content.diagram ? 3 : 0);
  return Math.max(
    0,
    Math.round((100 * (total - completeness(content, a).length)) / total),
  );
}
export function axisField(e: Experiment, key: string) {
  const f = e.fields.find((x) => x.key === key);
  return f ? `${f.label}${f.unit ? " (" + f.unit + ")" : ""}` : key;
}
