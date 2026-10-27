"use client";
import { useEffect, useState } from "react";
import { Mail, RefreshCw } from "lucide-react";
import styles from "./student-import.module.css";
type Invite = {
  id: string;
  name: string;
  email: string | null;
  emailStatus: string;
  emailAttemptAt: string | null;
  emailSentAt: string | null;
};
type State = {
  configured: boolean;
  sender: string | null;
  siteUrl: string | null;
  invites: Invite[];
};
function status(invite: Invite) {
  if (!invite.email) return "Без Email";
  if (invite.emailStatus === "SENT") return "Передано пошті";
  if (invite.emailStatus === "FAILED") return "Не надіслано";
  if (
    invite.emailStatus === "UNKNOWN" ||
    (invite.emailStatus === "SENDING" &&
      Date.now() - new Date(invite.emailAttemptAt!).getTime() > 120000)
  )
    return "Потребує перевірки";
  return invite.emailStatus === "SENDING" ? "Надсилається" : "Ще не надсилали";
}
export function InvitationEmail({
  classroomId,
  revision,
}: {
  classroomId: string;
  revision: string;
}) {
  const endpoint = `/api/classes/${classroomId}/students/email`;
  const [state, setState] = useState<State | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [resend, setResend] = useState(false),
    [open, setOpen] = useState(false);
  async function load() {
    const response = await fetch(endpoint);
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Не вдалося оновити статус листів.");
    setState(data);
    return data as State;
  }
  useEffect(() => {
    let active = true;
    fetch(endpoint)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || "Не вдалося завантажити статус листів.",
          );
        if (active) {
          setState(data);
          setSelected([]);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [endpoint, revision]);
  const eligible = (invite: Invite) =>
    Boolean(invite.email) &&
    (resend || ["NOT_SENT", "FAILED"].includes(invite.emailStatus)) &&
    (!invite.emailAttemptAt ||
      Date.now() - new Date(invite.emailAttemptAt).getTime() >
        (invite.emailStatus === "SENDING" ? 120000 : 60000));
  async function send() {
    setBusy(true);
    setError("");
    setMessage("");
    let sent = 0,
      failed = 0,
      uncertain = 0,
      skipped = 0;
    const ids = selected.filter((id) =>
      state?.invites.some((i) => i.id === id && eligible(i)),
    );
    try {
      for (let i = 0; i < ids.length; i += 5) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: ids.slice(i, i + 5), resend }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error ||
              "Надсилання зупинено. Оновіть статус перед повторною спробою.",
          );
        for (const result of data.results) {
          if (result.status === "sent") sent++;
          else if (result.status === "failed") failed++;
          else if (result.status === "uncertain") uncertain++;
          else skipped++;
        }
        setMessage(
          `Передано пошті: ${sent} · не надіслано: ${failed} · потребують перевірки: ${uncertain} · пропущено: ${skipped}. Оброблено ${Math.min(i + 5, ids.length)} із ${ids.length}.`,
        );
        if (
          !data.results.some((r: { status: string }) => r.status === "sent") &&
          data.results.some((r: { status: string }) =>
            ["failed", "uncertain"].includes(r.status),
          )
        ) {
          setError(
            "Розсилку призупинено після помилки. Перевірте пошту й адреси одержувачів перед продовженням.",
          );
          break;
        }
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Помилка з’єднання. Оновіть статус листів.",
      );
    } finally {
      setSelected([]);
      setBusy(false);
      await load().catch(() =>
        setError(
          "Не вдалося оновити статус. Оновіть сторінку перед повторною спробою.",
        ),
      );
    }
  }
  return (
    <section className={styles.mail} aria-label="Розсилка кодів учням">
      <button
        type="button"
        className="button secondary"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Mail size={16} /> Надіслати коди на Email
      </button>
      {open && (
        <div className={styles.editor}>
          <h3>Особисті запрошення учням</h3>
          <p>
            Кожен учень отримає окремий лист зі своїм кодом, адресою сайту та
            інструкцією входу. Адреси інших учнів у листі не показуються.
          </p>
          {!state ? (
            <div>
              <p role="status">
                {error ? "Статус листів недоступний." : "Завантаження статусу…"}
              </p>
              {error && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setError("");
                    load().catch((e) => setError(e.message));
                  }}
                >
                  Спробувати знову
                </button>
              )}
            </div>
          ) : !state.configured ? (
            <p className={styles.receipt}>
              Розсилка стане доступною після підключення пошти та публічної
              адреси сайту адміністратором. Коди вже можна передати вручну або
              завантажити у CSV.
            </p>
          ) : (
            <>
              <p className={styles.hint}>
                Відправник: <strong>{state.sender}</strong>
                <br />
                Сайт у листі:{" "}
                <a
                  href={state.siteUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {state.siteUrl}
                </a>
              </p>
              <p className={styles.hint}>
                «Передано пошті» означає, що поштовий сервер прийняв лист. Це не
                підтверджує доставку чи прочитання. Учень також має перевірити
                папку «Спам».
              </p>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  disabled={busy}
                  checked={resend}
                  onChange={(e) => {
                    setResend(e.target.checked);
                    setSelected([]);
                  }}
                />{" "}
                Дозволити повторне надсилання вибраним учням
              </label>
              {resend && (
                <p className={styles.hint}>
                  Для статусу «Потребує перевірки» спершу перевірте, чи лист уже
                  надійшов. Повтор може створити дублікат листа; код залишається
                  тим самим. Між спробами потрібна щонайменше хвилина.
                </p>
              )}
              <div className={styles.toolbar}>
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    setSelected(state.invites.filter(eligible).map((i) => i.id))
                  }
                >
                  Обрати доступних
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    setError("");
                    load().catch((e) => setError(e.message));
                  }}
                >
                  <RefreshCw size={15} /> Оновити статус
                </button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Обрати</th>
                      <th scope="col">Учень</th>
                      <th scope="col">Email</th>
                      <th scope="col">Статус листа</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.invites.map((invite) => (
                      <tr key={invite.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Надіслати лист: ${invite.name}`}
                            checked={selected.includes(invite.id)}
                            disabled={busy || !eligible(invite)}
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? [...selected, invite.id]
                                  : selected.filter((id) => id !== invite.id),
                              )
                            }
                          />
                        </td>
                        <td>{invite.name}</td>
                        <td>{invite.email || "—"}</td>
                        <td>
                          {status(invite)}
                          {invite.emailSentAt && (
                            <small className={styles.reason}>
                              {new Date(invite.emailSentAt).toLocaleString(
                                "uk-UA",
                              )}
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="button primary"
                disabled={busy || !selected.length}
                onClick={send}
              >
                <Mail size={16} />
                {busy ? "Надсилання…" : `Надіслати листи (${selected.length})`}
              </button>
              <p className={styles.hint}>
                Під час розсилки залишайте сторінку відкритою. Після переривання
                оновіть статус: уже надіслані листи повторно не обираються.
              </p>
            </>
          )}
          {message && (
            <p role="status" className={styles.receipt}>
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
