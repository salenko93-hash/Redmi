"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function ReviewForm({
  id,
  revision,
  status,
  initialRubric,
  initialFeedback,
  fields,
  criteria,
}: {
  id: string;
  revision: number;
  status: string;
  initialRubric: unknown;
  initialFeedback: string | null;
  fields: { key: string; label: string }[];
  criteria?: { label: string; hint: string }[];
}) {
  const [rubric, setRubric] = useState<number[]>(
      Array.isArray(initialRubric) ? initialRubric : [0, 0, 0, 0],
    ),
    [feedback, setFeedback] = useState(initialFeedback ?? ""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [comment, setComment] = useState(""),
    [field, setField] = useState(fields[0]?.key ?? "conclusion");
  const router = useRouter();
  const labels = criteria?.map((c) => c.label) ?? [
    "Вимірювання й методика",
    "Обчислення та одиниці",
    "Аналіз, графіки, схеми",
    "Висновок і похибки",
  ];
  async function action(action: "grade" | "return") {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/submissions/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, revision, rubric, feedback }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка з’єднання");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="review-panel panel no-print">
      <div className="eyebrow">ЗВОРОТНИЙ ЗВ’ЯЗОК</div>
      <h2>
        Оцінювання{" "}
        <span className="grade">{rubric.reduce((a, b) => a + b, 0)}/12</span>
      </h2>
      {criteria && (
        <details>
          <summary>Орієнтири для оцінювання обґрунтування</summary>
          <p>
            Оцініть роботу за доказами. Перегляд початкового прогнозу після
            перевірки може свідчити про якісний аналіз; початковий неправильний
            прогноз сам по собі не знижує оцінку.
          </p>
          <ul>
            {criteria.map((c) => (
              <li key={c.label}>
                <strong>{c.label}.</strong> {c.hint}
              </li>
            ))}
          </ul>
          <p>
            Для кожного критерію: 0 — доказів поки немає; 1 — окремі елементи; 2
            — переважно обґрунтовано, є прогалини; 3 — послідовне пояснення з
            доречними доказами. Зміст пояснень оцінює вчитель.
          </p>
        </details>
      )}
      {labels.map((label, i) => (
        <label className="rubric-row" key={label}>
          {label}
          <select
            value={rubric[i]}
            onChange={(e) =>
              setRubric(
                rubric.map((v, j) => (i === j ? Number(e.target.value) : v)),
              )
            }
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      ))}
      <label>
        Коментар до роботи
        <textarea
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Що вдалося? Що варто перевірити ще раз?"
        />
      </label>
      <div className="button-row">
        <button
          className="button primary"
          disabled={busy || !["SUBMITTED", "GRADED"].includes(status)}
          onClick={() => action("grade")}
        >
          Зберегти оцінку
        </button>
        <button
          className="button secondary"
          disabled={busy || !["SUBMITTED", "GRADED"].includes(status)}
          onClick={() => action("return")}
        >
          На доопрацювання
        </button>
      </div>
      {!["SUBMITTED", "GRADED"].includes(status) && (
        <p className="muted">
          Оцінити можна після здавання учнем. Коментарі доступні вже зараз.
        </p>
      )}
      <hr />
      <h3>Коментар до відповіді</h3>
      <label>
        Частина роботи
        <select value={field} onChange={(e) => setField(e.target.value)}>
          {fields.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Пояснення
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>
      <button
        className="button secondary"
        disabled={busy || !comment.trim()}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const r = await fetch(`/api/submissions/${id}/comments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ field, body: comment }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            setComment("");
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Помилка з’єднання");
          } finally {
            setBusy(false);
          }
        }}
      >
        Додати коментар
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
