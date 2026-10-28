"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function MemberActions({
  classroomId,
  userId,
  name,
  active,
  removed,
}: {
  classroomId: string;
  userId: string;
  name: string;
  active: boolean;
  removed: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function change(remove: boolean) {
    if (
      remove &&
      !window.confirm(
        `Учень / учениця ${name} вибув / вибула? Доступ до цього класу буде закрито. Роботи та оцінки збережуться; учня можна відновити.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/classes/${classroomId}/members/${userId}`,
        {
          method: remove ? "DELETE" : "PATCH",
          headers: { "Content-Type": "application/json" },
          ...(!remove ? { body: JSON.stringify({ active: !active }) } : {}),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Не вдалося змінити доступ.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка з’єднання.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <span className="pill">
        {removed
          ? "Вибув / вибула"
          : active
            ? "Активний доступ"
            : "Призупинено"}
      </span>{" "}
      <button
        type="button"
        className="button secondary"
        disabled={busy}
        aria-label={`${active ? "Призупинити" : "Відновити"} доступ: ${name}`}
        onClick={() => change(false)}
      >
        {active ? "Призупинити" : "Відновити"}
      </button>{" "}
      <button
        type="button"
        className="button secondary"
        disabled={busy || removed}
        aria-label={`Видалити з класу: ${name}`}
        onClick={() => change(true)}
      >
        Видалити — учень вибув
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
