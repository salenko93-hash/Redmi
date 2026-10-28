"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserPlus, Mail, Copy, RefreshCw } from "lucide-react";
import type { adminOverview } from "@/lib/admin";
import { copyText } from "@/lib/copy-text";
import styles from "./admin-panel.module.css";
type Overview = Awaited<ReturnType<typeof adminOverview>>;
const date = (value: string) =>
  new Date(value).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" });
const actions: Record<string, string> = {
  PASSWORD_RESET_BY_OPERATOR: "Оператор змінив пароль користувача",
  RECOVERY_CODE_REISSUED: "Оператор оновив код відновлення",
  ADMIN_GRANTED: "Надано права адміністратора",
  TEACHER_INVITED: "Створено запрошення вчителю",
  INVITATION_REVOKED: "Відкликано запрошення",
  TEACHER_BLOCKED: "Призупинено доступ учителя",
  TEACHER_ENABLED: "Відновлено доступ учителя",
  MAIL_CHECK_OK: "Поштове підключення працює",
  MAIL_CHECK_FAILED: "Помилка перевірки пошти",
};
export function AdminPanel({
  data,
  userId,
}: {
  data: Overview;
  userId: string;
}) {
  const router = useRouter();
  const inviteCode = useRef<HTMLTextAreaElement>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [copying, setCopying] = useState(false);
  const [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [invite, setInvite] = useState<{
      token: string;
      email: string;
      expiresAt: string;
    } | null>(null);
  async function request(path: string, method: string, body?: unknown) {
    const response = await fetch("/api/admin/" + path, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Не вдалося виконати дію.");
    return result;
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Помилка з’єднання.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.root}>
      <div className={styles.metrics}>
        <div>
          <small>УЧИТЕЛІ</small>
          <strong>{data.teachers.filter((t) => t.isActive).length}</strong>
          <span>мають активний доступ</span>
        </div>
        <div>
          <small>ЗАПРОШЕННЯ</small>
          <strong>{data.invitations.length}</strong>
          <span>очікують реєстрації</span>
        </div>
        <div>
          <small>КЛАСИ</small>
          <strong>
            {data.teachers.reduce((sum, t) => sum + t._count.ownedClasses, 0)}
          </strong>
          <span>у навчальному просторі</span>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className={styles.notice} role="status">
          {message}
        </p>
      )}
      <div className={styles.columns}>
        <section className="panel" aria-label="Керування вчителями">
          <div className={styles.heading}>
            <div>
              <h2>Команда вчителів</h2>
              <p className="muted">
                Кожен учитель працює зі своїми класами, учнями та журналом.
              </p>
            </div>
            <ShieldCheck size={24} />
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Учитель</th>
                  <th scope="col">Доступ</th>
                  <th scope="col">Класи</th>
                  <th scope="col">Дія</th>
                </tr>
              </thead>
              <tbody>
                {data.teachers.map((teacher) => (
                  <tr key={teacher.id} data-admin-teacher={teacher.id}>
                    <td>
                      <strong>{teacher.name}</strong>
                      <small className={styles.email}>{teacher.email}</small>
                      {teacher.isAdmin && (
                        <span className="pill">Адміністратор</span>
                      )}
                      {teacher.id === userId && (
                        <small className={styles.email}>Це ви</small>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          teacher.isActive ? styles.active : styles.blocked
                        }
                      >
                        {teacher.isActive ? "Активний" : "Призупинено"}
                      </span>
                    </td>
                    <td>{teacher._count.ownedClasses}</td>
                    <td>
                      <button
                        type="button"
                        className="button secondary"
                        disabled={busy || teacher.id === userId}
                        aria-label={`${teacher.isActive ? "Призупинити" : "Відновити"} доступ: ${teacher.name}`}
                        onClick={() =>
                          run(async () => {
                            await request("teachers/" + teacher.id, "PATCH", {
                              active: !teacher.isActive,
                            });
                            setMessage(
                              teacher.isActive
                                ? "Доступ призупинено, активні сеанси завершено. Класи та роботи збережені."
                                : "Доступ відновлено. Учитель може увійти зі своїм паролем.",
                            );
                          })
                        }
                      >
                        {teacher.isActive ? "Призупинити" : "Відновити"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel" aria-label="Запрошення нового вчителя">
          <UserPlus size={24} />
          <h2>Запросити колегу</h2>
          <p className="muted">
            Створіть особисте запрошення на 24 години. Код діятиме тільки для
            зазначеної адреси.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                const result = await request("invites", "POST", { email });
                setInvite(result);
                setCopyMessage("");
                setEmail("");
              });
            }}
          >
            <label>
              Email учителя
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                disabled={busy}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button className="button primary" disabled={busy}>
              <UserPlus size={16} /> Створити запрошення
            </button>
          </form>
          {invite && (
            <div className={styles.invite} role="status">
              <strong>Запрошення для {invite.email}</strong>
              <p>
                Код для реєстрації діє до {date(invite.expiresAt)}. Збережіть
                код зараз: повторно він не показується. Після реєстрації цей
                строк не обмежує доступ учителя.
              </p>
              <label>
                Код запрошення вчителя
                <textarea
                  ref={inviteCode}
                  aria-label="Код запрошення вчителя"
                  readOnly
                  rows={3}
                  value={invite.token}
                  onFocus={(event) => event.target.select()}
                />
              </label>
              <button
                type="button"
                className="button secondary"
                disabled={copying}
                onClick={async () => {
                  setCopying(true);
                  setCopyMessage("");
                  try {
                    const copied = await copyText(
                      invite.token,
                      inviteCode.current,
                    );
                    setCopyMessage(
                      copied
                        ? "Код скопійовано."
                        : "Код виділено. Натисніть Ctrl+C на комп’ютері або утримуйте поле й оберіть «Скопіювати» на телефоні.",
                    );
                  } finally {
                    setCopying(false);
                  }
                }}
              >
                <Copy size={15} /> Скопіювати запрошення
              </button>
              <p aria-live="polite" aria-atomic="true">
                {copyMessage}
              </p>
              <p>
                Передайте код колезі особисто. На сторінці реєстрації він обирає
                «Учитель», указує цю адресу, власний пароль і код запрошення
                вчителя. Лист автоматично не надсилається.
              </p>
            </div>
          )}
        </section>
      </div>
      <section className="panel" aria-label="Чинні запрошення вчителів">
        <h2>Очікують реєстрації</h2>
        {!data.invitations.length ? (
          <p className="muted">Чинних запрошень немає.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Адреса вчителя</th>
                  <th scope="col">Код дійсний до</th>
                  <th scope="col">Дія</th>
                </tr>
              </thead>
              <tbody>
                {data.invitations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.email ||
                        "Без прив’язки до адреси · створено на сервері"}
                    </td>
                    <td>{date(item.expiresAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="button secondary"
                        disabled={busy}
                        aria-label={`Відкликати запрошення: ${item.email || item.id}`}
                        onClick={() =>
                          run(async () => {
                            await request("invites/" + item.id, "DELETE");
                            if (invite?.email === item.email) setInvite(null);
                            setMessage(
                              "Запрошення відкликано. Код більше не діє.",
                            );
                          })
                        }
                      >
                        Відкликати
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className={styles.columns}>
        <section className="panel" aria-label="Стан системи">
          <h2>Система та пошта</h2>
          <p>
            <span className={styles.active}>База доступна</span> ·{" "}
            {data.system.templates}/10 базових робіт
          </p>
          <p>
            <Mail size={16} />{" "}
            {data.system.mailConfigured
              ? "Пошту налаштовано"
              : "Пошта очікує підключення"}
          </p>
          {data.system.mailConfigured && (
            <p className="muted">
              Відправник: {data.system.sender}
              <br />
              Сайт у листах: {data.system.siteUrl}
            </p>
          )}
          <button
            type="button"
            className="button secondary"
            disabled={busy || !data.system.mailConfigured}
            onClick={() =>
              run(async () => {
                const result = await request("mail/check", "POST");
                setMessage(result.message);
              })
            }
          >
            <Mail size={16} /> Перевірити підключення пошти
          </button>
          <p className="muted">
            Перевірка не надсилає листів. Пароль пошти зберігається на сервері.
          </p>
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => router.refresh()}
          >
            <RefreshCw size={16} /> Оновити стан
          </button>
        </section>
        <section className="panel">
          <h2>Резервні копії</h2>
          <p>
            Копії бази виконує оператор сервера. Вони містять учнівські дані,
            тому зберігайте їх у місці з обмеженим доступом.
          </p>
          <p className="muted">
            Перед оновленням зробіть копію. Перевіряйте відновлення в окремій
            базі.
          </p>
          <a
            className="button secondary"
            href="https://github.com/salenko93-hash/Redmi/blob/main/docs/admin.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Інструкція адміністратора
          </a>
        </section>
      </div>
      <section className="panel" aria-label="Журнал адміністративних дій">
        <h2>Останні дії</h2>
        {!data.audit.length ? (
          <p className="muted">Дій ще немає.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Час · Київ</th>
                  <th scope="col">Хто</th>
                  <th scope="col">Дія</th>
                  <th scope="col">Адреса</th>
                </tr>
              </thead>
              <tbody>
                {data.audit.map((item) => (
                  <tr key={item.id}>
                    <td>{date(item.createdAt)}</td>
                    <td>{item.actor}</td>
                    <td>{actions[item.action] || item.action}</td>
                    <td>{item.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
