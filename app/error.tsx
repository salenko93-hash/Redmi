"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>Не вдалося завантажити сторінку</h1>
      <p>
        Перевірте з’єднання та спробуйте ще раз. Незбережена локальна чернетка
        залишається у вашому браузері.
      </p>
      <button className="button primary" onClick={reset}>
        Спробувати знову
      </button>
    </main>
  );
}
