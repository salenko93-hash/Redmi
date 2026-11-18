import type { Answers, LabContent } from "./types";
import { number } from "./measurement-number";

export type MethodWarning = {
  id: string;
  experimentId: string;
  message: string;
};
export const hasRevisedMethod = (c: LabContent) =>
  c.methodology?.version === "2026-11";
export function methodWarnings(c: LabContent, a: Answers): MethodWarning[] {
  if (!hasRevisedMethod(c)) return [];
  const warnings: MethodWarning[] = [];
  const add = (experimentId: string, id: string, message: string) =>
    warnings.push({ experimentId, id, message });
  if (c.methodology!.lab === 1) {
    const paths = (a.experiments?.speed ?? [])
      .map((r) => number(r.l))
      .filter((v): v is number => v !== null);
    if (new Set(paths).size < paths.length)
      add(
        "speed",
        "same-path",
        "В основній таблиці повторюється той самий шлях. Для порівняння умов потрібні різні шляхи; повтори за одного шляху записуйте окремо. Або поясніть свій вибір.",
      );
    (a.repeatMeasurements?.speed ?? []).forEach((r, i) => {
      const path = number(r.path),
        main = number(a.experiments?.speed?.[i]?.l);
      if (
        r.values.some((v) => v.trim()) &&
        path !== null &&
        main !== null &&
        Math.abs(path - main) > 1e-8
      )
        add(
          "speed",
          `repeat-path-${i}`,
          `Дослід ${i + 1}: шлях у повторах відрізняється від основного рядка. Не використовуйте середній час іншого шляху без пояснення; перевірте відповідність даних.`,
        );
    });
    const records = (a.simulationRecords ?? []).filter(
      (r) => r.experimentId === "speed",
    );
    if (
      ["angle", "material", "diameter", "airResistance"].some(
        (k) => new Set(records.map((r) => r.parameters[k] ?? 0)).size > 1,
      )
    )
      add(
        "speed",
        "conditions",
        "У перенесених показах змінено не лише шлях, а й кульку або умови руху. Це ускладнює порівняння. Повторіть за сталих умов або поясніть обмеження висновку.",
      );
  }
  if (c.methodology!.lab === 9) {
    const u = number(a.methodNotes?.["hydro.uncertainty"]);
    (a.experiments?.hydro ?? []).forEach((r, i) => {
      const p1 = number(r.P1),
        p2 = number(r.P2);
      if (p1 === null || p2 === null) return;
      if (!(p1 > p2 && p2 > 0))
        add(
          "hydro",
          `order-${i}`,
          `Тіло ${i + 1}: для цього способу потрібні 0<P₂<P₁. Перевірте підвіс, занурення, нуль і запис показів; збережені сумнівні дані поясніть.`,
        );
      else if (u !== null && u > 0 && p1 - p2 <= 2 * u + 1e-9)
        add(
          "hydro",
          `resolution-${i}`,
          `Тіло ${i + 1}: різниця показів не перевищує суму оцінок невизначеності двох відліків (2u). Густину за цими даними визначено ненадійно. Опишіть повторну перевірку або межі висновку.`,
        );
    });
  }
  if (c.methodology!.lab === 10) {
    const rows = a.experiments?.floating ?? [];
    const volumes = rows
      .map((r) => number(r.V))
      .filter((v): v is number => v !== null && v > 0);
    if (volumes.some((v) => Math.abs(v - volumes[0]) > 1e-6))
      add(
        "floating",
        "volume",
        "Зовнішній об’єм змінюється між рядками. Для тієї самої герметичної пробірки він має бути сталим. Перевірте вимірювання або поясніть, чому умови змінилися.",
      );
    rows.forEach((r, i) => {
      const m = number(r.m),
        v = number(r.V);
      if (m === null || v === null || m <= 0 || v <= 0) return;
      const d = m / v - 1;
      if (!(i === 0 ? d > 1e-8 : i === 1 ? Math.abs(d) <= 1e-8 : d < -1e-8))
        add(
          "floating",
          `state-${i}`,
          `${c.experiments[0].rows[i]}: записані маса й об’єм не дають запланованого співвідношення густин із водою. Повторіть дослід або опишіть фактичний стан, точність вимірювань і можливі причини. Для реальної нейтральності врахуйте невизначеність.`,
        );
    });
  }
  return warnings;
}

/** Require acknowledgement of uncertainty, never a prescribed experimental outcome or grade. */
export function methodGaps(c: LabContent, a: Answers): string[] {
  if (!hasRevisedMethod(c)) return [];
  const gaps: string[] = [];
  if (c.methodology!.lab === 9) {
    for (const [key, label] of [
      ["step", "ціну поділки"],
      ["uncertainty", "оцінку невизначеності одного відліку"],
    ]) {
      const n = number(a.methodNotes?.[`hydro.${key}`]);
      if (n === null || n <= 0)
        gaps.push(
          `Динамометр: запишіть додатне значення для поля «${label}» у Н.`,
        );
    }
  }
  for (const e of c.experiments) {
    if (
      methodWarnings(c, a).some((w) => w.experimentId === e.id) &&
      !a.methodNotes?.[`${e.id}.review`]?.trim()
    )
      gaps.push(
        `${e.title}: поясніть попередження про умови досліду або повторіть вимірювання.`,
      );
    for (const [i, repeats] of (a.repeatMeasurements?.[e.id] ?? []).entries()) {
      if (!repeats.values.some((v) => v.trim())) continue;
      if (i >= e.rows.length) {
        gaps.push("Повтори: невідомий рядок таблиці.");
        continue;
      }
      const path = number(repeats.path);
      if (path === null || path <= 0)
        gaps.push(
          `${e.rows[i]}: запишіть додатний шлях для повторів у метрах.`,
        );
      repeats.values.forEach((v, j) => {
        const n = number(v);
        if (n === null || n <= 0)
          gaps.push(
            `${e.rows[i]}, повтор ${j + 1}: запишіть додатний час у секундах.`,
          );
      });
    }
  }
  return gaps;
}
