import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Scale,
  CheckCircle2,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { labs } from "@/lib/labs";
import { labFourMethod, labFourQuestions } from "@/lib/lab-four-material";
import { Shell } from "@/components/shell";
import { BalanceScene } from "@/components/balance-scene";
import { StonesFigure } from "@/components/stones-figure";
import { VirtualLab } from "@/components/virtual-lab";
import { MaterialPrint } from "@/components/material-print";
import styles from "../guide.module.css";

export const metadata: Metadata = {
  title: "Лабораторна № 4 — Вимірювання маси тіл",
};
function Formula() {
  return (
    <span
      className={styles.formula}
      role="math"
      aria-label="За рівноваги рівноплечих терезів маса тіла дорівнює сумі мас важків"
    >
      <i>m</i>
      <span>=</span>
      <span>
        Σ<i>m</i>
        <sub>і</sub>
      </span>
    </span>
  );
}
const sampleWeights = [
  { key: "sample20", label: "20 г", count: 2 },
  { key: "sample5", label: "5 г", count: 1 },
  { key: "sample1", label: "1 г", count: 1 },
  { key: "sample200", label: "200 мг", count: 2 },
  { key: "sample50", label: "50 мг", count: 1 },
  { key: "sample20mg", label: "20 мг", count: 1 },
];

