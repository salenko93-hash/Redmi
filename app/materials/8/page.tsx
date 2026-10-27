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
import { labEightMethod, labEightQuestions } from "@/lib/lab-eight-material";
import { initialParameters, simulate } from "@/lib/simulation";
import { Shell } from "@/components/shell";
import { PRESSURE_SCENE_HEIGHT } from "@/lib/pressure-view";
import { PressureScene } from "@/components/pressure-scene";
import { PressurePractice } from "@/components/pressure-practice";
import { WeightlessnessFigure } from "@/components/weightlessness-figure";
import { MaterialPrint } from "@/components/material-print";
import styles from "../guide.module.css";
export const metadata: Metadata = {
  title: "Лабораторна № 8 — Тиск тіла на опору",
};
function Formula() {
  return (
    <span
      className={styles.formula}
      role="math"
      aria-label="Середній тиск дорівнює силі тиску, поділеній на площу опори"
    >
      <i>p</i>
      <span>=</span>
      <span className={styles.fraction}>
        <i>F</i>
        <i>S</i>
      </span>
    </span>
  );
}
export default async function LabEightMaterial() {
  const user = await currentUser();
  if (!user) redirect("/");
  const template = await db.labVersion.findFirst({
    where: { number: 8, authorId: null },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  const p = initialParameters(8, "area"),
    r = simulate(8, "area", p);
  const sections = [
    ["guide-purpose", "Мета й обладнання"],
    ["guide-theory", "Тиск, сила та площа"],
    ["guide-method", "Дві серії вимірювань"],
    ["guide-experiment", "Віртуальні прилади"],
    ["guide-questions", "Невагомість і задачі"],
    ["guide-conclusion", "Висновок і підошви"],
  ];
  return (
    <Shell title="Навчальні матеріали · Робота № 8">
      <article className={styles.guide} id="lab-eight-guide">
        <div className={`${styles.topline} no-print`}>
          <Link
            href={template ? `/library/${template.id}` : "/library"}
            className="back-link"
          >
            <ArrowLeft size={16} /> До роботи № 8
          </Link>
          <MaterialPrint />
        </div>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>
              ФІЗЛАБ / ЛАБОРАТОРНА РОБОТА 08
            </span>
            <h1>Тиск: сила на одиницю площі</h1>
            <p>
              Той самий брусок, інша грань. Та сама грань, більше навантаження.
              З’ясуй, як змінюється тиск у кожному досліді.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <Clock3 size={16} /> Орієнтовно 40 хв
              </span>
              <span>
                <FlaskConical size={16} /> 2 серії · по 3 досліди
              </span>
            </div>
            <a href="#guide-method" className={styles.heroButton}>
              Почати дослідження <ArrowDown size={17} />
            </a>
          </div>
          <div className={styles.heroVisual}>
            <svg
              viewBox={`0 0 600 ${PRESSURE_SCENE_HEIGHT}`}
              className="simulation-scene"
              role="img"
              aria-label="Брусок на опорі та опорна грань у спільному масштабі"
            >
              <PressureScene
                experiment="area"
                parameters={p}
                result={r}
                phase={1}
                id="pressure-hero"
              />
            </svg>
            <div className={styles.visualCaption}>
              <span>08 / ПОРІВНЯЙ ДВІ ПРИЧИНИ</span>
              <span>Сила · площа · середній тиск</span>
            </div>
          </div>
        </header>
        <div className={styles.layout}>
          <div className={styles.reading}>
            <section id="guide-purpose" className={styles.section}>
              <div className={styles.sectionNumber}>01 / ПІДГОТОВКА</div>
              <h2>Змінюй одну величину за раз</h2>
              <p>
                Визначимо середній тиск бруска на горизонтальну опору. Окремо
                дослідимо вплив площі грані за сталої сили та вплив навантаження
                за сталої площі.
              </p>
              <div className={styles.question}>
                Чому той самий брусок створює різний тиск, коли його повертають?
              </div>
              <h3>Підготуй обладнання</h3>
              <ul className={styles.equipment}>
                {[
                  "Брусок із плоскими гранями",
                  "Динамометр",
                  "Лінійка",
                  "Однакові тягарці",
                  "Горизонтальна опора",
                ].map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.note}>
                Перевір стійкість бруска та розміщення тягарців. Вимірюй вагу в
                межах динамометра, дочекавшись спокою. Для пояснення невагомості
                використовуй екранну модель, без скидання обладнання.
              </p>
            </section>
            <section id="guide-theory" className={styles.section}>
              <div className={styles.sectionNumber}>02 / ФОРМУЛА Й ОДИНИЦІ</div>
              <h2>Тиск — не сама сила</h2>
              <div className={styles.formulaCard}>
                <Formula />
                <dl>
                  <div>
                    <dt>F — сила тиску на опору</dt>
                    <dd>перпендикулярна до поверхні, у ньютонах</dd>
                  </div>
                  <div>
                    <dt>S — площа опори</dt>
                    <dd>у метрах квадратних</dd>
                  </div>
                  <div>
                    <dt>p — середній тиск</dt>
                    <dd>у паскалях: 1 Па = 1 Н/м²</dd>
                  </div>
                </dl>
              </div>
              <div className={styles.callout}>
                <strong>
                  1 см = 0,01 м · 1 см² = 0,0001 м² · 1 кПа = 1000 Па.
                </strong>
                <p>
                  Для площі коефіцієнт перетворення підноситься до квадрата.
                  Переведи обидві довжини в метри перед множенням або окремо
                  переведи готову площу.
                </p>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>
                    Три опорні грані прямокутного паралелепіпеда
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Грань</th>
                      <th scope="col">Площа</th>
                      <th scope="col">Тиск за тієї самої F</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Довжина × ширина</th>
                      <td>S₁ = l·d</td>
                      <td>p₁ = F/S₁</td>
                    </tr>
                    <tr>
                      <th scope="row">Довжина × висота</th>
                      <td>S₂ = l·h</td>
                      <td>p₂ = F/S₂</td>
                    </tr>
                    <tr>
                      <th scope="row">Ширина × висота</th>
                      <td>S₃ = d·h</td>
                      <td>p₃ = F/S₃</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                На нерухомій горизонтальній опорі без інших вертикальних сил F =
                mg. Динамометр при зважуванні дає вагу підвішеного тіла в
                спокої; за цих умов її використовуємо як силу тиску того самого
                тіла на стіл.
              </p>
              <details className={styles.disclosure}>
                <summary>Що означає «середній» тиск?</summary>
                <p>
                  F/S характеризує всю вибрану площу загалом. Локальний тиск
                  біля країв, нерівностей або ділянок контакту може
                  відрізнятися. У досліді приймаємо плоску суцільну грань із
                  повним контактом; отвори, ніжки або помітна деформація
                  потребують іншої оцінки площі.
                </p>
              </details>
            </section>
            <section id="guide-method" className={styles.section}>
              <div className={styles.sectionNumber}>03 / ХІД РОБОТИ</div>
              <h2>Шість розрахунків із контрольованими умовами</h2>
              <ol className={styles.method}>
                {labEightMethod.map((step) => (
                  <li key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>Що змінюємо й що зберігаємо</caption>
                  <thead>
                    <tr>
                      <th scope="col">Серія</th>
                      <th scope="col">Змінюємо</th>
                      <th scope="col">Зберігаємо</th>
                      <th scope="col">Перевіряємо</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">1 · площа</th>
                      <td>Опорну грань: l·d, l·h, d·h</td>
                      <td>Силу F, масу й розміри</td>
                      <td>За сталої F тиск обернено пропорційний S</td>
                    </tr>
                    <tr>
                      <th scope="row">2 · сила</th>
                      <td>Кількість тягарців: 1, 2, 3</td>
                      <td>Ту саму найбільшу грань і S</td>
                      <td>За сталої S тиск прямо пропорційний F</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.callout}>
                <strong>
                  У другій серії врахуй вагу і бруска, і всіх тягарців.
                </strong>
                <p>
                  Подвоєння кількості тягарців не означає автоматичного
                  подвоєння повної сили: власна вага бруска теж входить у F.
                </p>
              </div>
              <details className={styles.disclosure}>
                <summary>На що впливає похибка?</summary>
                <p>
                  Перевір нуль динамометра, ціну поділки лінійки, відлік без
                  паралаксу та повноту контакту. Похибки обох сторін грані
                  впливають на площу, а похибки F і S — на розрахунок тиску. Не
                  подавай число десяткових знаків як доведену точність приладу.
                </p>
              </details>
            </section>
            <section id="guide-experiment" className={styles.section}>
              <div className={styles.sectionNumber}>04 / СПРОБУЙ</div>
              <h2>Грань або навантаження — обери серію</h2>
              <p>
                Об’ємний дерев’яний брусок повертається зі збереженням розмірів.
                Латунні тягарці стоять на його верхній грані. Окремо показано
                вигляд опорної грані згори та лінійки з поділкою 1 мм. В усіх
                напрямках використано спільний масштаб; розміри не підганяються
                під однаковий прямокутник.
              </p>
              <div className={styles.practiceNotice}>
                <strong>Тренування без збереження.</strong> Покази не
                потрапляють у журнал. Для здавання відкрий призначену роботу в
                дозволеному вчителем режимі.
              </div>
              <PressurePractice />
              <details className={styles.disclosure}>
                <summary>Межі моделі</summary>
                <p>
                  Ідеальний твердий брусок масою 200 г, тягарці по 100 г,
                  статична горизонтальна опора, g≈10 Н/кг. Сила тиску в моделі
                  визначається за масою; реальне зважування описано в методиці.
                  Деформація та нерівномірність локального тиску не моделюються.
                </p>
                <p>
                  Зміна розмірів налаштовує умовний зразок із заданою масою. Це
                  не моделює відрізання частини того самого матеріалу. Для
                  власної серії спочатку налаштуй розміри й надалі зберігай їх.
                </p>
                <p>
                  Кінцеві цифрові покази ідеальні, додаткові знаки не означають
                  такої самої точності реального приладу. Площа в першій серії
                  та тиск в обох серіях залишаються самостійними розрахунками.
                </p>
              </details>
            </section>
            <section id="guide-questions" className={styles.section}>
              <div className={styles.sectionNumber}>05 / ПОЯСНИ</div>
              <h2>Площа, невагомість і контакти коліс</h2>
              {labEightQuestions.map((q, i) => (
                <div key={q.title}>
                  <div className={styles.controlQuestion}>
                    <span>{i + 1}</span>
                    <div>
                      <h3>{q.title}</h3>
                      <p>{q.text}</p>
                    </div>
                  </div>
                  {i === 1 && <WeightlessnessFigure />}
                </div>
              ))}
              <div className={styles.callout}>
                <strong>Для вантажівки Sзаг = n·Sодного контакту.</strong>
                <p>
                  Уточнення про чотири контакти додане до навчальної умови, а не
                  вичитане з PDF. Для реального автомобіля після розвантаження
                  може змінитися й пляма контакту шини. Тоді потрібно
                  враховувати обидві зміни: p₂/p₁ = (F₂/F₁)·(S₁/S₂), де S₁ і S₂
                  — сумарні площі до й після зміни.
                </p>
              </div>
              <p className={styles.note}>
                Усі числові результати й пояснення запиши самостійно у звіті.
                Схема невагомості є новою навчальною ілюстрацією, а не
                вимірюванням реального падіння.
              </p>
            </section>
            <section id="guide-conclusion" className={styles.section}>
              <div className={styles.sectionNumber}>06 / ВИСНОВОК</div>
              <h2>Назви, що саме залишалося сталим</h2>
              <ul className={styles.checklist}>
                <li>Які сили та розміри вимірювали, якими приладами?</li>
                <li>
                  Які три тиски отримали за різних граней і однакової сили?
                </li>
                <li>
                  Які три тиски отримали за однакової площі та різних
                  навантажень?
                </li>
                <li>
                  Чи узгоджуються висновки з p=F/S за контрольованих умов?
                </li>
                <li>Як вплинули одиниці площі, похибка й неповний контакт?</li>
              </ul>
              <div className={styles.creative}>
                <span className={styles.sectionNumber}>
                  ДОСЛІДЖЕННЯ ІЗ ЗІРОЧКОЮ
                </span>
                <h3>Тиск підошов: спокій і ходьба</h3>
                <p>
                  Для спокійного стояння оціни F≈mg та сумарну площу опори обох
                  підошов. Можна оцінити площу за контуром підошви на паперовій
                  сітці; поясни, чому це наближення, особливо для рельєфного
                  протектора. Результат подай у Па або кПа.
                </p>
                <p>
                  Під час ходьби F(t) і S(t) змінюються: є опора на одну чи дві
                  ноги, перекочування підошви та вертикальне прискорення тіла.
                  Однієї маси й повного контуру взуття недостатньо для точного
                  миттєвого тиску.
                </p>
                <p>
                  Припущення про подвоєння тиску на одній нозі потребує майже
                  сталої сили та вдвічі меншої площі. Це окрема спрощена модель,
                  а не точне правило для ходьби. Для кількісного дослідження
                  потрібні синхронні вимірювання сили та контакту.
                </p>
              </div>
            </section>
            <footer className={styles.source}>
              <p>
                Навчальна вебадаптація лабораторної роботи № 8 за матеріалами
                Назара Щура, «ФІЗИКА НОВА». Уточнено середній тиск, одиниці
                площі, геометрію граней, невагомість, задачу про вантажівку та
                оцінку ходьби.
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
                  Сила та сама?
                  <br />
                  Площа та сама?
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
