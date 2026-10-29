"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { RemovalConfirmation } from "./removal-confirmation";
import styles from "./classroom-actions.module.css";

export function ClassroomActions({
  id,
  name,
  archived,
  empty,
  detail = false,
}: {
  id: string;
  name: string;
  archived: boolean;
  empty: boolean;
  detail?: boolean;
}) {
  const router = useRouter();
  const invoker = useRef<HTMLButtonElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function change(remove = false) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: remove ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          remove ? { confirmed: true } : { archived: !archived },
        ),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Не вдалося змінити клас.");
      setRemoving(false);
      setMessage(
        archived
          ? "Клас відновлено."
          : "Клас перенесено до архіву. Дані збережено.",
      );
      if (remove && detail) router.push("/classes");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка з’єднання.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.root}>
      <div className={styles.buttons}>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          aria-label={`${archived ? "Відновити" : "Архівувати"} клас: ${name}`}
          onClick={() => void change()}
        >
          {archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          {archived ? "Відновити клас" : "Архівувати"}
        </button>
        {empty && (
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            aria-label={`Видалити порожній клас: ${name}`}
            onClick={(event) => {
              invoker.current = event.currentTarget;
              setError("");
              setRemoving(true);
            }}
          >
            <Trash2 size={16} /> Видалити
          </button>
        )}
      </div>
      <p className="muted">
        {empty
          ? "Порожній клас можна видалити. Цю дію неможливо скасувати."
          : "Архівування зберігає учнів, роботи й оцінки."}
      </p>
      {message && <p role="status">{message}</p>}
      {error && !removing && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {removing && (
        <RemovalConfirmation
          title="Видалити порожній клас?"
          name={name}
          description="Клас і його код приєднання будуть видалені назавжди. Якщо дані класу змінилися, сервер перевірить його ще раз."
          busy={busy}
          error={error}
          onConfirm={() => void change(true)}
          onCancel={() => {
            setRemoving(false);
            setError("");
          }}
          returnFocus={invoker.current}
        />
      )}
    </div>
  );
}
