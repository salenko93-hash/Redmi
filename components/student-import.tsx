"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, Users, Trash2 } from "lucide-react";
import { InvitationEmail } from "./invitation-email";
import { CopyCode } from "./class-actions";
import {
  ROSTER_MAX_BYTES,
  type RosterIssue,
  type RosterPlanRow,
} from "@/lib/roster";
import styles from "./student-import.module.css";
type Preview = {
  rows: RosterPlanRow[];
  errors: RosterIssue[];
  ignoredColumns: string[];
};
type Invite = { id: string; name: string; email: string | null; code: string };
export function StudentImport({
  classroomId,
  invites,
}: {
  classroomId: string;
  invites: Invite[];
}) {
  const router = useRouter(),
    inputId = useId();
  const [open, setOpen] = useState(false),
    [csv, setCsv] = useState(""),
    [preview, setPreview] = useState<Preview | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState("");
  const endpoint = `/api/classes/${classroomId}/students`;
  const ready = preview?.rows.filter((r) => r.action === "create").length ?? 0;
  function change(value: string) {
    setCsv(value);
    setPreview(null);
    setError("");
    setReceipt("");
  }
  async function send(mode: "preview" | "commit") {
    setBusy(true);
    setError("");
    setReceipt("");
    try {
      const response = await fetch(endpoint + "/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, mode }),
      });
      const data = await response.json();
      if (data.errors?.length) {
        setPreview(data);
        return;
      }
      if (!response.ok)
        throw new Error(data.error ?? "Не вдалося імпортувати список.");
      if (mode === "preview") setPreview(data);
      else {
        setReceipt(
          `Створено запрошень: ${data.created}. Пропущено повторів або наявних учнів: ${data.skipped}.`,
        );
        setPreview(null);
        setCsv("");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка з’єднання.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(invite: Invite) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint + "/invites/" + invite.id, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Не вдалося прибрати запрошення.");
      setPreview(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка з’єднання.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.roster}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className="button secondary"
          aria-expanded={open}
          aria-controls={inputId}
          onClick={() => {
            setOpen(!open);
            setError("");
          }}
        >
          <Upload size={16} /> Імпортувати CSV
        </button>
        <a className="button secondary" href="/templates/students.csv" download>
          <Download size={16} /> Шаблон CSV
        </a>
      </div>
      {open && (
        <section
          id={inputId}
          className={styles.editor}
          aria-label="Імпорт списку учнів"
        >
          <h3>Список із Excel або Google Таблиць</h3>
          <p>
            Формат <strong>CSV UTF‑8</strong>, стовпці{" "}
            <strong>ПІБ;Email</strong>. Також підтримуються окремі Прізвище,
            Ім’я та По батькові. До 500 учнів, файл до 128 КБ.
          </p>
          <p>
            Учні з’являться у списку очікування. Після входу у власний обліковий
            запис вони вводять індивідуальний код; за наявності Email код
            прив’язаний до цієї адреси.
          </p>
          <label className={styles.upload}>
            Обрати CSV-файл
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
              disabled={busy}
              onChange={async (e) => {
                const file = e.currentTarget.files?.[0];
                e.currentTarget.value = "";
                if (!file) return;
                change("");
                if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
                  setError(
                    "Збережіть таблицю як CSV UTF‑8; файл Excel .xlsx потрібно спочатку експортувати.",
                  );
                  return;
                }
                if (file.size > ROSTER_MAX_BYTES) {
                  setError("Файл завеликий. Максимум 128 КБ.");
                  return;
                }
                setBusy(true);
                try {
                  change(
                    new TextDecoder("utf-8", { fatal: true }).decode(
                      await file.arrayBuffer(),
                    ),
                  );
                } catch {
                  setError(
                    "Не вдалося прочитати файл. В Excel оберіть «CSV UTF‑8», а не звичайний CSV зі старим кодуванням.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          <label className={styles.paste}>
            Або вставити таблицю
            <textarea
              aria-label="Вміст CSV зі списком учнів"
              rows={6}
              value={csv}
              disabled={busy}
              onChange={(e) => change(e.target.value)}
              placeholder={
                "ПІБ;Email\nКоваленко Олена Іванівна;olena@example.com\nШевченко Максим;maxym@example.com"
              }
            />
          </label>
          <p className={styles.hint}>
            Розділювач: крапка з комою, кома або табуляція. Email можна залишити
            порожнім. Для учнів з однаковим ПІБ укажіть різні Email.
          </p>
          <button
            type="button"
            className="button secondary"
            disabled={busy || !csv.trim()}
            onClick={() => send("preview")}
          >
            <Users size={16} /> Перевірити список
          </button>
          {preview && (
            <div className={styles.preview}>
              <h4>Попередній перегляд</h4>
              {preview.ignoredColumns.length > 0 && (
                <p className={styles.hint}>
                  Ці стовпці не імпортуються:{" "}
                  {preview.ignoredColumns.join(", ")}.
                </p>
              )}
              {preview.errors.length > 0 ? (
                <div role="alert" className="error">
                  <strong>Виправте помилки та перевірте список знову.</strong>
                  <ul>
                    {preview.errors.map((issue, i) => (
                      <li key={i}>
                        Рядок {issue.line}: {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <p>
                    Буде додано: <strong>{ready}</strong> · пропущено:{" "}
                    <strong>{preview.rows.length - ready}</strong>
                  </p>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Рядок</th>
                          <th scope="col">ПІБ</th>
                          <th scope="col">Email</th>
                          <th scope="col">Результат</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row) => (
                          <tr key={row.line}>
                            <td>{row.line}</td>
                            <td>{row.name}</td>
                            <td>{row.email ?? "—"}</td>
                            <td>
                              <strong>
                                {row.action === "create"
                                  ? "Готовий"
                                  : "Пропущено"}
                              </strong>
                              <small className={styles.reason}>
                                {row.reason}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    className="button primary"
                    disabled={busy || !ready}
                    onClick={() => send("commit")}
                  >
                    Імпортувати {ready} учнів
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {receipt && (
        <p role="status" className={styles.receipt}>
          {receipt}
        </p>
      )}
      {invites.length > 0 && (
        <section
          className={styles.pending}
          aria-label="Учні, які очікують приєднання"
        >
          <div className={styles.toolbar}>
            <h3>Очікують приєднання · {invites.length}</h3>
            <a className="button secondary" href={endpoint + "/codes"}>
              <Download size={16} /> Завантажити коди CSV
            </a>
          </div>
          <p className={styles.hint}>
            Передайте кожному учню його рядок із кодом. Учень входить або
            реєструється з указаним Email, відкриває «Мій клас» і вводить код.
            Для розсилки листів скористайтеся кнопкою нижче.
          </p>
          <InvitationEmail
            classroomId={classroomId}
            revision={invites.map((i) => i.id).join(",")}
          />
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">ПІБ</th>
                  <th scope="col">Email</th>
                  <th scope="col">Код приєднання</th>
                  <th scope="col">Дія</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id} data-roster-invite={invite.id}>
                    <td>{invite.name}</td>
                    <td>{invite.email ?? "Не вказано"}</td>
                    <td>
                      <CopyCode code={invite.code} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="button secondary"
                        aria-label={`Прибрати з очікування: ${invite.name}`}
                        disabled={busy}
                        onClick={() => remove(invite)}
                      >
                        <Trash2 size={15} />
                        <span>Прибрати</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
