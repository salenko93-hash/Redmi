"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, KeyRound } from "lucide-react";
export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register" | "recover">("login"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
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
              setRecoveryCode("");
              setMode("login");
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
          ? "Приєднуйтеся до класу та досліджуйте світ."
          : recover
            ? "Використайте код, отриманий під час реєстрації."
            : "Увійдіть, щоб продовжити дослідження."}
      </p>
      <form
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
            <input name="code" required minLength={10} autoComplete="off" />
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
        {register && (
          <details>
            <summary>Маєте запрошення вчителя?</summary>
            <label>
              Код запрошення
              <input name="invite" autoComplete="off" />
            </label>
          </details>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="button primary wide" disabled={busy}>
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
        <button
          className="text-button"
          style={{ marginTop: 12 }}
          onClick={() => {
            setMode("recover");
            setError("");
          }}
        >
          Забули пароль?
        </button>
      )}
      <p className="auth-switch">
        {register || recover ? "Уже маєте доступ?" : "Вперше у ФізЛаб?"}{" "}
        <button
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
