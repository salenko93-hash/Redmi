"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
export function AccountActions({ userId }: { userId: string }) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <div className="form-stack">
      <div>
        <button
          className="button secondary"
          onClick={() => {
            const keys = Object.keys(localStorage).filter((k) =>
              k.startsWith("fizlab:" + userId + ":"),
            );
            for (const key of keys) localStorage.removeItem(key);
            setMessage(
              "Локальні чернетки та їхні резервні копії видалено з цього браузера. Серверні відповіді збережено.",
            );
          }}
        >
          Очистити локальні чернетки
        </button>
        <p className="muted">
          Використовуйте після роботи на спільному пристрої. Незбережені на
          сервері зміни буде втрачено.
        </p>
      </div>
      {message && <p role="status">{message}</p>}
      <button
        className="button primary"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/");
          router.refresh();
        }}
      >
        <LogOut size={17} />
        Вийти з облікового запису
      </button>
    </div>
  );
}
