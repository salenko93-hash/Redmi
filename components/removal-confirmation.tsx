"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./removal-confirmation.module.css";
export function RemovalConfirmation({
  title,
  name,
  description,
  busy,
  error,
  onConfirm,
  onCancel,
  returnFocus,
}: {
  title: string;
  name: string;
  description: string;
  busy: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
  returnFocus?: HTMLElement | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    const previous =
      returnFocus ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    if (node && !node.open) node.showModal();
    return () => {
      if (node?.open) node.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [returnFocus]);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="removal-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="removal-title">{title}</h2>
      <strong className={styles.name}>{name}</strong>
      <p>{description}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (confirmed && !busy) onConfirm();
        }}
      >
        <label className={styles.confirm}>
          <input
            type="checkbox"
            required
            checked={confirmed}
            disabled={busy}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          Підтверджую видалення
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onCancel}
          >
            Скасувати
          </button>
          <button className="button secondary" disabled={busy || !confirmed}>
            Видалити
          </button>
        </div>
      </form>
    </dialog>
  );
}
