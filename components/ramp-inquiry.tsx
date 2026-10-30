"use client";
import type { Answers } from "@/lib/types";
import {
  emptyRampInquiry,
  inquiryPlan,
  inquiryEvidence,
  inquiryReflection,
  inquiryRubric,
} from "@/lib/ramp-inquiry";
import styles from "./ramp-inquiry.module.css";

export function RampInquiry({
  stage,
  answers,
  readOnly,
  onChange,
}: {
  stage: "plan" | "evidence" | "reflection";
  answers: Answers;
  readOnly: boolean;
  onChange: (answers: Answers) => void;
}) {
  const v = answers.rampInquiry ?? emptyRampInquiry();
  const definitions =
    stage === "plan"
      ? inquiryPlan
      : stage === "evidence"
        ? inquiryEvidence
        : inquiryReflection;
  const values: Record<string, string> = v[stage];
  const title =
    stage === "plan"
      ? "Мій план перевірки"
      : stage === "evidence"
        ? "Перевіряю докази"
        : "Повертаюся до свого прогнозу";
  return (
    <section className={styles.root} aria-label={title}>
      <h3>{title}</h3>
      {stage === "plan" && (
        <p>
          Перед запуском запиши короткий план. Прогноз можна змінити після
          перевірки — поясни, які дані вплинули на твою думку.
        </p>
      )}
      {stage !== "plan" && (
        <div className={styles.snapshot}>
          <strong>Мій збережений прогноз</strong>
          <p>
            {v.snapshot?.prediction ||
              "Прогноз ще не зафіксовано. Повернися до підготовки й запиши своє припущення."}
          </p>
          {v.snapshot && (
            <details>
              <summary>План під час фіксації прогнозу</summary>
              <dl>
                {inquiryPlan.map((f) => (
                  <div key={f.key}>
                    <dt>{f.label}</dt>
                    <dd>{v.snapshot!.plan[f.key]}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </div>
      )}
      <div className={styles.fields}>
        {definitions.map((f) => (
          <label key={f.key}>
            {f.label}
            <small>{f.hint}</small>
            <textarea
              rows={2}
              maxLength={10000}
              disabled={readOnly}
              aria-label={`${title}: ${f.label}`}
              value={values[f.key] ?? ""}
              onChange={(e) =>
                onChange({
                  ...answers,
                  rampInquiry: {
                    ...v,
                    [stage]: { ...v[stage], [f.key]: e.target.value },
                  },
                })
              }
            />
          </label>
        ))}
      </div>
      {stage === "plan" && (
        <div className={styles.snapshot}>
          {v.snapshot ? (
            <>
              <strong>Збережений прогноз</strong>
              <p>{v.snapshot.prediction}</p>
              <small>
                Збережений запис залишається для порівняння. Вище можна
                уточнювати поточний прогноз і план.
              </small>
            </>
          ) : (
            <>
              <button
                type="button"
                className="button primary"
                disabled={
                  readOnly ||
                  !answers.prediction?.trim() ||
                  inquiryPlan.some((f) => !v.plan[f.key].trim())
                }
                onClick={() =>
                  onChange({
                    ...answers,
                    rampInquiry: {
                      ...v,
                      snapshot: {
                        prediction: answers.prediction!,
                        plan: { ...v.plan },
                      },
                    },
                  })
                }
              >
                Зафіксувати прогноз і план
              </button>
              <small>
                Спочатку заповни прогноз і чотири короткі пункти плану. Фіксація
                зберігає їх для порівняння з висновком.
              </small>
            </>
          )}
        </div>
      )}
      {stage === "evidence" && (
        <details className={styles.repeats}>
          <summary>Повторна перевірка часу · за можливості</summary>
          <p>
            Три відстані в основній таблиці — різні умови. Тут можна записати
            три повтори для одного шляху, зберігаючи кульку, діаметр, нахил,
            старт та умови руху. Ці значення не замінюють основну таблицю.
          </p>
          <div className={styles.repeatInputs}>
            <label>
              Сталий шлях, м
              <input
                inputMode="decimal"
                maxLength={1000}
                disabled={readOnly}
                value={v.repeats.distance}
                onChange={(e) =>
                  onChange({
                    ...answers,
                    rampInquiry: {
                      ...v,
                      repeats: { ...v.repeats, distance: e.target.value },
                    },
                  })
                }
              />
            </label>
            {v.repeats.times.map((time, i) => (
              <label key={i}>
                Повтор {i + 1}, с
                <input
                  inputMode="decimal"
                  maxLength={1000}
                  disabled={readOnly}
                  value={time}
                  onChange={(e) =>
                    onChange({
                      ...answers,
                      rampInquiry: {
                        ...v,
                        repeats: {
                          ...v.repeats,
                          times: v.repeats.times.map((t, j) =>
                            j === i ? e.target.value : t,
                          ),
                        },
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Що показали повтори?
            <textarea
              rows={2}
              maxLength={10000}
              disabled={readOnly}
              value={v.repeats.summary}
              placeholder="Порівняй розкид часу. Якщо обчислив середній час, запиши його й поясни використання."
              onChange={(e) =>
                onChange({
                  ...answers,
                  rampInquiry: {
                    ...v,
                    repeats: { ...v.repeats, summary: e.target.value },
                  },
                })
              }
            />
          </label>
        </details>
      )}
      {stage === "reflection" && (
        <details className={styles.repeats}>
          <summary>Як оцінюється обґрунтування</summary>
          <p>
            Учитель оцінює пояснення та докази. Уточнення помилкового прогнозу
            після перевірки є корисним результатом дослідження.
          </p>
          <ul>
            {inquiryRubric.map((c) => (
              <li key={c.label}>
                <strong>{c.label}.</strong> {c.hint}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