export default async function LabFourMaterial() {
  const user = await currentUser();
  if (!user) redirect("/");
  const template = await db.labVersion.findFirst({
    where: { number: 4, authorId: null },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  const sections = [
    ["guide-purpose", "Мета й обладнання"],
    ["guide-theory", "Рівновага й одиниці"],
    ["guide-method", "Хід роботи"],
    ["guide-experiment", "Віртуальні терези"],
    ["guide-questions", "Контрольні запитання"],
    ["guide-conclusion", "Точність і дослідження"],
  ];
  return (
    <Shell title="Навчальні матеріали · Робота № 4">
      <article className={styles.guide} id="lab-four-guide">
        <div className={`${styles.topline} no-print`}>
          <Link
            href={template ? `/library/${template.id}` : "/library"}
            className="back-link"
          >
            <ArrowLeft size={16} /> До роботи № 4
          </Link>
          <MaterialPrint />
        </div>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>
              ФІЗЛАБ / ЛАБОРАТОРНА РОБОТА 04
            </span>
            <h1>Вимірювання маси тіл</h1>
            <p>
              Знайди рівновагу. Порахуй важки. Навчися відрізняти записане число
              від точності вимірювання.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <Clock3 size={16} /> Орієнтовно 30 хв
              </span>
              <span>
                <Scale size={16} /> 4 власні зважування
              </span>
            </div>
            <a href="#guide-method" className={styles.heroButton}>
              Почати дослідження <ArrowDown size={17} />
            </a>
          </div>
          <div className={styles.heroVisual}>
            <svg
              viewBox="0 0 600 350"
              className="simulation-scene"
              role="img"
              aria-label="Навчальний приклад зважування навушників на рівноплечих терезах"
            >
              <BalanceScene
                difference={0}
                leftLabel="Навушники · приклад"
                loads={sampleWeights}
                status="Навчальний приклад: рівновага"
                id="material-balance"
              />
            </svg>
            <div className={styles.visualCaption}>
              <span>04 / ЗНАЙДИ РІВНОВАГУ</span>
              <span>Номінал × кількість → маса</span>
            </div>
          </div>
        </header>
        <div className={styles.layout}>
          <div className={styles.reading}>
            <section id="guide-purpose" className={styles.section}>
              <div className={styles.sectionNumber}>01 / ПІДГОТОВКА</div>
              <h2>Що показує рівновага терезів?</h2>
              <p>
                Навчимося користуватися рівноплечими важільними терезами,
                добирати важки та визначати масу тіл за станом рівноваги.
                Виконаємо чотири власні зважування.
              </p>
              <div className={styles.question}>
                Як визначити масу тіла, якщо на терезах немає цифрового показу?
              </div>
              <h3>Підготуй обладнання</h3>
              <ul className={styles.equipment}>
                {[
                  "Рівноплечі терези",
                  "Набір важків",
                  "Чотири тіла для зважування",
                  "Тара за потреби",
                ].map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.note}>
                Дотримуйся допустимого навантаження приладу. Бери дрібні важки
                пінцетом, якщо це передбачено набором. Порожні шальки мають бути
                зрівноважені до початку роботи.
              </p>
            </section>
            <section id="guide-theory" className={styles.section}>
              <div className={styles.sectionNumber}>
                02 / РІВНОВАГА Й ОДИНИЦІ
              </div>
              <h2>Кожен важок має значення</h2>
              <div className={styles.formulaCard}>
                <Formula />
                <dl>
                  <div>
                    <dt>m — маса тіла</dt>
                    <dd>для рівноплечих терезів за рівноваги</dd>
                  </div>
                  <div>
                    <dt>Σmі — сума мас усіх важків</dt>
                    <dd>кількість кожного номіналу враховуємо окремо</dd>
                  </div>
                  <div>
                    <dt>Якщо використано тару</dt>
                    <dd>маса тіла = загальна маса − маса тари</dd>
                  </div>
                </dl>
              </div>
              <div className={styles.callout}>
                <strong>1 кг = 1000 г · 1 г = 1000 мг · 1 мг = 0,001 г.</strong>
                <p>
                  Перш ніж додавати або порівнювати маси, переведи їх в однакові
                  одиниці. Основна одиниця маси в СІ — кілограм; у таблиці цієї
                  роботи результат записуємо в грамах.
                </p>
              </div>
              <details className={styles.disclosure}>
                <summary>Розберемо приклад із джерела</summary>
                <p>
                  Для навушників у PDF наведено 2 × 20 г, 5 г, 1 г, 2 × 200 мг,
                  50 мг і 20 мг. Міліграмові важки разом дають 470 мг = 0,470 г.
                  Загальна маса за цими номіналами — 46,47 г.
                </p>
                <p>
                  Це готовий навчальний приклад, а не твій результат. У джерелі
                  один рядок зайнято ним, а чотири залишено для власних
                  зважувань. Кількість десяткових знаків у сумі не визначає
                  автоматично похибку реального приладу.
                </p>
              </details>
            </section>
            <section id="guide-method" className={styles.section}>
              <div className={styles.sectionNumber}>03 / ХІД РОБОТИ</div>
              <h2>Від нуля до власного результату</h2>
              <ol className={styles.method}>
                {labFourMethod.map((step) => (
                  <li key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>Чотири власні рядки звіту</caption>
                  <thead>
                    <tr>
                      <th scope="col">Дослід</th>
                      <th scope="col">Тіло</th>
                      <th scope="col">Номінали й кількість</th>
                      <th scope="col">Маса, г</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((n) => (
                      <tr key={n}>
                        <th scope="row">{n}</th>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.note}>
                Схема таблиці не містить виміряних даних. Реальні тіла для
                досліду пропонує вчитель; у віртуальному режимі використовуються
                умовні модельні зразки. Зберігай результати у призначеній
                роботі.
              </p>
            </section>
            <section id="guide-experiment" className={styles.section}>
              <div className={styles.sectionNumber}>04 / СПРОБУЙ</div>
              <h2>Яка шалька нижча?</h2>
              <p>
                Обери тіло й добирай важки кнопками «+» та «−». Схема одразу
                показує напрям переваги шальок, номінали та їх кількість. Після
                рівноваги обчисли масу самостійно.
              </p>
              <div className={styles.practiceNotice}>
                <strong>Тренування без збереження.</strong> Цей прилад не
                записує покази у звіт. Для здавання відкрий призначену роботу й
                використай дозволений учителем режим експерименту.
              </div>
              <VirtualLab
                number={4}
                experiment={labs[3].content.experiments[0]}
                allowTransfer={false}
              />
              <details className={styles.disclosure}>
                <summary>Межі моделі</summary>
                <p>
                  Модель описує ідеальні рівноплечі терези з точними
                  номінальними масами важків. Вона приймає рівновагу, якщо
                  модуль різниці мас менший за 0,005 г. Це програмний поріг, а
                  не оцінка похибки реальних терезів.
                </p>
                <p>
                  Нахил показує напрям переваги шальки та має умовний масштаб.
                  Нестійкість нуля, коливання, тертя й реальні допуски важків
                  тут не відтворюються. Результати позначені як модельні.
                </p>
              </details>
            </section>
            <section id="guide-questions" className={styles.section}>
              <div className={styles.sectionNumber}>05 / ПОЯСНИ</div>
              <h2>Рахуй важки на обох шальках</h2>
              {labFourQuestions.map((q, i) => (
                <div key={q.title}>
                  <div className={styles.controlQuestion}>
                    <span>{i + 1}</span>
                    <div>
                      <h3>{q.title}</h3>
                      <p>{q.text}</p>
                    </div>
                  </div>
                  {i === 1 && <StonesFigure ignoreBagMass />}
                </div>
              ))}
              <p className={styles.note}>
                Сума важків і маса одного камінця обчислюються у твоєму звіті.
                Схема містить дані умови, готова відповідь на контрольне
                запитання не підставляється.
              </p>
            </section>
            <section id="guide-conclusion" className={styles.section}>
              <div className={styles.sectionNumber}>
                06 / ТОЧНІСТЬ І ВИСНОВОК
              </div>
              <h2>Число потребує пояснення</h2>
              <ul className={styles.checklist}>
                <li>Яку величину та яким приладом вимірювали?</li>
                <li>
                  Які чотири маси отримали? Наведи одиниці й набори важків.
                </li>
                <li>Чи перевіряли нуль і чи врахували тару?</li>
                <li>
                  Як на результат впливали чутливість приладу, стан важків,
                  коливання та зчитування рівноваги?
                </li>
                <li>
                  За яким критерієм порівнювали точність: абсолютна чи відносна
                  похибка? Чим обґрунтована її оцінка?
                </li>
              </ul>
              <details className={styles.disclosure}>
                <summary>Коли більша маса має меншу відносну похибку?</summary>
                <p>
                  Якщо абсолютна похибка Δm для двох зважувань однакова, то
                  відносну оцінюють як ε ≈ Δm / m · 100%. За цього припущення
                  більша маса має меншу відносну похибку. Без відомостей про
                  похибки не можна однозначно назвати одне зважування
                  найточнішим.
                </p>
                <p>
                  Оцінку Δm визначай разом із учителем за характеристиками
                  приладу та умовами досліду. Найменший важок і кількість цифр у
                  записі самі по собі такої оцінки не задають.
                </p>
              </details>
              <div className={styles.creative}>
                <span className={styles.sectionNumber}>
                  ДОСЛІДЖЕННЯ ІЗ ЗІРОЧКОЮ
                </span>
                <h3>Середня маса однієї зернини</h3>
                <p>
                  Порахуй N зернин одного виду та зваж їх разом. Якщо
                  використовуєш посудину, визнач її масу окремо або виконай
                  тарування. Обчисли середню масу: mсер = (mразом − mтари) / N.
                </p>
                <p>
                  Зважування більшої партії за тієї самої абсолютної похибки
                  приладу може зменшити відносну похибку середньої маси. Не
                  перевантажуй терези й не помились у підрахунку. Окремі зернини
                  можуть мати різні маси: результат є середнім для вибраної
                  партії.
                </p>
              </div>
              <details className={styles.disclosure}>
                <summary>Додатковий логічний виклик: 12 монет</summary>
                <p>
                  Серед 12 монет одна має іншу масу; невідомо, легша вона чи
                  важча. Побудуй алгоритм пошуку за три зважування на
                  рівноплечих терезах. Наступні дії можуть залежати від
                  попереднього результату: ліва шалька нижча, права нижча або
                  рівновага.
                </p>
                <p>
                  Це окрема складна логічна задача, а не обов’язкове вимірювання
                  маси в цій лабораторній. Саме порівняння кількості можливих
                  результатів не є повним алгоритмом; потрібно пояснити всі
                  гілки своєї стратегії.
                </p>
              </details>
            </section>
            <footer className={styles.source}>
              <p>
                Навчальна вебадаптація лабораторної роботи № 4 за матеріалами
                Назара Щура, «ФІЗИКА НОВА». Уточнено рівноплечість терезів,
                тарування, критерії точності й умову задачі про камінці.
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
              </div>
              <p className={styles.tocHint}>
                Спочатку нуль.
                <br />
                Потім рівновага й сума важків.
              </p>
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
