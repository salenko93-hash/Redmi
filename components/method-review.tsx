"use client";
import type { Answers, Experiment, LabContent } from "@/lib/types";
import { hasRevisedMethod, methodWarnings } from "@/lib/methodology";
import styles from "./ramp-inquiry.module.css";

export const precisionFields = [
  { key: "hydro.step", label: "Ціна поділки динамометра, Н" },
  {
    key: "hydro.uncertainty",
    label: "Оцінка невизначеності одного відліку, Н",
  },
];
export function MethodReview({
  content,
  experiment,
  answers,
  readOnly,
  onChange,
}: {
  content: LabContent;
  experiment: Experiment;
  answers: Answers;
  readOnly: boolean;
  onChange: (a: Answers) => void;
}) {
  if (!hasRevisedMethod(content)) return null;
  const warnings = methodWarnings(content, answers).filter(
    (w) => w.experimentId === experiment.id,
  );
  const key = `${experiment.id}.review`;
  const updateNote = (key: string, value: string) =>
    onChange({
      ...answers,
      methodNotes: { ...answers.methodNotes, [key]: value },
    });
  return (
    <section className={styles.root} aria-label="Перевірка умов і точності">
      <h3>Перевірка умов і точності</h3>
      {content.methodology!.lab === 9 && (
        <>
          <p>
            Для відліку до поділки у віртуальному досліді: поділка 0,2 Н, межа
            округлення ±0,1 Н. Для реального приладу запишіть власну оцінку;
            вона може бути більшою через нуль, калібрування й розкид показів.
          </p>
          <div className={styles.fields}>
            {precisionFields.map((f) => (
              <label key={f.key}>
                {f.label}
                <input
                  inputMode="decimal"
                  maxLength={1000}
                  disabled={readOnly}
                  value={answers.methodNotes?.[f.key] ?? ""}
                  onChange={(e) => updateNote(f.key, e.target.value)}
                />
              </label>
            ))}
          </div>
        </>
      )}
      {warnings.length > 0 ? (
        <div role="status">
          <ul>
            {warnings.map((w) => (
              <li key={w.id}>{w.message}</li>
            ))}
          </ul>
          <p>
            Це привід перевірити дані. Попередження не змінює числа й не
            виставляє оцінку; пояснення перевіряє вчитель.
          </p>
        </div>
      ) : (
        <p>
          Порівняйте умови та фактичні спостереження. Відсутність попереджень не
          доводить правильності висновку.
        </p>
      )}
      {(warnings.length > 0 || answers.methodNotes?.[key]) && (
        <label>
          Пояснення перевірки даних
          <textarea
            rows={2}
            maxLength={10000}
            disabled={readOnly}
            value={answers.methodNotes?.[key] ?? ""}
            onChange={(e) => updateNote(key, e.target.value)}
            placeholder="Що перевірив, що спостерігав і які обмеження має висновок?"
          />
        </label>
      )}
      {content.methodology!.lab === 1 && (
        <details className={styles.repeats}>
          <summary>Повторні вимірювання часу · за можливості</summary>
          <p>
            Для кожного обраного шляху можна зробити три повтори. Зберігайте той
            самий шлях, кульку, нахил і спосіб запуску в межах повторів.
            Обчислення середнього часу та перенесення результату до основної
            таблиці виконайте самостійно.
          </p>
          {experiment.rows.map((label, i) => {
            const row = answers.repeatMeasurements?.[experiment.id]?.[i] ?? {
              path: "",
              values: ["", "", ""],
              note: "",
            };
            const update = (next: typeof row) =>
              onChange({
                ...answers,
                repeatMeasurements: {
                  ...answers.repeatMeasurements,
                  [experiment.id]: experiment.rows.map((_, j) =>
                    j === i
                      ? next
                      : (answers.repeatMeasurements?.[experiment.id]?.[j] ?? {
                          values: ["", "", ""],
                          note: "",
                        }),
                  ),
                },
              });
            return (
              <fieldset key={i}>
                <legend>{label}</legend>
                <div className={styles.repeatInputs}>
                  <label>
                    {label}: шлях для повторів, м
                    <input
                      inputMode="decimal"
                      maxLength={1000}
                      disabled={readOnly}
                      value={row.path ?? ""}
                      onChange={(e) => update({ ...row, path: e.target.value })}
                    />
                  </label>
                  {row.values.map((v, j) => (
                    <label key={j}>
                      {label}: повтор {j + 1}, с
                      <input
                        inputMode="decimal"
                        maxLength={1000}
                        disabled={readOnly}
                        value={v}
                        onChange={(e) =>
                          update({
                            ...row,
                            values: row.values.map((x, k) =>
                              j === k ? e.target.value : x,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <label>
                  {label}: що показали повтори?
                  <textarea
                    rows={2}
                    maxLength={10000}
                    disabled={readOnly}
                    value={row.note}
                    onChange={(e) => update({ ...row, note: e.target.value })}
                    placeholder="Розкид, обчислений середній час або причина, чому повторити не вдалося."
                  />
                </label>
              </fieldset>
            );
          })}
        </details>
      )}
    </section>
  );
}
