"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  LoaderCircle,
  KeyRound,
  GraduationCap,
  Presentation,
} from "lucide-react";
export function AuthForm({
  initialMode = "login",
  expectedOrigin,
  initialOriginMismatch = false,
}: {
  initialMode?: "login" | "recover";
  expectedOrigin?: string;
  initialOriginMismatch?: boolean;
}) {
  const [originMismatch, setOriginMismatch] = useState(initialOriginMismatch);
  useEffect(
    () =>
      setOriginMismatch(
        Boolean(expectedOrigin && window.location.origin !== expectedOrigin),
      ),
    [expectedOrigin],
  );
  const [mode, setMode] = useState<"login" | "register" | "recover">(
      initialMode,
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [role, setRole] = useState<"STUDENT" | "TEACHER" | "">(""),
    [recoveryCode, setRecoveryCode] = useState("");
  const router = useRouter();
  const register = mode === "register",
    recover = mode === "recover";
  if (recoveryCode)
    return (
      <div className="auth-card">
        <span className="lab-symbol tone-0">
          <KeyRound />
        </span>
        <h2>Збережіть код відновлення</h2>
        {register && (
          <p role="status">
            {role === "TEACHER"
              ? "Обліковий запис учителя створено. Вас додано до команди вчителів."
              : "Обліковий запис учня / учениці створено. Вас приєднано до класу за особистим кодом."}
          </p>
        )}
        <p>
          Це ваш запасний ключ до облікового запису. Збережіть його у безпечному
          місці. Старий код після відновлення більше не працює.
        </p>
        <code className="recovery-code">{recoveryCode}</code>
        <p className="muted">
          Код показується лише зараз. Не надсилайте його іншим людям.
        </p>
        <button
          className="button primary wide"
          onClick={() => {
            if (recover) {
              window.location.assign("/");
            } else {
              router.push("/dashboard");
              router.refresh();
            }
          }}
        >
          {recover ? "Код збережено — увійти" : "Код збережено — продовжити"}
          <ArrowRight size={17} />
        </button>
      </div>
    );
  return (
    <div className="auth-card">
      <div className="eyebrow">ВАШІ ВІДКРИТТЯ ПОЧИНАЮТЬСЯ ТУТ</div>
      <h2>
        {register
          ? "Створити обліковий запис"
          : recover
            ? "Відновити доступ"
            : "Раді вас бачити"}
      </h2>
      <p>
        {register
          ? role === "TEACHER"
            ? "Створіть кабінет учителя за запрошенням адміністратора."
            : role === "STUDENT"
              ? "Створіть кабінет учня за особистим кодом від учителя."
              : "Оберіть, як ви працюватимете у ФізЛаб."
          : recover
            ? "Використайте особистий резервний код або новий код із PowerShell."
            : "Увійдіть, щоб продовжити дослідження."}
      </p>
      {originMismatch && (
        <p className="auth-address-notice" role="alert">
          Для входу та відновлення доступу відкрийте адресу цього застосунку:{" "}
          <a href={`${expectedOrigin}/${recover ? "?mode=recover" : ""}`}>
            {expectedOrigin}
          </a>
          . Поточна адреса не відповідає налаштованій адресі сайту.
        </p>
      )}
      <form
        method="post"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = new FormData(e.currentTarget);
          try {
            const res = await fetch("/api/auth/" + mode, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(Object.fromEntries(f)),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            if (data.recoveryCode) {
              setRecoveryCode(data.recoveryCode);
              return;
            }
            router.push("/dashboard");
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Помилка з’єднання.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {register && (
          <fieldset className="registration-roles" disabled={busy}>
            <legend>Я реєструюся як</legend>
            <div className="registration-role-options">
              {(
                [
                  ["STUDENT", "Учень / учениця", GraduationCap],
                  ["TEACHER", "Учитель", Presentation],
                ] as const
              ).map(([value, label, Icon]) => (
                <label className="registration-role" key={value}>
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    required
                    onChange={() => {
                      setRole(value);
                      setError("");
                    }}
                  />
                  <span>
                    <Icon size={22} aria-hidden="true" />
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {register && (
          <label>
            Ім’я та прізвище
            <input
              name="name"
              required
              minLength={2}
              autoComplete="name"
              placeholder="Як до вас звертатися?"
            />
          </label>
        )}
        <label>
          Електронна пошта
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        {recover && (
          <label>
            Код відновлення
            <input
              name="code"
              required
              minLength={10}
              maxLength={100}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </label>
        )}
        <label>
          {recover ? "Новий пароль" : "Пароль"}
          <input
            name="password"
            type="password"
            required
            minLength={10}
            maxLength={128}
            autoComplete={
              register || recover ? "new-password" : "current-password"
            }
            placeholder="Щонайменше 10 символів"
          />
        </label>
        {register && role === "TEACHER" && (
          <div className="registration-invite">
            <label>
              Код запрошення вчителя
              <input
                name="invite"
                required
                maxLength={100}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-describedby="teacher-invite-help"
                placeholder="Вставте код від адміністратора"
              />
            </label>
            <p id="teacher-invite-help">
              Використайте пошту, на яку видано запрошення. Код діє 24 години;
              після реєстрації доступ учителя не обмежений цим строком.
            </p>
          </div>
        )}
        {register && role === "STUDENT" && (
          <div className="registration-invite">
            <label>
              Особистий код учня
              <input
                name="studentCode"
                required
                maxLength={40}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-describedby="student-invite-help"
                placeholder="Вставте код від учителя"
              />
            </label>
            <p id="student-invite-help">
              Код видає вчитель для вас і вашого класу. Укажіть пошту зі списку
              вчителя. Запрошення адміністратора тут не працює.
            </p>
          </div>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button
          className="button primary wide"
          disabled={busy || originMismatch}
        >
          {busy ? (
            <LoaderCircle className="spin" size={18} />
          ) : (
            <>
              {register
                ? "Зареєструватися"
                : recover
                  ? "Відновити доступ"
                  : "Увійти"}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
      {mode === "login" && (
        <a
          className="text-button"
          style={{ marginTop: 12 }}
          href="/?mode=recover"
        >
          Забули пароль?
        </a>
      )}
      <p className="auth-switch">
        {register || recover ? "Уже маєте доступ?" : "Вперше у ФізЛаб?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(register || recover ? "login" : "register");
            setError("");
          }}
        >
          {register || recover ? "Увійти" : "Зареєструватися"}
        </button>
      </p>
      <small className="muted">
        Учням не потрібно вигадувати результати: працюйте з обладнанням або
        даними вчителя.
      </small>
    </div>
  );
}
