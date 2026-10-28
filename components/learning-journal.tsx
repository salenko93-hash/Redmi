"use client";
import Link from "next/link";
import type { useLearningJournal } from "./use-learning-journal";
import { LearningReport } from "./learning-report";
import styles from "./learning-progress.module.css";

export function LearningJournal({
  journal,
}: {
  journal: ReturnType<typeof useLearningJournal>;
}) {
  return (
    <section
      className={`panel ${styles.journal}`}
      aria-label="Мій навчальний поступ"
    >
      <div className="eyebrow">НАВЧАЛЬНИЙ ПОСТУП</div>
      <h3>Як проходить дослідження</h3>
      <p>
        За бажанням записуй запуски, паузи, скидання приладу, перенесення
        показів, запити допомоги та виправлення розрахунків. Для завершених
        запусків зберігаються параметри.
      </p>
      <p className={styles.note}>
        Журнал бачиш ти та вчитель цього класу. У спостереженнях
        використовуються події за останні 180 днів. Він не впливає на оцінку.
        Вимкнення видаляє журнал цієї роботи; відповіді залишаються.
      </p>
      <button
        type="button"
        className="button secondary"
        disabled={!journal.loaded || journal.busy}
        onClick={() => void journal.toggle(!journal.enabled)}
      >
        {journal.busy
          ? "Зберігається…"
          : !journal.loaded
            ? "Завантаження…"
            : journal.enabled
              ? "Вимкнути й видалити журнал"
              : "Увімкнути запис навчальних дій"}
      </button>
      <p role="status" className={styles.note}>
        {journal.loaded &&
          (journal.enabled
            ? journal.pending
              ? `Очікують збереження: ${journal.pending}. Не закривай вкладку до синхронізації.`
              : "Запис увімкнено · дії синхронізовано"
            : "Запис вимкнено. Спостереження нижче ґрунтуються лише на збережених відповідях.")}
      </p>
      {journal.error && (
        <div role="alert">
          <p className="error">{journal.error}</p>
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              void (journal.pending ? journal.flush() : journal.refresh())
            }
          >
            Повторити синхронізацію
          </button>
        </div>
      )}
      {journal.report && (
        <details>
          <summary>Спостереження та наступні кроки</summary>
          <LearningReport report={journal.report} />
        </details>
      )}
      <Link href="/progress">Усі мої роботи →</Link>
    </section>
  );
}
