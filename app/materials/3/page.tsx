import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  labThreeMethod,
  labThreeQuestions,
  labThreeSeries,
} from "@/lib/lab-three-material";
import { Shell } from "@/components/shell";
import { PendulumScene } from "@/components/pendulum-scene";
import { PendulumPractice } from "@/components/pendulum-practice";
import { MaterialPrint } from "@/components/material-print";
import styles from "../guide.module.css";

export const metadata: Metadata = {
  title: "Лабораторна № 3 — Коливання нитяного маятника",
};

function Formula() {
  return (
    <span
      className={styles.formula}
      role="math"
      aria-label="Період дорівнює часу, поділеному на кількість повних коливань"
    >
      <i>T</i>
      <span>=</span>
      <span className={styles.fraction}>
        <i>t</i>
        <i>N</i>
      </span>
    </span>
  );
}

export default async function LabThreeMaterial() {
  const user = await currentUser();
  if (!user) redirect("/");
  const template = await db.labVersion.findFirst({
    where: { number: 3, authorId: null },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  const sections = [
    ["guide-purpose", "Мета й обладнання"],
    ["guide-theory", "Модель та вимірювання"],
    ["guide-method", "Три серії дослідів"],
    ["guide-experiment", "Віртуальний маятник"],
    ["guide-questions", "Контрольні запитання"],
    ["guide-conclusion", "Висновок і дослідження"],
  ];
  return (
    <Shell title="Навчальні матеріали · Робота № 3">
      <article className={styles.guide} id="lab-three-guide">
        <div className={`${styles.topline} no-print`}>
          <Link
            href={template ? `/library/${template.id}` : "/library"}
            className="back-link"
          >
            <ArrowLeft size={16} /> До роботи № 3
          </Link>
          <MaterialPrint />
        </div>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>
              ФІЗЛАБ / ЛАБОРАТОРНА РОБОТА 03
            </span>
            <h1>Коливання нитяного маятника</h1>
            <p>
              Амплітуда, довжина чи маса? Змінюй одну величину й досліджуй, від
              чого залежить ритм коливань.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <Clock3 size={16} /> Орієнтовно 45 хв
              </span>
              <span>
                <SlidersHorizontal size={16} /> 3 серії · 6 дослідів
              </span>
            </div>
            <a href="#guide-method" className={styles.heroButton}>
              Почати дослідження <ArrowDown size={17} />
            </a>
          </div>
          <div className={styles.heroVisual}>
            <svg
              viewBox="0 0 600 440"
              className="simulation-scene"
              role="img"
              aria-label="Нитяний маятник на штативі: довжина до центра кульки, лічильник, секундомір та окрема збільшена шкала відхилення"
            >
              <PendulumScene
                length={1}
                amplitude={0.025}
                mass={0.1}
                cycles={20}
                phase={0}
                elapsed={0}
                id="material-pendulum"
              />
            </svg>
            <div className={styles.visualCaption}>
              <span>03 / ПЕРЕВІР ЗАЛЕЖНІСТЬ</span>
              <span>Одна серія — одна змінна</span>
            </div>
          </div>
        </header>
        <div className={styles.layout}>
          <div className={styles.reading}>
            <section id="guide-purpose" className={styles.section}>
              <div className={styles.sectionNumber}>01 / ПІДГОТОВКА</div>
              <h2>Що задає ритм маятника?</h2>
              <p>
                Виміряємо період нитяного маятника й окремо дослідимо вплив
                амплітуди, довжини та маси. Висновок сформулюємо за отриманими
                результатами з урахуванням малих кутів і точності вимірювань.
              </p>
              <div className={styles.question}>
                Як зміниться час одного повного коливання, якщо змінити тільки
                одну умову?
              </div>
              <h3>Підготуй обладнання</h3>
              <ul className={styles.equipment}>
                {[
                  "Штатив із кріпленням",
                  "Міцна нерозтяжна нитка",
                  "Дві кульки різної маси",
                  "Відомі маси або терези",
                  "Лінійка",
                  "Секундомір",
                ].map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.note}>
                Закріпи штатив стійко та звільни простір коливань. Для творчого
                досліду додатково потрібні пружина й набір тягарців.
                Тренувальний маятник доступний нижче в браузері.
              </p>
            </section>
            <section id="guide-theory" className={styles.section}>
              <div className={styles.sectionNumber}>
                02 / ПРАВИЛЬНО ВИЗНАЧ ВЕЛИЧИНИ
              </div>
              <h2>Один цикл — це рух туди й назад</h2>
              <div className={styles.formulaCard}>
                <Formula />
                <dl>
                  <div>
                    <dt>T — період, с</dt>
                    <dd>час одного повного коливання</dd>
                  </div>
                  <div>
                    <dt>t — виміряний час, с</dt>
                    <dd>час саме N повних коливань</dd>
                  </div>
                  <div>
                    <dt>N — кількість коливань</dt>
                    <dd>ціле число завершених циклів</dd>
                  </div>
                </dl>
              </div>
              <div className={styles.callout}>
                <strong>Довжина l — від точки підвісу до центра кульки.</strong>
                <p>
                  Амплітуда A — найбільше відхилення від рівноваги. Тут її
                  задаємо як довжину дуги; за малих кутів виміряна лінійкою
                  горизонтальна відстань приблизно дорівнює A.
                </p>
              </div>
              <h3>Модель для малих кутів</h3>
              <p
                className={styles.modelFormula}
                role="math"
                aria-label="Період приблизно дорівнює двом пі, помноженим на корінь з відношення довжини до прискорення вільного падіння"
              >
                T ≈ 2π√(l / g)
              </p>
              <p>
                Наближення описує малу важку кульку на легкій нерозтяжній нитці
                за слабкого опору руху. Незалежність періоду від амплітуди є
                наближеною: для великих кутів період зростає. У віртуальній
                моделі прийнято g = 10 м/с².
              </p>
              <details className={styles.disclosure}>
                <summary>Чому важливо зберігати малий кут?</summary>
                <p>
                  Кутова амплітуда в радіанах дорівнює A / l, якщо A виміряно
                  вздовж дуги. За тієї самої A коротший маятник відхиляється на
                  більший кут. У віртуальних серіях кути не перевищують
                  приблизно 6°. Формула малих кутів не перевіряє вплив великих
                  амплітуд.
                </p>
              </details>
            </section>
            <section id="guide-method" className={styles.section}>
              <div className={styles.sectionNumber}>03 / ХІД РОБОТИ</div>
              <h2>Три серії. Одна змінна в кожній.</h2>
              <ol className={styles.method}>
                {labThreeMethod.map((step) => (
                  <li key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
              {labThreeSeries.map((series) => (
                <div className={styles.callout} key={series.id}>
                  <h3>{series.title}</h3>
                  <p>
                    <strong>Змінюємо:</strong> {series.change}
                  </p>
                  <p>
                    <strong>Зберігаємо:</strong> {series.fixed}
                  </p>
                  <p>{series.note}</p>
                </div>
              ))}
              <h3>Що записати у звіт</h3>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>Кожна серія має два окремі рядки вимірювань</caption>
                  <thead>
                    <tr>
                      <th scope="col">Серія</th>
                      <th scope="col">Задана величина</th>
                      <th scope="col">Виміряні дані</th>
                      <th scope="col">Розрахунок</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">A</th>
                      <td>l, A</td>
                      <td>N, t</td>
                      <td>T = t / N</td>
                    </tr>
                    <tr>
                      <th scope="row">l</th>
                      <td>l</td>
                      <td>N, t</td>
                      <td>T = t / N</td>
                    </tr>
                    <tr>
                      <th scope="row">m</th>
                      <td>l, m</td>
                      <td>N, t</td>
                      <td>T = t / N</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className={styles.note}>
                Довжини й амплітуди вводь у метрах, маси — у кілограмах, час — у
                секундах. Якщо відомі маси позначені на кульках, зазнач це у
                висновку; задані умови та модельні покази не називай реальними
                вимірюваннями.
              </p>
            </section>
            <section id="guide-experiment" className={styles.section}>
              <div className={styles.sectionNumber}>04 / СПРОБУЙ</div>
              <h2>Обери величину для дослідження</h2>
              <p>
                Перемикай серії A, l та m. Геометрія основного маятника показує
                довжину в сталому масштабі. Окрема нижня шкала збільшує
                відхилення вздовж дуги, щоб малі коливання було зручніше
                порівнювати.
              </p>
              <div className={styles.practiceNotice}>
                <strong>Тренування без збереження.</strong> Тут можна
                випробувати три серії. Для здавання відкрий призначену роботу й
                перенеси покази у звіт у дозволеному вчителем режимі.
              </div>
              <PendulumPractice />
              <details className={styles.disclosure}>
                <summary>Межі моделі та початок відліку</summary>
                <p>
                  Кулька починає рух із правого крайнього положення без
                  початкового поштовху. Кут змінюється гармонічно, а t = N · T.
                  Затухання, розтягнення нитки та поправки на великі кути не
                  моделюються. Однакові періоди для різних мас чи малих амплітуд
                  випливають із прийнятої моделі; реальний дослід перевіряй за
                  власними вимірюваннями.
                </p>
                <p>
                  Секундомір показує фізичний час моделі. Анімація може бути
                  прискореною. Кулька зображена схематично: її розмір не передає
                  фізичний радіус. Під час зміни маси довжина вимірюється до
                  того самого центра.
                </p>
              </details>
            </section>
            <section id="guide-questions" className={styles.section}>
              <div className={styles.sectionNumber}>05 / ПОЯСНИ</div>
              <h2>Розрізняй модель, шлях і переміщення</h2>
              {labThreeQuestions.map((q, i) => (
                <div className={styles.controlQuestion} key={q.title}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{q.title}</h3>
                    <p>{q.text}</p>
                  </div>
                </div>
              ))}
              <p className={styles.note}>
                Друге запитання стосується прямо заданих прямолінійних
                гармонічних коливань. Відповіді, пояснення й числові обчислення
                запиши у звіті самостійно.
              </p>
            </section>
            <section id="guide-conclusion" className={styles.section}>
              <div className={styles.sectionNumber}>06 / ЗРОБИ ВИСНОВОК</div>
              <h2>Висновок має спиратися на дані</h2>
              <ul className={styles.checklist}>
                <li>
                  Які періоди отримали для двох амплітуд, двох довжин і двох
                  мас? Наведи числові значення з одиницями.
                </li>
                <li>Які умови залишалися сталими в кожній серії?</li>
                <li>
                  Чи узгоджуються результати з прогнозом і наближенням малих
                  кутів?
                </li>
                <li>
                  Чи дозволяє точність досліду розрізнити отримані значення?
                </li>
                <li>
                  Як вплинули вимірювання довжини, лічба циклів, реакція людини,
                  поштовх і затухання?
                </li>
              </ul>
              <div className={styles.creative}>
                <span className={styles.sectionNumber}>
                  ДОСЛІДЖЕННЯ ІЗ ЗІРОЧКОЮ
                </span>
                <h3>А якщо замість нитки — пружина?</h3>
                <p>
                  Із реальним обладнанням підвісь тягарець до пружини та
                  дочекайся нового положення рівноваги. Задай малі вертикальні
                  коливання й виміряй час кількох повних циклів. Повтори для
                  іншої маси з тією самою пружиною.
                </p>
                <p>
                  Зберігай жорсткість пружини та малу амплітуду, не перевищуй
                  меж пружної деформації. Відлік веди відносно нового положення
                  рівноваги після кожної зміни маси. Порівняй періоди й
                  сформулюй окремий висновок для пружинного маятника.
                </p>
                <p>
                  Пружинний і нитяний маятники мають різні моделі. Віртуальний
                  прилад цієї сторінки моделює нитяний маятник.
                </p>
              </div>
            </section>
            <footer className={styles.source}>
              <p>
                Навчальна вебадаптація лабораторної роботи № 3 за матеріалами
                Назара Щура, «ФІЗИКА НОВА». Уточнено межі застосовності моделі,
                вимірювання довжини, відлік циклів та умови контрольних
                запитань.
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
                  Повний цикл:
                  <br />
                  туди й назад.
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
