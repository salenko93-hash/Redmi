import type { Answers, Experiment, LabContent } from "@/lib/types";
import { hasRevisedMethod, methodWarnings } from "@/lib/methodology";

export function MethodReviewReport({
  content,
  experiment,
  answers,
}: {
  content: LabContent;
  experiment: Experiment;
  answers: Answers;
}) {
  if (!hasRevisedMethod(content)) return null;
  const warnings = methodWarnings(content, answers).filter(
    (w) => w.experimentId === experiment.id,
  );
  return (
    <section>
      <h4>Перевірка умов і точності</h4>
      {content.methodology!.lab === 9 && (
        <p>
          Ціна поділки: {answers.methodNotes?.["hydro.step"] || "—"} Н. Оцінка
          невизначеності одного відліку:{" "}
          {answers.methodNotes?.["hydro.uncertainty"] || "—"} Н.
        </p>
      )}
      {warnings.length > 0 && (
        <ul>
          {warnings.map((w) => (
            <li key={w.id}>{w.message}</li>
          ))}
        </ul>
      )}
      {answers.methodNotes?.[`${experiment.id}.review`] && (
        <>
          <h4>Пояснення перевірки даних</h4>
          <p className="report-answer">
            {answers.methodNotes[`${experiment.id}.review`]}
          </p>
        </>
      )}
      {(answers.repeatMeasurements?.[experiment.id] ?? []).map((r, i) =>
        r.values.some((v) => v.trim()) || r.note.trim() ? (
          <section key={i}>
            <h4>Повторні вимірювання · {experiment.rows[i]}</h4>
            <p>Сталий шлях для повторів: {r.path || "—"} м.</p>
            <p>Час повторів, с: {r.values.map((v) => v || "—").join("; ")}.</p>
            <p className="report-answer">{r.note || "—"}</p>
          </section>
        ) : null,
      )}
    </section>
  );
}
