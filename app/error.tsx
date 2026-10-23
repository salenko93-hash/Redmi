"use client";
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className="error-page">
      <h1>Не вдалося завантажити сторінку</h1>
      <p>
        Сервер тимчасово недоступний або не може отримати дані. Спробуйте ще
        раз. Якщо помилка повторюється, повідомте відповідального за роботу
        застосунку. Локальна чернетка залишається у вашому браузері.
      </p>
      <button className="button primary" onClick={retry}>
        Спробувати знову
      </button>
      <a className="button secondary" href="/">
        До сторінки входу
      </a>
    </main>
  );
}
