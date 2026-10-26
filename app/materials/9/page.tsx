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
import { labNineMethod, labNineQuestions } from "@/lib/lab-nine-material";
import { initialParameters, simulate } from "@/lib/simulation";
import { Shell } from "@/components/shell";
import { HydroScene } from "@/components/hydro-scene";
import { VirtualLab } from "@/components/virtual-lab";
import { MaterialPrint } from "@/components/material-print";
import styles from "../guide.module.css";
export const metadata: Metadata = {
  title: "Лабораторна № 9 — Гідростатичне зважування",
};
function Formula() {
  return (
    <span
      className={styles.formula}
      role="math"
      aria-label="Густина тіла дорівнює густині рідини, помноженій на P один, поділене на різницю P один та P два"
    >
      <i>ρтіла</i>
      <span>=</span>
      <i>ρрід</i>
      <span>·</span>
      <span className={styles.fraction}>
        <i>P₁</i>
        <i>P₁ − P₂</i>
      </span>
    </span>
  );
}
export default async function LabNineMaterial() {
  const user = await currentUser();
  if (!user) redirect("/");
  const template = await db.labVersion.findFirst({
    where: { number: 9, authorId: null },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  const p = initialParameters(9, "hydro"),
    r = simulate(9, "hydro", p);
  const sections = [
    ["guide-purpose", "Мета й обладнання"],
    ["guide-theory", "Два покази — одна густина"],
    ["guide-method", "Три зразки"],
    ["guide-experiment", "Віртуальне зважування"],
    ["guide-questions", "Контрольні запитання"],
    ["guide-conclusion", "Висновок та інша рідина"],
  ];
  return (
    <Shell title="Навчальні матеріали · Робота № 9">
      <article className={styles.guide} id="lab-nine-guide">
        <div className={`${styles.topline} no-print`}>
          <Link
            href={template ? `/library/${template.id}` : "/library"}
            className="back-link"
          >
            <ArrowLeft size={16} /> До роботи № 9
          </Link>
          <MaterialPrint />
        </div>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>
              ФІЗЛАБ / ЛАБОРАТОРНА РОБОТА 09
            </span>
            <h1>Два зважування. Одна густина.</h1>
            <p>
              Зразок залишається тим самим, а показ динамометра у воді
              зменшується. Використай цю різницю, щоб визначити густину.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <Clock3 size={16} /> Орієнтовно 35 хв
              </span>
              <span>
                <FlaskConical size={16} /> 3 зразки · 2 покази
              </span>
            </div>
            <a href="#guide-method" className={styles.heroButton}>
              Почати дослідження <ArrowDown size={17} />
            </a>
          </div>
          <div className={styles.heroVisual}>
            <svg
              viewBox="0 0 600 590"
              className="simulation-scene"
              role="img"
              aria-label="Порівняння однакових динамометрів: зразок у повітрі та повністю у воді"
            >
              <HydroScene parameters={p} result={r} phase={1} />
            </svg>
            <div className={styles.visualCaption}>
              <span>09 / ЗНАЙДИ РІЗНИЦЮ</span>
              <span>Повітря → вода → розрахунок</span>
            </div>
          </div>
        </header>
        <div className={styles.layout}>
          <div className={styles.reading}>
            <section id="guide-purpose" className={styles.section}>
              <div className={styles.sectionNumber}>01 / ПІДГОТОВКА</div>
              <h2>Густина без прямого вимірювання об’єму</h2>
              <p>
                Визначимо густину твердих тіл за двома показами динамометра: у
                повітрі та під час повного занурення у воду. Для суцільного
                однорідного зразка результат характеризує матеріал; для
                герметичного порожнистого — середню густину тіла.
              </p>
              <div className={styles.question}>
                Чи означає менший показ у воді, що маса або сила тяжіння
                зменшилися?
              </div>
              <h3>Підготуй обладнання</h3>
              <ul className={styles.equipment}>
                {[
                  "Динамометр",
                  "Три нерозчинні зразки",
                  "Тонка нитка",
                  "Посудина з водою",
                  "Стійкий підвіс",
                ].map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.note}>
                Обирай погоджені з учителем зразки, густіші за воду, які не
                вбирають її й не пошкоджуються. Перевір межу динамометра,
                кріплення та запас місця в посудині. Поверхня води залишається
                нижче приладу.
              </p>
            </section>
            <section id="guide-theory" className={styles.section}>
              <div className={styles.sectionNumber}>02 / ФІЗИЧНИЙ ЗМІСТ</div>
              <h2>Вода підтримує тіло, а не змінює його масу</h2>
              <div className={styles.formulaCard}>
                <Formula />
                <dl>
                  <div>
                    <dt>P₁ — показ у повітрі</dt>
                    <dd>приблизно mg, виштовхуванням повітрям нехтуємо</dd>
                  </div>
                  <div>
                    <dt>P₂ — показ у рідині</dt>
                    <dd>натяг підвісу для повністю зануреного тіла в спокої</dd>
                  </div>
                  <div>
                    <dt>ρрід — відома густина рідини</dt>
                    <dd>для навчального досліду з водою ≈1000 кг/м³</dd>
                  </div>
                </dl>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>Як отримати формулу в прийнятому наближенні</caption>
                  <thead>
                    <tr>
                      <th scope="col">Зв’язок</th>
                      <th scope="col">Пояснення</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">P₁ ≈ mg = ρтілаVg</th>
                      <td>
                        Підвішене тіло в спокої; виштовхування повітрям мале.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">P₂ = mg − FА</th>
                      <td>Рівновага у воді: сила Архімеда зменшує натяг.</td>
                    </tr>
                    <tr>
                      <th scope="row">P₁ − P₂ ≈ ρрідVg</th>
                      <td>
                        Весь об’єм тіла занурений, сторонніх контактів немає.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">ρтіла = ρрідP₁/(P₁−P₂)</th>
                      <td>
                        Об’єм і g скорочуються; визначаємо густину за
                        відношенням сил.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.callout}>
                <strong>Маса й сила тяжіння залишаються тими самими.</strong>
                <p>
                  P₂ — не нова маса. Це менший показ підвісу, оскільки частину
                  сили тяжіння врівноважує вода. Для підвісу згори в цій роботі
                  потрібно 0&lt;P₂&lt;P₁.
                </p>
              </div>
              <p>
                Обидва покази записуй в однакових одиницях сили — ньютонах.
                Відношення P₁/(P₁−P₂) безрозмірне, тому одиниці результату
                визначає ρрід. Не підміняй густину матеріалу середньою густиною
                порожнистого чи складеного тіла.
              </p>
              <details className={styles.disclosure}>
                <summary>Межі шкільного наближення</summary>
                <p>
                  Нехтуємо виштовхуванням повітрям, вагою та зануреним об’ємом
                  нитки, поверхневим натягом на ній. Тіло не розчиняється, не
                  вбирає воду й не змінює об’єм. Для точніших вимірювань
                  потрібні відповідні поправки та відома густина рідини за
                  фактичної температури.
                </p>
              </details>
            </section>
            <section id="guide-method" className={styles.section}>
              <div className={styles.sectionNumber}>03 / ХІД РОБОТИ</div>
              <h2>Повне занурення без сторонньої підтримки</h2>
              <ol className={styles.method}>
                {labNineMethod.map((step) => (
                  <li key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>
                    Три власні зразки · без готових значень густини
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Рядок</th>
                      <th scope="col">Вимірювання</th>
                      <th scope="col">Обчислення</th>
                      <th scope="col">Висновок</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((n) => (
                      <tr key={n}>
                        <th scope="row">Тіло {n}</th>
                        <td>P₁, P₂ у Н</td>
                        <td>ρ у кг/м³</td>
                        <td>Ймовірний матеріал з обґрунтуванням</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.callout}>
                <strong>
                  Тіло не торкається дна чи стінок, нитка натягнута.
                </strong>
                <p>
                  Контакт або додатковий тримач змінює баланс сил. Бульбашки
                  збільшують витіснений об’єм; неповне занурення не дає повного
                  об’єму тіла. Після повного занурення збільшення глибини в
                  однорідній нестисливій рідині не змінює силу Архімеда в цій
                  моделі.
                </p>
              </div>
              <details className={styles.disclosure}>
                <summary>Чому мала різниця показів небажана?</summary>
                <p>
                  Результат містить різницю двох відліків у знаменнику. Якщо
                  P₁−P₂ близьке до ціни поділки або розкиду, відносна
                  невизначеність густини може бути великою. Підбери придатний
                  прилад і розмір зразка в межах дозволеного навантаження; самі
                  додаткові цифри точності не створюють.
                </p>
              </details>
            </section>
            <section id="guide-experiment" className={styles.section}>
              <div className={styles.sectionNumber}>04 / СПРОБУЙ</div>
              <h2>Зніми два покази для того самого зразка</h2>
              <p>
                Вибери зразок A, B або C та його об’єм. Під час запуску посудина
                піднімається; зразок залишається на підвісі. Пружина
                скорочується відповідно до зменшення показу, а після повного
                занурення він стабілізується.
              </p>
              <div className={styles.practiceNotice}>
                <strong>Тренування без збереження.</strong> Покази не
                потрапляють у журнал. Для здавання відкрий призначену роботу в
                дозволеному вчителем режимі.
              </div>
              <VirtualLab
                number={9}
                experiment={labs[8].content.experiments[0]}
                allowTransfer={false}
              />
              <details className={styles.disclosure}>
                <summary>Межі моделі приладу</summary>
                <p>
                  Ідеальні шкали 0–10 Н мають однаковий масштаб. Матеріал
                  кожного модельного зразка однорідний, об’єм змінює його
                  лінійний розмір за кубічною залежністю. Вода має густину 1000
                  кг/м³, g≈10 Н/кг.
                </p>
                <p>
                  Під час ілюстрації занурення враховується занурена частина
                  умовного призматичного зразка; кінцеві покази відповідають
                  повному зануренню. Це послідовність статичних станів, хвилі та
                  коливання не моделюються.
                </p>
                <p>
                  Динамометр не занурюється, тіло не торкається посудини.
                  Похибки й внесок нитки не додаються; число цифр не
                  характеризує реальний прилад. Густину та ймовірний матеріал
                  визначай самостійно за кінцевими показами.
                </p>
              </details>
            </section>
            <section id="guide-questions" className={styles.section}>
              <div className={styles.sectionNumber}>05 / ПОЯСНИ</div>
              <h2>Показ змінюється. Тіло — те саме.</h2>
              {labNineQuestions.map((q, i) => (
                <div className={styles.controlQuestion} key={q.title}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{q.title}</h3>
                    <p>{q.text}</p>
                  </div>
                </div>
              ))}
              <p className={styles.note}>
                Числові відповіді запиши самостійно у звіті. Для іграшки тут
                явно задано середню густину, герметичність та g; це розрахункова
                умова, а не пропозиція занурювати довільну іграшку.
              </p>
            </section>
            <section id="guide-conclusion" className={styles.section}>
              <div className={styles.sectionNumber}>06 / ЗРОБИ ВИСНОВОК</div>
              <h2>Густина, обґрунтування й невизначеність</h2>
              <ul className={styles.checklist}>
                <li>Який метод і які прилади використали?</li>
                <li>Які три густини отримали в кг/м³?</li>
                <li>
                  Чи були зразки повністю занурені без контакту з посудиною?
                </li>
                <li>
                  Які матеріали можна припустити з урахуванням похибки та будови
                  тіл?
                </li>
                <li>Які чинники найбільше вплинули на різницю P₁−P₂?</li>
              </ul>
              <div className={styles.creative}>
                <span className={styles.sectionNumber}>
                  ДОСЛІДЖЕННЯ ІЗ ЗІРОЧКОЮ
                </span>
                <h3>Солона вода: прогноз і перевірка</h3>
                <p>
                  Для того самого незмінного тіла розглянь рідину з умовно
                  заданою густиною 1030 кг/м³. Це приклад, а не універсальне
                  значення для будь-якої солоної води. У формулу визначення
                  густини підставляють саме нову ρрід.
                </p>
                <p>
                  За показами у воді можна спрогнозувати новий показ:
                  P′₂=P₁−(ρ′рід/ρводи)·(P₁−P₂). Такий перерахунок не є
                  незалежним повторним вимірюванням і сам не доводить точності
                  методу.
                </p>
                <p>
                  У густішій рідині різниця показів зростає. За однакової
                  абсолютної похибки відліків це може зменшити її відносний
                  внесок, але врахуй невизначеність густини рідини, температуру
                  й інші похибки. Безумовного висновку «густіша рідина завжди
                  точніша» немає.
                </p>
                <p>
                  Якщо прогнозований натяг нульовий або від’ємний, тіло вже не
                  можна тримати зануреним натягнутою ниткою згори. Потрібні інша
                  конфігурація та облік додаткових сил; не називай від’ємний
                  результат звичайним показом такого динамометра.
                </p>
              </div>
            </section>
            <footer className={styles.source}>
              <p>
                Навчальна вебадаптація лабораторної роботи № 9 за матеріалами
                Назара Щура, «ФІЗИКА НОВА». Уточнено умови формули, натяг
                підвісу, занурення, оцінку точності та порівняння рідин.
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
                  Те саме тіло.
                  <br />
                  Два відліки.
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
