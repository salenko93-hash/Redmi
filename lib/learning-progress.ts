import { z } from "zod";
import { checkCalculations, expected, fieldFeedback, number } from "./physics";
import type { Answers, LabContent } from "./types";

export const LEARNING_RETENTION_DAYS = 180;
export const LEARNING_EVENT_LIMIT = 2000;
export const LEARNING_RULE_VERSION = "1.0";
export const learningCutoff = () =>
  new Date(Date.now() - LEARNING_RETENTION_DAYS * 86400000);

const base = {
  eventId: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[\w:.-]+$/),
  occurredAt: z.iso.datetime(),
};
const parameters = z
  .record(z.string().max(50), z.number().finite().min(-1e6).max(1e6))
  .refine((p) => Object.keys(p).length <= 32);
const experimentId = z.string().min(1).max(80);
export const learningEventSchema = z.discriminatedUnion("kind", [
  z
    .object({
      ...base,
      kind: z.literal("RUN_COMPLETED"),
      experimentId,
      payload: z.object({ parameters }).strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      kind: z.enum(["RUN_STARTED", "RUN_PAUSED", "RESET", "READING_RECORDED"]),
      experimentId,
      payload: z.object({}).strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal("HELP_REQUESTED"),
      payload: z.object({}).strict(),
    })
    .strict(),
]);
export type LearningInput = z.infer<typeof learningEventSchema>;
export type LearningAction = LearningInput extends infer T
  ? T extends LearningInput
    ? Omit<T, "eventId" | "occurredAt">
    : never
  : never;
export type LearningObservation = {
  kind: string;
  experimentId: string | null;
  payload: unknown;
};

/** Only arithmetic changes with unchanged inputs qualify; filling a blank isn't a correction. */
export function correctedCalculations(
  content: LabContent,
  before: Answers,
  after: Answers,
) {
  return content.experiments.flatMap((e) =>
    e.rows.flatMap((_, rowIndex) =>
      e.fields
        .filter((f) => {
          if (!f.calculated) return false;
          const a = before.experiments?.[e.id]?.[rowIndex] ?? {};
          const b = after.experiments?.[e.id]?.[rowIndex] ?? {};
          return (
            !!a[f.key]?.trim() &&
            !!b[f.key]?.trim() &&
            a[f.key] !== b[f.key] &&
            f.calculated.args.every(
              (key) => number(a[key]) === number(b[key]),
            ) &&
            expected(f, a) !== null &&
            expected(f, b) !== null &&
            !!fieldFeedback(f, a) &&
            !fieldFeedback(f, b)
          );
        })
        .map((f) => ({ experimentId: e.id, rowIndex, field: f.key })),
    ),
  );
}

export function buildLearningReport(
  content: LabContent,
  answers: Answers,
  events: LearningObservation[],
) {
  let repeated = 0,
    single = 0,
    multiple = 0;
  const previous = new Map<string, Record<string, number>>();
  for (const event of events) {
    if (event.kind !== "RUN_COMPLETED" || !event.experimentId) continue;
    const payload = event.payload as {
      parameters?: Record<string, number>;
    } | null;
    const p = payload?.parameters;
    if (!p || !Object.keys(p).length) continue;
    const last = previous.get(event.experimentId);
    if (last) {
      const changed = new Set([...Object.keys(last), ...Object.keys(p)]);
      const count = [...changed].filter((key) => last[key] !== p[key]).length;
      if (!count) repeated++;
      else if (count === 1) single++;
      else multiple++;
    }
    previous.set(event.experimentId, p);
  }
  const totalRuns = events.filter((e) => e.kind === "RUN_COMPLETED").length;
  const corrected = events.filter((e) => e.kind === "CALCULATION_FIXED").length;
  const help = events.filter((e) => e.kind === "HELP_REQUESTED").length;
  let measured = 0,
    measurementTotal = 0;
  for (const e of content.experiments)
    for (let i = 0; i < e.rows.length; i++)
      for (const f of e.fields.filter((f) => !f.calculated)) {
        measurementTotal++;
        if (answers.experiments?.[e.id]?.[i]?.[f.key]?.trim()) measured++;
      }
  const checks = checkCalculations(content, answers);
  const entered = checks.filter((c) => c.actual.trim());
  const verifiable = entered.filter((c) => c.expected !== null);
  const consistent = verifiable.filter((c) => !c.error).length;
  const conclusion = Array.from(
    { length: 4 },
    (_, i) => !!answers.conclusion?.[i]?.trim(),
  );
  const prediction = !!answers.prediction?.trim();
  const dimensions = [
    {
      key: "planning",
      title: "Планування досліду",
      evidence: [
        prediction ? "Прогноз записано." : "Прогноз ще не записано.",
        `Пари послідовних завершених запусків однієї серії: одна зміна — ${single}, кілька — ${multiple}.`,
      ],
      next: !prediction
        ? "Запиши припущення перед дослідом і поясни, чого очікуєш."
        : multiple > 0
          ? "Перевір, чи вимагала методика змінювати кілька величин. Для контрольованого порівняння змінюй одну."
          : "Порівняй два запуски зі зміною однієї величини, якщо це відповідає методиці.",
    },
    {
      key: "measurement",
      title: "Вимірювання",
      evidence: [
        `Заповнено полів вимірювань: ${measured} із ${measurementTotal}.`,
        `Завершених віртуальних запусків у журналі: ${totalRuns}; повторів з однаковими параметрами: ${repeated}.`,
      ],
      next:
        measured < measurementTotal
          ? "Додай відсутні покази приладів і перевір одиниці."
          : "Поясни, як перевіряв покази. Повтори вимірювання, якщо цього вимагає методика.",
    },
    {
      key: "calculation",
      title: "Обчислення",
      evidence: [
        `Заповнено розрахунків: ${entered.length} із ${checks.length}.`,
        `Арифметично узгоджено: ${consistent} із ${verifiable.length} перевірюваних; виправлень зі сталими вхідними даними: ${corrected}.`,
      ],
      next: !checks.length
        ? "У цій роботі немає полів автоматичної перевірки обчислень."
        : consistent < verifiable.length
          ? "Перевір формулу, одиниці та округлення у заповнених розрахунках."
          : entered.length < checks.length
            ? "Обчисли відсутні величини за своїми вимірюваннями."
            : "Поясни один розрахунок власними словами та перевір фізичний зміст результату.",
    },
    {
      key: "conclusion",
      title: "Обґрунтування висновків",
      evidence: [
        `Заповнено частин висновку: ${conclusion.filter(Boolean).length} із 4.`,
        "Зміст пояснень і відповідність висновку результатам перевіряє вчитель.",
      ],
      next: !conclusion[1]
        ? "Наведи у висновку отримані числові результати."
        : !conclusion[2]
          ? "Зістав результат зі своїм прогнозом і поясни відмінності."
          : !conclusion[3]
            ? "Опиши джерела похибки та спосіб покращення досліду."
            : "Перевір, чи кожне твердження у висновку спирається на результати досліду.",
    },
  ];
  return {
    version: LEARNING_RULE_VERSION,
    dimensions,
    facts: { totalRuns, repeated, single, multiple, corrected, help },
  };
}
export type LearningReport = ReturnType<typeof buildLearningReport>;
