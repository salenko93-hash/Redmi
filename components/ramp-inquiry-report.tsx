import type { Answers } from "@/lib/types";
import {
  emptyRampInquiry,
  inquiryPlan,
  inquiryEvidence,
  inquiryReflection,
} from "@/lib/ramp-inquiry";

export function RampInquiryReport({
  stage,
  answers,
  compact = false,
}: {
  stage: "plan" | "evidence" | "reflection";
  answers: Answers;
  compact?: boolean;
}) {
  const v = answers.rampInquiry ?? emptyRampInquiry();
  const planFields = compact
    ? [{ key: "change" as const, label: "Мій короткий план" }]
    : inquiryPlan;
  const fields =
    stage === "plan"
      ? planFields
      : stage === "evidence"
        ? compact
          ? [{ key: "comparison", label: "Дані та порівняння" }]
          : inquiryEvidence
        : compact
          ? []
          : inquiryReflection;
  const values: Record<string, string> =
    compact && stage === "evidence"
      ? { comparison: answers.conclusion?.[1] ?? "" }
      : v[stage];
  const value = (text?: string) => text?.trim() || "—";
  return (
    <section>
      <h3>
        {stage === "plan"
          ? "Мій план перевірки"
          : stage === "evidence"
            ? "Перевіряю докази"
            : "Повертаюся до свого прогнозу"}
      </h3>
      {stage === "plan" && (
        <>
          <h4>Мій збережений прогноз</h4>
          <p className="report-answer">{value(v.snapshot?.prediction)}</p>
          {v.snapshot && (
            <>
              <h4>План під час фіксації прогнозу</h4>
              {planFields.map((f) => (
                <div key={f.key}>
                  <strong>{f.label}</strong>
                  <p className="report-answer">
                    {value(v.snapshot?.plan[f.key])}
                  </p>
                </div>
              ))}
            </>
          )}
        </>
      )}
      {fields.map((f) => (
        <div key={f.key}>
          <h4>{f.label}</h4>
          <p className="report-answer">{value(values[f.key])}</p>
        </div>
      ))}
      {stage === "evidence" &&
        [v.repeats.distance, ...v.repeats.times, v.repeats.summary].some((x) =>
          x.trim(),
        ) && (
          <>
            <h4>Повторна перевірка за сталих умов</h4>
            <p>Сталий шлях: {value(v.repeats.distance)} м.</p>
            <table>
              <thead>
                <tr>
                  <th>Повтор</th>
                  <th>Час, с</th>
                </tr>
              </thead>
              <tbody>
                {v.repeats.times.map((time, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{value(time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="report-answer">{value(v.repeats.summary)}</p>
          </>
        )}
    </section>
  );
}
