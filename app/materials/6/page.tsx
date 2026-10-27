import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  FlaskConical,
  CheckCircle2,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { labs } from "@/lib/labs";
import { labSixMethod, labSixQuestions } from "@/lib/lab-six-material";
import { initialParameters, simulate } from "@/lib/simulation";
import { Shell } from "@/components/shell";
import { ElasticScene } from "@/components/elastic-scene";
import { VirtualLab } from "@/components/virtual-lab";
import { StiffnessFigure } from "@/components/stiffness-figure";
import { MaterialPrint } from "@/components/material-print";
import styles from "../guide.module.css";
export const metadata: Metadata = {
  title: "Лабораторна № 6 — Пружні властивості тіл",
};
function Formula() {
  return (
    <span
      className={styles.formula}
      role="math"
      aria-label="Видовження дорівнює різниці довжин"
    >
      <i>x</i>
      <span>=</span>
      <i>l − l₀</i>
    </span>
  );
}
export default async function LabSixMaterial() {
  const user = await currentUser();
  if (!user) redirect("/");
  const template = await db.labVersion.findFirst({
    where: { number: 6, authorId: null },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  const p = initialParameters(6, "elastic"),
    r = simulate(6, "elastic", p);
  const sections = [
    ["guide-purpose", "Мета й обладнання"],
    ["guide-theory", "Пружність і закон Гука"],
    ["guide-method", "Вимірювання й таблиця"],
    ["guide-experiment", "Віртуальний дослід"],
    ["guide-questions", "Графіки й запитання"],
    ["guide-conclusion", "Висновок і з’єднання"],
  ];
  return (
    <Shell title="Навчальні матеріали · Робота № 6">
      <article className={styles.guide} id="lab-six-guide">
        <div className={`${styles.topline} no-print`}>
          <Link
            href={template ? `/library/${template.id}` : "/library"}
            className="back-link"
          >
            <ArrowLeft size={16} /> До роботи № 6
          </Link>
          <MaterialPrint />
        </div>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>
              ФІЗЛАБ / ЛАБОРАТОРНА РОБОТА 06
            </span>
            <h1>Пружність: що розповідає розтягнення</h1>
            <p>
              Додай навантаження, виміряй довжину, зніми вантаж. Чи завжди
              пружне тіло підкоряється закону Гука?
            </p>
            <div className={styles.heroMeta}>
              <span>
                <Clock3 size={16} /> Орієнтовно 40 хв
              </span>
              <span>
                <FlaskConical size={16} /> 4 навантаження + розвантаження
              </span>
            </div>
            <a href="#guide-method" className={styles.heroButton}>
              Почати дослідження <ArrowDown size={17} />
            </a>
          </div>
          <div className={styles.heroVisual}>
            <svg
              viewBox="0 0 600 610"
              className="simulation-scene"
              role="img"
              aria-label="Шнур на штативі, початкова й навантажена довжини та лінійка"
            >
              <ElasticScene
                id="material-six-elastic"
                parameters={p}
                result={r}
                phase={1}
              />
            </svg>
            <div className={styles.visualCaption}>
              <span>06 / ВИМІРЯЙ ЗМІНУ</span>
              <span>Навантаження → відлік → перевірка</span>
            </div>
          </div>
        </header>
        <div className={styles.layout}>
          <div className={styles.reading}>
            <section id="guide-purpose" className={styles.section}>
              <div className={styles.sectionNumber}>01 / ПІДГОТОВКА</div>
              <h2>Пружне — не завжди лінійне</h2>
              <p>
                Дослідимо розтягнення гумового шнура: як змінюються довжина й
                відношення F/x за різних навантажень та чи відновлюється довжина
                після їх зняття.
              </p>
              <div className={styles.question}>
                Як відрізнити повернення до початкової форми від пропорційності
                сили й видовження?
              </div>
              <h3>Підготуй обладнання</h3>
              <ul className={styles.equipment}>
                {[
                  "Гумовий шнур",
                  "Стійкий штатив",
                  "4 тягарці по 100 г",
                  "Лінійка",
                  "Надійний підвіс",
                ].map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.note}>
                Навантаження 100–400 г — план зі джерела, а не універсальна межа
                міцності будь-якого шнура. Допустимий діапазон і кріплення
                перевіряє вчитель. Додавай тягарці плавно, не розтягуй шнур у
                бік обличчя.
              </p>
            </section>
            <section id="guide-theory" className={styles.section}>
              <div className={styles.sectionNumber}>02 / ЗВ’ЯЗКИ Й ОДИНИЦІ</div>
              <h2>Три величини, які не слід плутати</h2>
              <div className={styles.formulaCard}>
                <Formula />
                <dl>
                  <div>
                    <dt>l₀ — початкова довжина</dt>
                    <dd>між двома позначеними точками без вантажу</dd>
                  </div>
                  <div>
                    <dt>l — довжина під навантаженням</dt>
                    <dd>між тими самими точками</dd>
                  </div>
                  <div>
                    <dt>x — видовження</dt>
                    <dd>зміна довжини, а не вся довжина</dd>
                  </div>
                </dl>
              </div>
              <div className={styles.callout}>
                <strong>
                  Довжини в сантиметрах? x у метрах = (l − l₀) / 100.
                </strong>
                <p>
                  1 см = 0,01 м; 100 г = 0,1 кг; 1 кН = 1000 Н. Перш ніж ділити
                  F на x, узгодь одиниці.
                </p>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>Формули та умови їх застосування</caption>
                  <thead>
                    <tr>
                      <th scope="col">Зв’язок</th>
                      <th scope="col">Коли застосовуємо</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Fпруж ≈ mg</th>
                      <td>
                        Підвішений вантаж у спокої; m — загальна підвішена маса
                        в кг. У цій роботі g ≈ 10 Н/кг.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">F/x, Н/м</th>
                      <td>
                        Обчислюємо окремо для кожного ненульового x. Сталість
                        перевіряємо за даними.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">F = kx</th>
                      <td>
                        Закон Гука: пряма через початок координат у лінійному
                        робочому діапазоні. k — стала жорсткість.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Пружність означає відновлення форми після розвантаження.
                Нелінійний елемент теж може бути пружним, хоча F/x змінюється.
                За нелінійного графіка відношення F/x не дорівнює нахилу
                дотичної ΔF/Δx у границі малої зміни.
              </p>
              <details className={styles.disclosure}>
                <summary>Чому гума повертається не одразу?</summary>
                <p>
                  Реальна гума може мати повільне відновлення, залежність від
                  часу та гістерезис: під час навантаження й розвантаження
                  значення можуть відрізнятися. Записуй час очікування. Один
                  відлік після зняття вантажу не доводить незворотність
                  деформації.
                </p>
              </details>
            </section>
            <section id="guide-method" className={styles.section}>
              <div className={styles.sectionNumber}>03 / ХІД РОБОТИ</div>
              <h2>Чотири відліки й обов’язкове розвантаження</h2>
              <ol className={styles.method}>
                {labSixMethod.map((step) => (
                  <li key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>
                    План навантажень із джерела · за g ≈ 10 Н/кг і без
                    додаткової маси підвісу
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Маса</th>
                      <th scope="col">Розрахункова сила</th>
                      <th scope="col">Власні вимірювання та обчислення</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((n) => (
                      <tr key={n}>
                        <th scope="row">{n * 100} г</th>
                        <td>≈ {n} Н</td>
                        <td>l₀, l → x у м → F/x у Н/м</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.callout}>
                <strong>
                  Після зняття вантажу запиши довжину, час очікування та
                  порівняння з l₀ у висновку.
                </strong>
                <p>
                  За x = 0 відношення F/x не обчислюємо. Точка без вантажу
                  допомагає перевірити повернення, але не замінює один із
                  чотирьох навантажених дослідів.
                </p>
              </div>
              <details className={styles.disclosure}>
                <summary>Що може спотворити результат?</summary>
                <p>
                  Зміна точок відліку, ненульовий початковий натяг, паралакс,
                  ковзання кріплення, неврахована маса підвісу, коливання та
                  різний час очікування. Похибка різниці l − l₀ стає особливо
                  істотною за малого видовження. Оцінюй відхилення з урахуванням
                  точності лінійки.
                </p>
              </details>
            </section>
            <section id="guide-experiment" className={styles.section}>
              <div className={styles.sectionNumber}>04 / СПРОБУЙ</div>
              <h2>Порівняй шнур та ідеальну пружину</h2>
              <p>
                Вибери елемент, задай масу та початкову довжину. Шкала лінійки,
                відрізки l₀, l та x мають спільний масштаб. Для перевірки
                розвантаження встанови 0 г та запусти відлік.
              </p>
              <div className={styles.practiceNotice}>
                <strong>Тренування без збереження.</strong> Покази не
                потрапляють у журнал. Для здавання відкрий призначену роботу в
                дозволеному вчителем режимі.
              </div>
              <VirtualLab
                number={6}
                experiment={labs[5].content.experiments[0]}
                allowTransfer={false}
              />
              <details className={styles.disclosure}>
                <summary>Межі моделі</summary>
                <p>
                  Для шнура задано F = 20x + 25000x³, для пружини — F = 20x, де
                  F у Н, x у м. Це умовні силові характеристики, не виміряні
                  властивості конкретної гуми. Кінцеві покази відповідають
                  статичній рівновазі; анімація лише ілюструє перехід.
                </p>
                <p>
                  Обидві моделі оборотні: пластичність, гістерезис, повільне
                  відновлення, власна вага елемента й маса підвісу не враховані.
                  За ними не можна дослідити виникнення залишкової деформації
                  або межу міцності.
                </p>
                <p>
                  Налаштування l₀ змінює початкову геометрію моделі за незмінної
                  силової характеристики. Це не моделює відрізання шматка
                  реального шнура: його жорсткість залежить і від довжини та
                  перерізу.
                </p>
              </details>
            </section>
            <section id="guide-questions" className={styles.section}>
              <div className={styles.sectionNumber}>05 / ПОЯСНИ</div>
              <h2>Від нахилу прямої до меж моделі</h2>
              {labSixQuestions.map((q, i) => (
                <div key={q.title}>
                  <div className={styles.controlQuestion}>
                    <span>{i + 1}</span>
                    <div>
                      <h3>{q.title}</h3>
                      <p>{q.text}</p>
                    </div>
                  </div>
                  {i === 0 && <StiffnessFigure />}
                </div>
              ))}
              <p className={styles.note}>
                Графік пружин є якісною ілюстрацією з джерела. Графік свого
                шнура побудуй за власними чотирма точками у звіті; готові
                результати тут не підставляються.
              </p>
            </section>
            <section id="guide-conclusion" className={styles.section}>
              <div className={styles.sectionNumber}>06 / ЗРОБИ ВИСНОВОК</div>
              <h2>Спочатку спостереження, потім узагальнення</h2>
              <ul className={styles.checklist}>
                <li>Як змінюється довжина зі збільшенням навантаження?</li>
                <li>
                  Чи стале F/x у дослідженому діапазоні з урахуванням похибки?
                </li>
                <li>
                  Чи узгоджуються точки F(x) з прямою через початок координат?
                </li>
                <li>
                  Яка довжина після розвантаження, через який час її виміряно та
                  як вона співвідноситься з l₀?
                </li>
                <li>
                  Які обмеження досліду не дозволяють робити висновки про інші
                  навантаження?
                </li>
              </ul>
              <div className={styles.creative}>
                <span className={styles.sectionNumber}>
                  ДОСЛІДЖЕННЯ ІЗ ЗІРОЧКОЮ
                </span>
                <h3>Два елементи: разом — по-різному</h3>
                <p>
                  Порівняй два однакові елементи за тієї самої загальної сили F.
                  У послідовному з’єднанні через обидва передається та сама
                  сила, а видовження додаються. У паралельному з’єднанні
                  видовження однакове, а сили додаються.
                </p>
                <p>
                  Для однакових лінійних пружин зі сталою k отримуємо kпосл =
                  k/2 та kпарал = 2k. Для нелінійних шнурів користуйся їхньою
                  залежністю F(x), а не одним сталим k.
                </p>
                <p>
                  Скручування двох шнурів змінює геометрію та натяг. Це окрема
                  система, яку не слід без перевірки ототожнювати з паралельними
                  прямими шнурами. Запропонуй план порівняння з однаковою
                  загальною силою, чіткими точками відліку та погодженим
                  учителем діапазоном.
                </p>
              </div>
            </section>
            <footer className={styles.source}>
              <p>
                Навчальна вебадаптація лабораторної роботи № 6 за матеріалами
                Назара Щура, «ФІЗИКА НОВА». Уточнено розрізнення пружності й
                лінійності, одиниці, розвантаження та межі моделювання.
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
                  Виміряй різницю.
                  <br />
                  Перевір повернення.
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
