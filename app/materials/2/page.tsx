import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Orbit,
  CheckCircle2,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { labs } from "@/lib/labs";
import { labTwoMethod, labTwoQuestions } from "@/lib/lab-two-material";
import { Shell } from "@/components/shell";
import { RotationScene } from "@/components/rotation-scene";
import { VirtualLab } from "@/components/virtual-lab";
import { MaterialPrint } from "@/components/material-print";
import styles from "../guide.module.css";

export const metadata: Metadata = {
  title: "Лабораторна № 2 — Період і частота обертання",
};

function Formula({ frequency = false }: { frequency?: boolean }) {
  return (
    <span
      className={styles.formula}
      role="math"
      aria-label={
        frequency
          ? "Обертова частота дорівнює кількості обертів, поділеній на час"
          : "Період дорівнює часу, поділеному на кількість обертів"
      }
    >
      <i>{frequency ? "n" : "T"}</i>
      <span>=</span>
      <span className={styles.fraction}>
        <i>{frequency ? "N" : "t"}</i>
        <i>{frequency ? "t" : "N"}</i>
      </span>
    </span>
  );
}

export default async function LabTwoMaterial() {
  const user = await currentUser();
  if (!user) redirect("/");
  const template = await db.labVersion.findFirst({
    where: { number: 2, authorId: null },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  const sections = [
    ["guide-purpose", "Мета й обладнання"],
    ["guide-theory", "Період і частота"],
    ["guide-method", "Хід роботи"],
    ["guide-experiment", "Віртуальний прилад"],
    ["guide-questions", "Контрольні запитання"],
    ["guide-conclusion", "Висновок і дослідження"],
  ];
  return (
    <Shell title="Навчальні матеріали · Робота № 2">
      <article className={styles.guide} id="lab-two-guide">
        <div className={`${styles.topline} no-print`}>
          <Link
            href={template ? `/library/${template.id}` : "/library"}
            className="back-link"
          >
            <ArrowLeft size={16} /> До роботи № 2
          </Link>
          <MaterialPrint />
        </div>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>
              ФІЗЛАБ / ЛАБОРАТОРНА РОБОТА 02
            </span>
            <h1>Період і частота обертання</h1>
            <p>
              Один оберт — два способи описати ритм. Виміряй час, порахуй оберти
              й знайди зв’язок.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <Clock3 size={16} /> Орієнтовно 30 хв
              </span>
              <span>
                <Orbit size={16} /> 10 · 20 · 30 обертів
              </span>
            </div>
            <a href="#guide-method" className={styles.heroButton}>
              Почати дослідження <ArrowDown size={17} />
            </a>
          </div>
          <div className={styles.heroVisual}>
            <svg
              viewBox="0 0 600 360"
              className="simulation-scene"
              role="img"
              aria-label="Вигляд зверху: кругова траєкторія, радіус, початкова мітка, секундомір і лічильник обертів"
            >
              <RotationScene
                radius={0.15}
                cycles={10}
                phase={0}
                elapsed={0}
                id="material-rotation"
              />
            </svg>
            <div className={styles.visualCaption}>
              <span>02 / ЗНАЙДИ РИТМ</span>
              <span>Мітка → повний оберт → час</span>
            </div>
          </div>
        </header>
        <div className={styles.layout}>
          <div className={styles.reading}>
            <section id="guide-purpose" className={styles.section}>
              <div className={styles.sectionNumber}>01 / ПІДГОТОВКА</div>
              <h2>Як виміряти ритм руху?</h2>
              <p>
                Визначимо період обертання та обертову частоту тіла під час
                приблизно рівномірного руху по колу. Порівняємо результати для
                трьох різних кількостей повних обертів за незмінних умов.
              </p>
              <div className={styles.question}>
                Якщо порахувати більше обертів за того самого темпу, чи
                зміниться час одного оберту?
              </div>
              <h3>Підготуй обладнання</h3>
              <ul className={styles.equipment}>
                {[
                  "Легка м’яка кулька",
                  "Міцна нитка 40–60 см",
                  "Коло радіусом 15 см",
                  "Секундомір",
                  "Лінійка",
                ].map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.note}>
                Перевір кріплення нитки й звільни простір обертання. Тримай тіло
                подалі від облич та інших людей. Дослід із реальною кулькою
                виконуй за вказівками вчителя; для тренування можна використати
                модель нижче.
              </p>
            </section>
            <section id="guide-theory" className={styles.section}>
              <div className={styles.sectionNumber}>02 / ДВІ ВЕЛИЧИНИ</div>
              <h2>Час одного оберту. Оберти за секунду.</h2>
              <div className={styles.formulaCard}>
                <Formula />
                <dl>
                  <div>
                    <dt>T — період обертання</dt>
                    <dd>час одного повного оберту, с</dd>
                  </div>
                  <div>
                    <dt>t — час спостереження</dt>
                    <dd>час саме N повних обертів, с</dd>
                  </div>
                  <div>
                    <dt>N — кількість обертів</dt>
                    <dd>лічильне число, безрозмірна величина</dd>
                  </div>
                </dl>
              </div>
              <div className={styles.formulaCard}>
                <Formula frequency />
                <dl>
                  <div>
                    <dt>n — обертова частота</dt>
                    <dd>кількість повних обертів за одиницю часу</dd>
                  </div>
                  <div>
                    <dt>Одиниця СІ — с⁻¹</dt>
                    <dd>
                      також використовують Гц; «об/с» пояснює зміст підрахунку
                    </dd>
                  </div>
                </dl>
              </div>
              <div className={styles.callout}>
                <strong>Перевір зв’язок: T · n = 1, отже n = 1 / T.</strong>
                <p>
                  Чим коротший один оберт, тим більше обертів тіло виконає за
                  секунду. N — кількість обертів, а n — частота: ці позначення
                  не взаємозамінні.
                </p>
              </div>
              <details className={styles.disclosure}>
                <summary>Що означає «рівномірний рух по колу»?</summary>
                <p>
                  Модуль швидкості сталий, але напрям швидкості змінюється. Для
                  такого руху T = 2πr / v. У головній серії сталі радіус r і
                  швидкість v, тому період і частота не залежать від того, чи
                  вимірюємо 10, 20 або 30 обертів.
                </p>
              </details>
            </section>
            <section id="guide-method" className={styles.section}>
              <div className={styles.sectionNumber}>03 / ХІД РОБОТИ</div>
              <h2>Спочатку 0. Потім повні оберти.</h2>
              <ol className={styles.method}>
                {labTwoMethod.map((step) => (
                  <li key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.callout}>
                <strong>
                  У головній серії змінюється тільки кількість обертів N.
                </strong>
                <p>
                  За сталого радіуса й темпу довший відлік може зменшити
                  відносний вплив реакції людини на виміряний час. Він не усуває
                  помилок лічби та поступової зміни швидкості.
                </p>
              </div>
              <h3>Що записати у звіт</h3>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>
                    Окремі вимірювання за того самого радіуса й темпу
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Дослід</th>
                      <th scope="col">N</th>
                      <th scope="col">t, с</th>
                      <th scope="col">T, с</th>
                      <th scope="col">n, с⁻¹</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[10, 20, 30].map((n, i) => (
                      <tr key={n}>
                        <th scope="row">{i + 1}</th>
                        <td>{n}</td>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.note}>
                10, 20 і 30 — запропоновані кількості обертів, а не готові
                результати. Виміряні часи та власні розрахунки вводь у
                призначеній роботі. Перевір відповідність рядка фактичному N.
              </p>
            </section>
            <section id="guide-experiment" className={styles.section}>
              <div className={styles.sectionNumber}>04 / СПРОБУЙ</div>
              <h2>Порахуй повернення до мітки</h2>
              <p>
                Установи радіус і швидкість. Проведи запуски для 10, 20 та 30
                обертів. Радіус змінює розмір траєкторії, секундомір показує
                фізичний час моделі, а лічильник — завершені повні оберти.
              </p>
              <div className={styles.practiceNotice}>
                <strong>Тренування без збереження.</strong> Покази цього приладу
                не переносяться у звіт. Для здавання відкрий призначену роботу
                та використай дозволений учителем режим експерименту.
              </div>
              <VirtualLab
                number={2}
                experiment={labs[1].content.experiments[0]}
                allowTransfer={false}
              />
              <details className={styles.disclosure}>
                <summary>Що саме моделює цей прилад?</summary>
                <p>
                  Це кінематична модель заданого рівномірного руху по колу: t =
                  N · 2πr / v. Лінія від центра — геометричний радіус. Модель не
                  розраховує натяг нитки та умови рівноваги реальної кульки на
                  нитці. Тому радіус і швидкість задаються незалежно, а фізичну
                  довжину нитки прилад не визначає.
                </p>
                <p>
                  Випадкової похибки та реакції людини в моделі немає. Анімація
                  може бути прискореною; її тривалість не замінює показ
                  секундоміра.
                </p>
              </details>
            </section>
            <section id="guide-questions" className={styles.section}>
              <div className={styles.sectionNumber}>05 / ПОЯСНИ</div>
              <h2>Від ритму кульки до обертання Землі</h2>
              {labTwoQuestions.map((q, i) => (
                <div className={styles.controlQuestion} key={q.title}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{q.title}</h3>
                    <p>{q.text}</p>
                  </div>
                </div>
              ))}
              <p className={styles.note}>
                Для переведення частоти в СІ змінюй одиницю часу в знаменнику.
                Пояснення й обчислення запиши у звіті: пам’ятка не підставляє
                готових відповідей.
              </p>
            </section>
            <section id="guide-conclusion" className={styles.section}>
              <div className={styles.sectionNumber}>06 / ЗРОБИ ВИСНОВОК</div>
              <h2>Порівнюй умови, а не тільки числа</h2>
              <ul className={styles.checklist}>
                <li>Який рух досліджували та як відлічували повні оберти?</li>
                <li>
                  Які значення T і n отримали у трьох серіях? Наведи одиниці.
                </li>
                <li>
                  Чи залишилися період і частота приблизно сталими за збільшення
                  N? Чи виконується T · n ≈ 1?
                </li>
                <li>
                  Як вплинули зміни радіуса й темпу, помилки підрахунку та
                  робота із секундоміром?
                </li>
                <li>
                  Які особливості ідеальної моделі відсутні в реальному досліді?
                </li>
              </ul>
              <div className={styles.creative}>
                <span className={styles.sectionNumber}>
                  ДОСЛІДЖЕННЯ ІЗ ЗІРОЧКОЮ
                </span>
                <h3>Ритм колеса іграшкового автомобіля</h3>
                <p>
                  З реальним обладнанням постав помітну мітку на колесі.
                  Рівномірно рухай автомобіль прямо й виміряй час кількох повних
                  обертів колеса. Повтори для іншої сталої швидкості, зберігаючи
                  те саме колесо й за можливості однакове N.
                </p>
                <p>
                  Перевір, чи вистачає довжини столу для 10–15 обертів. Якщо ні
                  — обери менше N й запиши фактичну кількість; за короткого
                  вимірювання вплив реакції буде відносно більшим. Не включай у
                  відлік розгін і гальмування.
                </p>
                <p>
                  Порівняй T і n у двох серіях. Колесо обертається відносно
                  власної осі; траєкторія мітки відносно стола не є колом.
                  Віртуальна модель вище не відтворює рух автомобіля.
                </p>
              </div>
            </section>
            <footer className={styles.source}>
              <p>
                Навчальна вебадаптація лабораторної роботи № 2 за матеріалами
                Назара Щура, «ФІЗИКА НОВА». Формули джерела збережено, методику
                й умови задач уточнено.
              </p>
              <p>
                Це загальна методична пам’ятка. Якщо вчитель адаптував завдання,
                виконуй умови призначеної роботи.
              </p>
            </footer>
          </div>
          <aside className={`${styles.toc} no-print`}>
            <div className={styles.tocInner}>
              <span className={styles.sectionNumber}>ТВІЙ МАРШРУТ</span>
              <nav aria-label="Зміст вебпам’ятки">
                {sections.map(([id, label], i) => (
                  <a key={id} href={`#${id}`}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {label}
                  </a>
                ))}
              </nav>
              <div className={styles.tocFormula}>
                <Formula />
                <p>
                  n = 1 / T<br />T · n = 1
                </p>
              </div>
              <Link
                className="button primary wide"
                href={
                  user.role === "TEACHER" && template
                    ? `/library/${template.id}`
                    : "/dashboard"
                }
              >
                {user.role === "TEACHER"
                  ? "До навчальної роботи"
                  : "До моїх завдань"}
                <ArrowUpRight size={16} />
              </Link>
              <p className={styles.tocHint}>
                Відповіді та оцінки зберігаються у призначеній роботі.
              </p>
            </div>
          </aside>
        </div>
      </article>
    </Shell>
  );
}
