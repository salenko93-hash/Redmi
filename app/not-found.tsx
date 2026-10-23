import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <span className="eyebrow">404</span>
      <h1>Цей дослід ще не знайдено</h1>
      <p>Сторінка не існує або недоступна для вашого облікового запису.</p>
      <Link className="button primary" href="/dashboard">
        До мого простору
      </Link>
    </main>
  );
}
