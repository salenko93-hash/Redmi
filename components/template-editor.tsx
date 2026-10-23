"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LabContent } from "@/lib/types";
export function TemplateEditor({
  id,
  title,
  content,
}: {
  id: string;
  title: string;
  content: LabContent;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <details className="panel no-print">
      <summary>Редагувати навчальний текст · створити нову версію</summary>
      <p className="muted">
        Зміни збережуться новою версією. Уже призначені роботи та відповіді
        залишаться прив’язаними до попередньої.
      </p>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = new FormData(e.currentTarget);
          try {
            const r = await fetch("/api/labs/" + id, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: f.get("title"),
                purpose: f.get("purpose"),
                theory: f.get("theory"),
                questions: String(f.get("questions"))
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
                creative: f.get("creative"),
              }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error);
            router.push("/library/" + data.id);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Помилка з’єднання");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Назва
          <input name="title" defaultValue={title} required />
        </label>
        <label>
          Мета
          <textarea
            name="purpose"
            defaultValue={content.purpose}
            required
            rows={3}
          />
        </label>
        <label>
          Теорія
          <textarea
            name="theory"
            defaultValue={content.theory}
            required
            rows={3}
          />
        </label>
        <label>
          Контрольні запитання · кожне з нового рядка
          <textarea
            name="questions"
            defaultValue={content.questions.join("\n")}
            required
            rows={6}
          />
        </label>
        <label>
          Творче завдання
          <textarea name="creative" defaultValue={content.creative} rows={3} />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          Зберегти нову версію
        </button>
      </form>
    </details>
  );
}
