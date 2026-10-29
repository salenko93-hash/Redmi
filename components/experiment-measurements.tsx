"use client";
import { fieldFeedback } from "@/lib/physics";
import type { Answers, Experiment } from "@/lib/types";
import { usesManualTiming } from "@/lib/experiment-timing";
import styles from "./experiment-measurements.module.css";

export function ExperimentMeasurements({
  number,
  experiment,
  answers,
  readOnly,
  feedbackMode,
  onChange,
}: {
  number: number;
  experiment: Experiment;
  answers: Answers;
  readOnly: boolean;
  feedbackMode: string;
  onChange: (answers: Answers) => void;
}) {
  return (
    <section className={styles.root} aria-label="Таблиця дослідів">
      <h3>Таблиця дослідів</h3>
      <p>
        {usesManualTiming(number)
          ? `Після «Стоп» введіть час у секундах. ${number === 1 ? "Швидкість" : number === 2 ? "Період і частоту" : "Період"} обчисліть самостійно.`
          : "Запишіть вимірювання. Розрахункові поля заповніть самостійно."}
      </p>
      <div
        className={styles.scroll}
        tabIndex={0}
        aria-label={`Вимірювання: ${experiment.title}`}
      >
        <table
          style={{
            minWidth: Math.max(480, (experiment.fields.length + 1) * 125),
          }}
        >
          <caption className="sr-only">
            Вимірювання та розрахунки: {experiment.title}
          </caption>
          <thead>
            <tr>
              <th scope="col">Дослід</th>
              {experiment.fields.map((f) => (
                <th scope="col" key={f.key}>
                  {f.label}
                  {f.unit ? `, ${f.unit}` : ""}
                  {f.calculated && (
                    <span className="field-tag">розрахунок</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {experiment.rows.map((label, i) => (
              <tr className="experiment-row" key={i}>
                <th scope="row">
                  {label}
                  {answers.simulationRecords?.some(
                    (r) => r.experimentId === experiment.id && r.rowIndex === i,
                  ) && (
                    <p className="model-source">
                      дані моделі
                      {usesManualTiming(number) ? " · час вручну" : ""}
                    </p>
                  )}
                </th>
                {experiment.fields.map((f) => {
                  const row = answers.experiments?.[experiment.id]?.[i] ?? {};
                  const feedback =
                    feedbackMode === "PRACTICE" ? fieldFeedback(f, row) : null;
                  return (
                    <td
                      key={f.key}
                      className={f.calculated ? "calculated-field" : undefined}
                    >
                      <input
                        aria-label={`${experiment.title}, ${label}: ${f.label}`}
                        inputMode={f.type === "text" ? "text" : "decimal"}
                        value={row[f.key] ?? ""}
                        disabled={readOnly}
                        maxLength={1000}
                        aria-invalid={Boolean(feedback)}
                        placeholder={
                          f.calculated ? "Обчисліть" : "Введіть значення"
                        }
                        onChange={(ev) => {
                          const rows = experiment.rows.map((_, j) => ({
                            ...answers.experiments?.[experiment.id]?.[j],
                          }));
                          rows[i][f.key] = ev.target.value;
                          onChange({
                            ...answers,
                            experiments: {
                              ...answers.experiments,
                              [experiment.id]: rows,
                            },
                          });
                        }}
                      />
                      {feedback && (
                        <small className="field-error">{feedback}</small>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
