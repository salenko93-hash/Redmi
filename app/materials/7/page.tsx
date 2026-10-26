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
import { labSevenMethod, labSevenQuestions } from "@/lib/lab-seven-material";
import { initialParameters, simulate } from "@/lib/simulation";
import { Shell } from "@/components/shell";
import { FrictionScene } from "@/components/friction-scene";
import { VirtualLab } from "@/components/virtual-lab";
import { MaterialPrint } from "@/components/material-print";
import styles from "../guide.module.css";
export const metadata: Metadata = {
  title: "Лабораторна № 7 — Коефіцієнт тертя ковзання",
};
function Formula() {
  return (
    <span
      className={styles.formula}
      role="math"
      aria-label="Коефіцієнт тертя ковзання дорівнює силі тертя, поділеній на реакцію опори"
    >
      <i>μ</i>
      <span>=</span>
      <span className={styles.fraction}>
        <i>Fтертя</i>
        <i>N</i>
      </span>
    </span>
  );
}
export default async function LabSevenMaterial() {
  const user = await currentUser();
  if (!user) redirect("/");
  const template = await db.labVersion.findFirst({
    where: { number: 7, authorId: null },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  const p = initialParameters(7, "friction"),
    r = simulate(7, "friction", p);
  const sections = [
    ["guide-purpose", "Мета й обладнання"],
    ["guide-theory", "Сили та умови рівноваги"],
    ["guide-method", "Три навантаження"],
    ["guide-experiment", "Віртуальний дослід"],
    ["guide-questions", "Контрольні запитання"],
    ["guide-conclusion", "Висновок і площа опори"],
  ];
  return (
    <Shell title="Навчальні матеріали · Робота № 7">
      <article className={styles.guide} id="lab-seven-guide">
        <div className={`${styles.topline} no-print`}>
          <Link
            href={template ? `/library/${template.id}` : "/library"}
            className="back-link"
          >
            <ArrowLeft size={16} /> До роботи № 7
          </Link>
          <MaterialPrint />
        </div>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>
              ФІЗЛАБ / ЛАБОРАТОРНА РОБОТА 07
            </span>
            <h1>Тертя: виміряй опір ковзанню</h1>
            <p>
              Збільш навантаження, збережи сталу швидкість і порівняй сили. Чи
              зміниться коефіцієнт тертя, якщо повернути брусок?
            </p>
            <div className={styles.heroMeta}>
              <span>
                <Clock3 size={16} /> Орієнтовно 35 хв
              </span>
              <span>
                <FlaskConical size={16} /> 3 навантаження · 2 грані
              </span>
            </div>
            <a href="#guide-method" className={styles.heroButton}>
              Почати дослідження <ArrowDown size={17} />
            </a>
          </div>
          <div className={styles.heroVisual}>
            <svg
              viewBox="0 0 600 460"
              className="simulation-scene"
              role="img"
              aria-label="Брусок на дошці, горизонтальний динамометр і схема сил за рівномірного ковзання"
            >
              <FrictionScene
                parameters={p}
                result={r}
                phase={1}
                id="friction-hero"
              />
            </svg>
            <div className={styles.visualCaption}>
              <span>07 / СПІВСТАВ СИЛИ</span>
              <span>Навантаження → ковзання → відношення</span>
            </div>
          </div>
        </header>
        <div className={styles.layout}>
          <div className={styles.reading}>
            <section id="guide-purpose" className={styles.section}>
              <div className={styles.sectionNumber}>01 / ПІДГОТОВКА</div>
              <h2>Одна пара поверхонь — три навантаження</h2>
              <p>
                Визначимо коефіцієнт тертя ковзання дерева по дереву й
                перевіримо, як змінюються сила тертя та її відношення до реакції
                опори.
              </p>
              <div className={styles.question}>
                Брусок важче тягнути. Чи означає це, що коефіцієнт тертя став
                більшим?
              </div>
              <h3>Підготуй обладнання</h3>
              <ul className={styles.equipment}>
                {[
                  "Дерев’яний брусок",
                  "Горизонтальна дерев’яна дошка",
                  "Однакові тягарці",
                  "Динамометр",
                ].map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.note}>
                Перевір межу динамометра, надійність кріплення й розташування
                тягарців. Не допускай їх падіння з бруска або виходу бруска за
                край стола. Реальні навантаження та поверхні погоджує вчитель.
              </p>
            </section>
            <section id="guide-theory" className={styles.section}>
              <div className={styles.sectionNumber}>02 / СИЛИ Й ФОРМУЛИ</div>
              <h2>Показ динамометра стає силою тертя за певних умов</h2>
              <div className={styles.formulaCard}>
                <Formula />
                <dl>
                  <div>
                    <dt>Fтертя — сила тертя ковзання</dt>
                    <dd>у ньютонах, Н</dd>
                  </div>
                  <div>
                    <dt>N — сила нормальної реакції опори</dt>
                    <dd>у ньютонах, Н; це не маса</dd>
                  </div>
                  <div>
                    <dt>μ — коефіцієнт тертя ковзання</dt>
                    <dd>без одиниць: ньютони скорочуються</dd>
                  </div>
                </dl>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>Дві незалежні умови вимірювання</caption>
                  <thead>
                    <tr>
                      <th scope="col">Умова</th>
                      <th scope="col">Що з неї випливає</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Рух прямолінійний і рівномірний</th>
                      <td>
                        Горизонтальні сили урівноважені: Fтяги = Fтертя. Не
                        знімаємо початковий пік.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Дошка й тяга горизонтальні</th>
                      <td>
                        Без вертикального прискорення N = mg = Pбрус + nPтягар
                        для однакових тягарців.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Умови поверхонь збережено</th>
                      <td>
                        Порівнюємо μ у дослідженому діапазоні з урахуванням
                        повторюваності та похибки.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.callout}>
                <strong>
                  Сила тертя та коефіцієнт тертя — різні величини.
                </strong>
                <p>
                  У наближеній моделі Fтертя = μN сила зростає з навантаженням,
                  а μ для тієї самої пари поверхонь залишається приблизно
                  сталим. Це перевіряють дослідом, а не оголошують наперед.
                </p>
              </div>
              <details className={styles.disclosure}>
                <summary>
                  Чим тертя спокою відрізняється від тертя ковзання?
                </summary>
                <p>
                  До початку ковзання тертя спокою пристосовується до
                  прикладеної сили, але має граничне значення: Fсп ≤ μспN.
                  Рівність відповідає межі зриву. Під час ковзання
                  використовують інший коефіцієнт μковз; він не визначає
                  автоматично поріг початку руху.
                </p>
                <p>
                  Якщо брусок прискорюється або сповільнюється, показ тяги не
                  дорівнює силі тертя. Якщо нитка піднята вгору, вона змінює N.
                  У досліді усуваємо обидві причини.
                </p>
              </details>
              <p className={styles.note}>
                μ є безрозмірним і не має універсального обмеження «не більше
                одиниці». Таблиця потрібна для конкретних матеріалів та умов;
                довільні поверхні не мають одного точного спільного μ.
              </p>
            </section>
            <section id="guide-method" className={styles.section}>
              <div className={styles.sectionNumber}>03 / ХІД РОБОТИ</div>
              <h2>Знімай показ після початку руху</h2>
              <ol className={styles.method}>
                {labSevenMethod.map((step) => (
                  <li key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>План вимірювань · широкою гранню</caption>
                  <thead>
                    <tr>
                      <th scope="col">Навантаження</th>
                      <th scope="col">Реакція опори</th>
                      <th scope="col">Вимірювання</th>
                      <th scope="col">Обчислення</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((n) => (
                      <tr key={n}>
                        <th scope="row">
                          {n} {n === 1 ? "тягарець" : "тягарці"}
                        </th>
                        <td>Pбрус + {n === 1 ? "" : `${n}·`}Pтягар</td>
                        <td>Стійкий Fтертя, Н</td>
                        <td>μ = Fтертя/N</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.callout}>
                <strong>
                  Зберігай стан поверхонь, напрям руху та приблизну швидкість.
                </strong>
                <p>
                  Якщо стрілка коливається, запиши спостережений діапазон і
                  повтори прохід. Поясни, як вибрано представницький показ; не
                  приймай випадковий максимум за результат рівномірного
                  ковзання.
                </p>
              </div>
              <details className={styles.disclosure}>
                <summary>Як порівнювати результати?</summary>
                <p>
                  Порівняй три μ та розкид повторних проходів. Якщо вони
                  узгоджені в межах похибки, сформулюй висновок лише для
                  досліджених навантажень і умов. Відмінність від довідника може
                  пояснюватися вологістю, шорсткістю, напрямом волокон,
                  зношенням і методикою.
                </p>
                <p>
                  На графіку Fтертя(N) перевіряй узгодженість із прямою через
                  початок координат, не підганяй точки. Якщо береш середнє μ,
                  поясни спосіб усереднення; відношення середніх і середнє
                  відношень не завжди збігаються.
                </p>
              </details>
            </section>
            <section id="guide-experiment" className={styles.section}>
              <div className={styles.sectionNumber}>04 / СПРОБУЙ</div>
              <h2>Змінюй одну умову за раз</h2>
              <p>
                Порівняй 1, 2 та 3 тягарці на тій самій поверхні. Потім поверни
                брусок, зберігши навантаження. Нитка та динамометр залишаються
                горизонтальними, а схема сил показує рівновагу у двох напрямах.
              </p>
              <div className={styles.practiceNotice}>
                <strong>Тренування без збереження.</strong> Для здавання відкрий
                призначену роботу в дозволеному вчителем режимі. Тут покази не
                потрапляють у журнал.
              </div>
              <VirtualLab
                number={7}
                experiment={labs[6].content.experiments[0]}
                allowTransfer={false}
              />
              <details className={styles.disclosure}>
                <summary>Межі моделі</summary>
                <p>
                  Рівномірне горизонтальне ковзання, Fтертя = μN. Маса бруска
                  200 г, тягарця 100 г, g ≈ 10 Н/кг. Значення μ для трьох
                  поверхонь задані умовно, це не довідник реальних сортів
                  деревини. Реакція N обчислюється моделлю за масою; у реальному
                  досліді її знаходять із попереднього зважування.
                </p>
                <p>
                  Модель не описує початок руху, тертя спокою, залежність від
                  швидкості, зношення, перекидання чи зсув тягарців. Поворот
                  грані не змінює заданого μ; це наслідок прийнятого наближення,
                  який не замінює експериментальної перевірки.
                </p>
                <p>
                  Усі сили на схемі мають один умовний масштаб. Цифрові покази
                  ідеальні; кількість десяткових знаків не визначає точність
                  реального динамометра. Анімація схематична, шлях і швидкість
                  за її тривалістю не вимірюють.
                </p>
              </details>
            </section>
            <section id="guide-questions" className={styles.section}>
              <div className={styles.sectionNumber}>05 / ПОЯСНИ</div>
              <h2>Перевір, чи достатньо даних</h2>
              {labSevenQuestions.map((q, i) => (
                <div className={styles.controlQuestion} key={q.title}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{q.title}</h3>
                    <p>{q.text}</p>
                  </div>
                </div>
              ))}
              <p className={styles.note}>
                В останньому завданні умову уточнено явно: числовий розрахунок
                виконується для вже рухомого бруска, поки він ковзає вправо.
                Після можливої зупинки потрібна модель тертя спокою. Готові
                числові відповіді запиши самостійно у звіті.
              </p>
            </section>
            <section id="guide-conclusion" className={styles.section}>
              <div className={styles.sectionNumber}>06 / ВИСНОВОК</div>
              <h2>Порівняй відношення, а не лише сили</h2>
              <ul className={styles.checklist}>
                <li>Яку пару поверхонь і який вид тертя досліджували?</li>
                <li>
                  Які три значення μ отримали й який розкид показів
                  спостерігали?
                </li>
                <li>
                  Чи узгоджується μ для різних навантажень у межах похибки?
                </li>
                <li>Чи відповідає довідкове значення умовам твого досліду?</li>
                <li>
                  Як вплинули нахил тяги, нерівномірний рух і стан поверхонь?
                </li>
              </ul>
              <div className={styles.creative}>
                <span className={styles.sectionNumber}>
                  ДОСЛІДЖЕННЯ ІЗ ЗІРОЧКОЮ
                </span>
                <h3>Менша грань — інша сила тертя?</h3>
                <p>
                  Поверни брусок на вужчу грань. Для кожного з трьох навантажень
                  збережи ту саму загальну вагу, стан поверхонь, напрям і
                  приблизну швидкість руху. Знову тягни горизонтально, не
                  допускаючи перекидання.
                </p>
                <div className={styles.tableWrap}>
                  <table className={styles.measurements}>
                    <caption>
                      План парного порівняння · дані запиши в творчому завданні
                      звіту
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Пара</th>
                        <th scope="col">Незмінне</th>
                        <th scope="col">Порівнюємо</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3].map((n) => (
                        <tr key={n}>
                          <th scope="row">
                            {n} {n === 1 ? "тягарець" : "тягарці"}
                          </th>
                          <td>Однакова N на обох гранях</td>
                          <td>Fшир, Fвуз, μшир, μвуз</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>
                  У простій моделі сухого ковзання сила тертя приблизно не
                  залежить від видимої площі контакту за сталої N. Для реальних
                  тіл деформація, шорсткість, тиск і напрям волокон можуть
                  змінювати результат. Зроби висновок за даними та їхнім
                  розкидом.
                </p>
              </div>
            </section>
            <footer className={styles.source}>
              <p>
                Навчальна вебадаптація лабораторної роботи № 7 за матеріалами
                Назара Щура, «ФІЗИКА НОВА». Уточнено умови вимірювання, тертя
                спокою й ковзання, порівняння поверхонь та площі контакту.
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
                  Та сама поверхня.
                  <br />
                  Контрольовані умови.
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
