"use client";
import { useEffect, useState } from "react";
export default function Loading() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="loading-screen" role="status">
      <div className="loading-orbit" />
      <p>Готуємо простір для відкриттів…</p>
      {slow && (
        <>
          <p>
            Завантаження триває довше, ніж очікувалося. Можливо, сервер
            тимчасово недоступний.
          </p>
          <button
            className="button secondary"
            onClick={() => window.location.reload()}
          >
            Оновити сторінку
          </button>
        </>
      )}
    </div>
  );
}
