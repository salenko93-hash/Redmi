"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RemovalConfirmation } from "./removal-confirmation";
import styles from "./class-members.module.css";
type Member = { userId: string; name: string; email: string; status: string };
export function ClassMembers({
  classroomId,
  members,
}: {
  classroomId: string;
  members: Member[];
}) {
  const router = useRouter();
  const removeInvoker = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [removing, setRemoving] = useState<Member | null>(null);
  async function change(
    member: Member,
    action: "restore" | "suspend" | "remove",
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/classes/${classroomId}/students/members/${member.userId}`,
        {
          method: action === "remove" ? "DELETE" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "remove"
              ? { confirmed: true }
              : { active: action === "restore" },
          ),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Не вдалося змінити доступ.");
      setRemoving(null);
      setMessage(
        action === "remove"
          ? "Учень позначений як вибулий. Роботи й оцінки збережено."
          : action === "restore"
            ? "Доступ учня до класу відновлено."
            : "Доступ учня до цього класу призупинено.",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка з’єднання.");
    } finally {
      setBusy(false);
    }
  }
  const render = (member: Member) => (
    <li
      key={member.userId}
      className={styles.member}
      data-roster-member={member.userId}
    >
      <div>
        <strong>{member.name}</strong>
        <small>{member.email}</small>
        <span>
          {member.status === "LEFT"
            ? "Вибув / вибула"
            : member.status === "SUSPENDED"
              ? "Доступ призупинено"
              : "Активний доступ"}
        </span>
      </div>
      <div className={styles.actions}>
        <button
          className="button secondary"
          disabled={busy || member.status === "ACTIVE"}
          aria-label={`Відновити учня: ${member.name}`}
          onClick={() => change(member, "restore")}
        >
          Відновити
        </button>
        <button
          className="button secondary"
          disabled={busy || member.status !== "ACTIVE"}
          aria-label={`Призупинити учня: ${member.name}`}
          onClick={() => change(member, "suspend")}
        >
          Призупинити
        </button>
        <button
          className="button secondary"
          disabled={busy || member.status === "LEFT"}
          aria-label={`Видалити учня: ${member.name}`}
          onClick={(event) => {
            removeInvoker.current = event.currentTarget;
            setError("");
            setRemoving(member);
          }}
        >
          Видалити
        </button>
      </div>
    </li>
  );
  const current = members.filter((m) => m.status !== "LEFT"),
    left = members.filter((m) => m.status === "LEFT");
  return (
    <div className={styles.root}>
      {error && !removing && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
      {current.length > 0 && (
        <>
          <h3>Приєдналися · {current.length}</h3>
          <ul className={styles.list}>{current.map(render)}</ul>
        </>
      )}
      {left.length > 0 && (
        <details>
          <summary>Вибулі учні · {left.length}</summary>
          <ul className={styles.list}>{left.map(render)}</ul>
        </details>
      )}
      {removing && (
        <RemovalConfirmation
          returnFocus={removeInvoker.current}
          title="Видалити учня з класу?"
          name={`${removing.name} · ${removing.email}`}
          description="Учень утратить доступ до цього класу й перейде до списку «Вибулі учні». Роботи та оцінки залишаться. Інші класи й обліковий запис не зміняться. Відновити доступ зможе вчитель."
          busy={busy}
          error={error}
          onCancel={() => {
            setRemoving(null);
            setError("");
          }}
          onConfirm={() => change(removing, "remove")}
        />
      )}
    </div>
  );
}
