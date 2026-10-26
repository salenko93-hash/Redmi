"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Copy, Check } from "lucide-react";
export function ClassAction({ teacher }: { teacher: boolean }) {
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="inline-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const f = new FormData(e.currentTarget);
        try {
          const r = await fetch(
            teacher ? "/api/classes" : "/api/classes/join",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(Object.fromEntries(f)),
            },
          );
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Помилка з’єднання");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        {teacher ? "Назва нового класу" : "Код запрошення до класу"}
        <input
          name={teacher ? "name" : "code"}
          required
          minLength={2}
          maxLength={80}
          placeholder={
            teacher
              ? "Наприклад, 7-Б"
              : "Особистий або спільний код від учителя"
          }
        />
      </label>
      <button className="button primary" disabled={busy}>
        {teacher ? <Plus size={17} /> : <ArrowRight size={17} />}{" "}
        {teacher ? "Створити клас" : "Приєднатися"}
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}
export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="code-button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      <code>{code}</code>
      {copied ? <Check size={16} /> : <Copy size={16} />}
      <span className="sr-only">Скопіювати код</span>
    </button>
  );
}
export function AssignForm({
  classroomId,
  labs,
}: {
  classroomId: string;
  labs: { id: string; number: number; title: string; version: number }[];
}) {
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="panel form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const f = new FormData(e.currentTarget);
        const date = String(f.get("dueAt") ?? "");
        try {
          const r = await fetch("/api/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              classroomId,
              labVersionId: f.get("labVersionId"),
              dueAt: date ? new Date(date).toISOString() : null,
              feedbackMode: f.get("feedbackMode"),
              experimentMode: f.get("experimentMode"),
            }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Помилка з’єднання");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Призначити роботу</h2>
      <label>
        Лабораторна робота
        <select name="labVersionId">
          {labs.map((l) => (
            <option key={l.id} value={l.id}>
              № {l.number} · {l.title} (версія {l.version})
            </option>
          ))}
        </select>
      </label>
      <label>
        Термін здачі (ваш місцевий час)
        <input type="datetime-local" name="dueAt" />
      </label>
      <label>
        Перевірка обчислень
        <select name="feedbackMode">
          <option value="PRACTICE">Тренування — підказки під час роботи</option>
          <option value="INDEPENDENT">
            Самостійно — перевірка після оцінювання
          </option>
        </select>
      </label>
      <label>
        Спосіб виконання
        <select name="experimentMode">
          <option value="REAL">Власний експеримент</option>
          <option value="DATA">Аналіз наданих даних</option>
          <option value="SIMULATION">Віртуальний експеримент</option>
        </select>
      </label>
      <p className="muted">
        Для аналізу даних передайте учням вимірювання або відео окремо. Вони
        зазначать джерело у звіті.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        Призначити класу <ArrowRight size={16} />
      </button>
    </form>
  );
}

export function AssignmentMode({
  id,
  mode,
  locked,
}: {
  id: string;
  mode: string;
  locked: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(mode),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="mode-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const r = await fetch(`/api/assignments/${id}/mode`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ experimentMode: value }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error);
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Помилка з’єднання");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Спосіб виконання
        <select
          aria-label="Змінити спосіб виконання"
          disabled={locked || busy}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="REAL">Власний експеримент</option>
          <option value="DATA">Аналіз наданих даних</option>
          <option value="SIMULATION">Віртуальний експеримент</option>
        </select>
      </label>
      <button
        className="button secondary"
        disabled={locked || busy || value === mode}
      >
        Зберегти режим
      </button>
      {locked && (
        <p className="muted">
          Режим зафіксовано після здавання або перенесення віртуальних показів.
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}
