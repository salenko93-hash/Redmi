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
import {
  labFiveMethod,
  labFiveQuestions,
  labFiveSeries,
} from "@/lib/lab-five-material";
import { initialParameters, simulate } from "@/lib/simulation";
import { Shell } from "@/components/shell";
import { DensityScene } from "@/components/density-scene";
import { DensityPractice } from "@/components/density-practice";
import { OilLabelFigure } from "@/components/oil-label-figure";
import { MaterialPrint } from "@/components/material-print";
import styles from "../guide.module.css";

export const metadata: Metadata = {
  title: "Лабораторна № 5 — Густина твердих тіл і рідин",
};
function Formula() {
  return (
    <span
      className={styles.formula}
      role="math"
      aria-label="Густина дорівнює масі, поділеній на об’єм"
    >
      <i>ρ</i>
      <span>=</span>
      <span className={styles.fraction}>
        <i>m</i>
        <i>V</i>
      </span>
    </span>
  );
}
export default async function LabFiveMaterial() {
  const user = await currentUser();
  if (!user) redirect("/");
  const template = await db.labVersion.findFirst({
    where: { number: 5, authorId: null },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  const p = initialParameters(5, "regular"),
    r = simulate(5, "regular", p);
  const sections = [
    ["guide-purpose", "Мета й обладнання"],
    ["guide-theory", "Формули й одиниці"],
    ["guide-method", "Три способи вимірювання"],
    ["guide-experiment", "Віртуальні прилади"],
    ["guide-questions", "Контрольні запитання"],
    ["guide-conclusion", "Висновок і модель"],
  ];
  return (
    <Shell title="Навчальні матеріали · Робота № 5">
      <article className={styles.guide} id="lab-five-guide">
        <div className={`${styles.topline} no-print`}>
          <Link
            href={template ? `/library/${template.id}` : "/library"}
            className="back-link"
          >
            <ArrowLeft size={16} /> До роботи № 5
          </Link>
          <MaterialPrint />
        </div>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>
              ФІЗЛАБ / ЛАБОРАТОРНА РОБОТА 05
            </span>
            <h1>Густина твердих тіл і рідин</h1>
            <p>
              Маса розповідає лише частину історії. Виміряй об’єм і з’ясуй,
              яка маса припадає на одиницю об’єму.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <Clock3 size={16} /> Орієнтовно 45 хв
              </span>
              <span>
                <FlaskConical size={16} /> 3 способи · одна величина
              </span>
            </div>
            <a href="#guide-method" className={styles.heroButton}>
              Почати дослідження <ArrowDown size={17} />
            </a>
          </div>
          <div className={styles.heroVisual}>
            <svg
              viewBox="0 0 600 400"
              className="simulation-scene"
              role="img"
              aria-label="Брусок із вимірюваними довжиною, шириною, висотою та масою"
            >
              <DensityScene
                experiment="regular"
                parameters={p}
                result={r}
                phase={1}
              />
            </svg>
            <div className={styles.visualCaption}>
              <span>05 / ПОЄДНАЙ МАСУ Й ОБ’ЄМ</span>
              <span>Вимірювання → розрахунок → висновок</span>
            </div>
          </div>
        </header>
        <div className={styles.layout}>
          <div className={styles.reading}>
            <section id="guide-purpose" className={styles.section}>
              <div className={styles.sectionNumber}>01 / ПІДГОТОВКА</div>
              <h2>Одна формула — різні способи знайти об’єм</h2>
              <p>
                Визначимо густину суцільного бруска, тіла неправильної форми та
                рідини. Порівняємо результати з довідковими значеннями й
                оцінимо, що за ними можна сказати про речовину.
              </p>
              <div className={styles.question}>
                Чи достатньо маси, щоб зрозуміти, з чого виготовлене тіло?
              </div>
              <h3>Підготуй обладнання</h3>
              <ul className={styles.equipment}>
                {[
                  "Терези",
                  "Лінійка",
                  "Суцільний брусок",
                  "Нерозчинне непористе тіло",
                  "Мірна посудина з водою",
                  "Досліджувана рідина",
                  "Паперові серветки",
                ].map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.note}>
                Вибирай сумісні з водою зразки, які не розчиняються й не
                вбирають її. Для плаваючого зразка потрібен тримач із
                урахуванням його зануреного об’єму. Прилади та зразки для
                реального досліду узгоджує вчитель.
              </p>
            </section>
            <section id="guide-theory" className={styles.section}>
              <div className={styles.sectionNumber}>02 / ФОРМУЛИ Й ОДИНИЦІ</div>
              <h2>Порівнюй масу з відповідним об’ємом</h2>
              <div className={styles.formulaCard}>
                <Formula />
                <dl>
                  <div>
                    <dt>m — маса речовини</dt>
                    <dd>у цьому досліді — грами, г</dd>
                  </div>
                  <div>
                    <dt>V — відповідний об’єм</dt>
                    <dd>сантиметри кубічні, см³</dd>
                  </div>
                  <div>
                    <dt>ρ — густина</dt>
                    <dd>отримуємо г/см³, потім переводимо в кг/м³</dd>
                  </div>
                </dl>
              </div>
              <div className={styles.callout}>
                <strong>
                  1 мл = 1 см³ · 1 л = 1000 см³ · 1 г/см³ = 1000 кг/м³.
                </strong>
                <p>
                  Густина — відношення маси до відповідного об’єму. Для
                  неоднорідного або порожнистого тіла результат за зовнішнім
                  об’ємом описує його середню густину.
                </p>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>Що обчислюємо для кожного способу</caption>
                  <thead>
                    <tr>
                      <th scope="col">Спосіб</th>
                      <th scope="col">Підготовчий розрахунок</th>
                      <th scope="col">Густина</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Брусок</th>
                      <td>V = l · d · h</td>
                      <td>ρ = m / V</td>
                    </tr>
                    <tr>
                      <th scope="row">Занурення</th>
                      <td>V = V₂ − V₁</td>
                      <td>ρ = m / (V₂ − V₁)</td>
                    </tr>
                    <tr>
                      <th scope="row">Рідина</th>
                      <td>m = m₂ − m₁</td>
                      <td>ρ = (m₂ − m₁) / V</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <details className={styles.disclosure}>
                <summary>
                  Чому густина не завжди визначає речовину однозначно?
                </summary>
                <p>
                  Різні речовини можуть мати близькі густини в межах похибки.
                  Порожнини, волога, домішки й неоднорідність змінюють середню
                  густину. Довідкове значення допомагає висунути припущення; для
                  ідентифікації потрібні й інші ознаки.
                </p>
              </details>
            </section>
            <section id="guide-method" className={styles.section}>
              <div className={styles.sectionNumber}>03 / ХІД РОБОТИ</div>
              <h2>Спочатку виміряй. Потім обчисли.</h2>
              <ol className={styles.method}>
                {labFiveMethod.map((step) => (
                  <li key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.callout}>
                <strong>
                  Маса й об’єм мають стосуватися тієї самої речовини або порції.
                </strong>
                <p>
                  Не додавай масу посудини до маси рідини. Не приймай часткове
                  занурення за повний об’єм тіла. Зберігай однакове занурення
                  тримача у двох відліках.
                </p>
              </div>
              <h3>Що записати у звіт</h3>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>Три окремі рядки дослідження</caption>
                  <thead>
                    <tr>
                      <th scope="col">Серія</th>
                      <th scope="col">Вимірювання</th>
                      <th scope="col">Розрахунок</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Брусок</th>
                      <td>m, l, d, h</td>
                      <td>V, ρ, ρ у СІ</td>
                    </tr>
                    <tr>
                      <th scope="row">Занурення</th>
                      <td>m, V₁, V₂</td>
                      <td>V, ρ, ρ у СІ</td>
                    </tr>
                    <tr>
                      <th scope="row">Рідина</th>
                      <td>m₁, m₂, V</td>
                      <td>m, ρ, ρ у СІ</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className={styles.note}>
                Для кожної серії запиши ймовірний матеріал і обґрунтування.
                Густину в кг/м³ зазнач у висновку, якщо у твоєму звіті немає
                окремого поля. Задані умови й тренувальні покази не підміняють
                власних вимірювань.
              </p>
              <details className={styles.disclosure}>
                <summary>На що особливо впливають похибки?</summary>
                <p>
                  У різниці V₂ − V₁ невеликий витіснений об’єм може мати велику
                  відносну похибку. Використовуй придатну ціну поділки й зразок,
                  який поміщається в посудині без переливання. Для бруска врахуй
                  точність усіх трьох розмірів; для рідини — обох зважувань і
                  відліку об’єму.
                </p>
              </details>
            </section>
            <section id="guide-experiment" className={styles.section}>
              <div className={styles.sectionNumber}>04 / СПРОБУЙ</div>
              <h2>Обери спосіб вимірювання</h2>
              <p>
                Три вкладки відповідають трьом серіям. Розміри бруска змінюють
                його геометрію, мірні посудини мають однакову шкалу 0–250 мл, а
                тіло в другій серії занурюється повністю.
              </p>
              <div className={styles.practiceNotice}>
                <strong>Тренування без збереження.</strong> Результати цього
                приладу не потрапляють у журнал. Для здавання відкрий призначену
                роботу та використовуй режим, дозволений учителем.
              </div>
              <DensityPractice />
              <details className={styles.disclosure}>
                <summary>Межі моделі</summary>
                <p>
                  Умовні зразки однорідні, рідини нестисливі. Немає розчинення,
                  поглинання води та бульбашок. Плаваючий зразок утримується
                  тонкою спицею, об’ємом якої знехтувано; для інших зразків
                  показано тонку нитку.
                </p>
                <p>
                  Цифрові покази ідеальні та узгоджені з розрахунками моделі.
                  Кількість цифр не характеризує точність реальної мірної
                  посудини. Схематична анімація не моделює хвилі й капілярний
                  меніск; записуй кінцеві покази після завершення.
                </p>
              </details>
            </section>
            <section id="guide-questions" className={styles.section}>
              <div className={styles.sectionNumber}>05 / ПОЯСНИ</div>
              <h2>Від шматка пластиліну до етикетки</h2>
              {labFiveQuestions.map((q, i) => (
                <div key={q.title}>
                  <div className={styles.controlQuestion}>
                    <span>{i + 1}</span>
                    <div>
                      <h3>{q.title}</h3>
                      <p>{q.text}</p>
                    </div>
                  </div>
                  {i === 2 && <OilLabelFigure />}
                </div>
              ))}
              <p className={styles.note}>
                Пояснення та числові результати запиши самостійно у звіті. На
                етикетці відтворені вихідні дані, а не відповідь.
              </p>
            </section>
            <section id="guide-conclusion" className={styles.section}>
              <div className={styles.sectionNumber}>06 / ЗРОБИ ВИСНОВОК</div>
              <h2>Число, одиниці та обґрунтування</h2>
              <ul className={styles.checklist}>
                <li>Які прилади та способи визначення об’єму використали?</li>
                <li>Які три значення густини отримали в г/см³ та кг/м³?</li>
                <li>
                  Чи враховані маса посудини, повне занурення та внесок тримача?
                </li>
                <li>Які похибки могли вплинути на результат найбільше?</li>
                <li>
                  Який матеріал можна припустити й чому висновок не є
                  однозначним?
                </li>
              </ul>
              <details className={styles.disclosure}>
                <summary>Приклади довідкових густин для порівняння</summary>
                <p>
                  Орієнтовні значення поблизу кімнатної температури: вода ≈ 1,00
                  г/см³; етанол ≈ 0,79 г/см³; гліцерин ≈ 1,26 г/см³; алюміній ≈
                  2,70 г/см³; сталь ≈ 7,8 г/см³ залежно від марки. Для деревини
                  густина істотно залежить від породи та вологості.
                </p>
                <p>
                  Це приклади, а не повний довідник. Користуйся таблицею,
                  погодженою з учителем, та враховуй умови вимірювання.
                </p>
              </details>
              <div className={styles.creative}>
                <span className={styles.sectionNumber}>
                  ДОСЛІДЖЕННЯ ІЗ ЗІРОЧКОЮ
                </span>
                <h3>Об’єм модельного тіла та межі оцінки</h3>
                <p>
                  Обери неживу модель або іграшку. Якщо її середню густину
                  обґрунтовано задано, оціни V = m / ρсер. Зазнач, звідки взято
                  масу та густину, і чи враховуються порожнини.
                </p>
                <p>
                  Якщо задано інтервал можливих густин ρmin–ρmax за тієї самої
                  маси, то об’єм лежить між m / ρmax та m / ρmin. Порівняй таку
                  оцінку з незалежним способом визначення об’єму, придатним для
                  моделі.
                </p>
                <p>
                  Середнє густин двох різних видів тварин не обґрунтовує густину
                  іншої тварини. Для оцінювання потрібна придатна модель складу
                  й дані, що стосуються саме досліджуваного об’єкта.
                </p>
              </div>
            </section>
            <footer className={styles.source}>
              <p>
                Навчальна вебадаптація лабораторної роботи № 5 за матеріалами
                Назара Щура, «ФІЗИКА НОВА». Уточнено умови вимірювання, одиниці,
                ідентифікацію речовини та творче моделювання.
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
                  Одна маса.
                  <br />
                  Відповідний об’єм.
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
