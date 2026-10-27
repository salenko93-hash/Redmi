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
import { labTenMethod, labTenQuestions } from "@/lib/lab-ten-material";
import { initialParameters, simulate } from "@/lib/simulation";
import { Shell } from "@/components/shell";
import { FLOATING_SCENE_HEIGHT } from "@/lib/floating-view";
import { FloatingScene } from "@/components/floating-scene";
import { FloatingBodiesFigure } from "@/components/floating-bodies-figure";
import { VirtualLab } from "@/components/virtual-lab";
import { MaterialPrint } from "@/components/material-print";
import styles from "../guide.module.css";
export const metadata: Metadata = {
  title: "Лабораторна № 10 — Умови плавання тіл",
};
function Formula() {
  return (
    <span
      className={styles.formula}
      role="math"
      aria-label="Середня густина дорівнює масі всієї закритої системи, поділеній на її повний зовнішній об’єм"
    >
      <i>
        ρ<sub>сер</sub>
      </i>
      <span>=</span>
      <span className={styles.fraction}>
        <i>m</i>
        <i>V</i>
      </span>
    </span>
  );
}
export default async function LabTenMaterial() {
  const user = await currentUser();
  if (!user) redirect("/");
  const template = await db.labVersion.findFirst({
    where: { number: 10, authorId: null },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  const p = initialParameters(10, "floating"),
    r = simulate(10, "floating", p);
  const sections = [
    ["guide-purpose", "Мета й обладнання"],
    ["guide-theory", "Густина та сили"],
    ["guide-method", "Три стани пробірки"],
    ["guide-experiment", "Віртуальне плавання"],
    ["guide-questions", "Контрольні запитання"],
    ["guide-conclusion", "Висновок і сіль"],
  ];
  return (
    <Shell title="Навчальні матеріали · Робота № 10">
      <article className={styles.guide} id="lab-ten-guide">
        <div className={`${styles.topline} no-print`}>
          <Link
            href={template ? `/library/${template.id}` : "/library"}
            className="back-link"
          >
            <ArrowLeft size={16} /> До роботи № 10
          </Link>
          <MaterialPrint />
        </div>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>
              ФІЗЛАБ / ЛАБОРАТОРНА РОБОТА 10
            </span>
            <h1>Тоне, зависає чи плаває?</h1>
            <p>
              Збережи зовнішній об’єм і змінюй масу піску. Порівняй середню
              густину закритої пробірки з густиною рідини та поясни сили.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <Clock3 size={16} /> Орієнтовно 35 хв
              </span>
              <span>
                <FlaskConical size={16} /> 3 стани · 1 зовнішній об’єм
              </span>
            </div>
            <a href="#guide-method" className={styles.heroButton}>
              Почати дослідження <ArrowDown size={17} />
            </a>
          </div>
          <div className={styles.heroVisual}>
            <svg
              viewBox={`0 0 600 ${FLOATING_SCENE_HEIGHT}`}
              className="simulation-scene"
              role="img"
              aria-label="Пробірка з піском у воді та схема сил для її поточного положення"
            >
              <FloatingScene
                parameters={p}
                result={r}
                phase={1}
                id="floating-hero"
              />
            </svg>
            <div className={styles.visualCaption}>
              <span>10 / ПОРІВНЯЙ ГУСТИНИ</span>
              <span>Маса → занурення → рівновага</span>
            </div>
          </div>
        </header>
        <div className={styles.layout}>
          <div className={styles.reading}>
            <section id="guide-purpose" className={styles.section}>
              <div className={styles.sectionNumber}>01 / ПІДГОТОВКА</div>
              <h2>Досліджуємо всю закриту систему</h2>
              <p>
                Одержимо потопання, нейтральну плавучість і плавання на
                поверхні. Середня густина стосується пробірки разом із корком,
                піском та замкненим повітрям — це не густина скла чи піску
                окремо.
              </p>
              <div className={styles.question}>
                Як порожнина з повітрям допомагає плавати тілу, матеріал якого
                густіший за воду?
              </div>
              <h3>Підготуй обладнання</h3>
              <ul className={styles.equipment}>
                {[
                  "Пробірка з щільним корком",
                  "Тонка нитка",
                  "Сухий пісок",
                  "Мірний циліндр із водою",
                  "Терези",
                  "Серветка",
                ].map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.note}>
                Перевір герметичність і стійкість посудини, зразок має вільно
                поміщатися всередині. Для реального досліду використовуй
                обладнання й навантаження, погоджені з учителем. Корок щоразу
                встановлюй однаково.
              </p>
            </section>
            <section id="guide-theory" className={styles.section}>
              <div className={styles.sectionNumber}>02 / ГУСТИНА Й СИЛИ</div>
              <h2>Повний об’єм і занурений об’єм — різні величини</h2>
              <div className={styles.formulaCard}>
                <Formula />
                <dl>
                  <div>
                    <dt>m — маса всієї системи</dt>
                    <dd>пробірка, корок, пісок і повітря</dd>
                  </div>
                  <div>
                    <dt>V — повний зовнішній об’єм</dt>
                    <dd>той самий для трьох дослідів</dd>
                  </div>
                  <div>
                    <dt>ρсер — середня густина</dt>
                    <dd>для m у г та V у см³ отримуємо г/см³</dd>
                  </div>
                </dl>
              </div>
              <div className={styles.callout}>
                <strong>Сила Архімеда: FА=ρрідини·g·Vзанур.</strong>
                <p>
                  На поверхні Vзанур менший за повний V. Для вільного плавання у
                  спокої FА=mg, отже Vзанур/V=ρсер/ρрідини. Виштовхування
                  повітрям і поверхневий натяг у цьому наближенні не враховуємо.
                </p>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>Розрізняй рух і кінцеву рівновагу</caption>
                  <thead>
                    <tr>
                      <th scope="col">Стан</th>
                      <th scope="col">Порівняння</th>
                      <th scope="col">Сили</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Тоне, ще не торкається дна</th>
                      <td>ρсер&gt;ρрідини</td>
                      <td>
                        mg&gt;FА за повного занурення; опорної сили немає.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Лежить на дні у спокої</th>
                      <td>Те саме густіше тіло</td>
                      <td>FА+N=mg за доступу рідини до нижньої поверхні.</td>
                    </tr>
                    <tr>
                      <th scope="row">Нейтральна плавучість усередині</th>
                      <td>ρсер=ρрідини</td>
                      <td>FА=mg за повного занурення, N=0.</td>
                    </tr>
                    <tr>
                      <th scope="row">Рівновага на поверхні</th>
                      <td>ρсер&lt;ρрідини</td>
                      <td>FА=mg за часткового занурення, N=0.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Якщо повністю занурене тіло легше за витіснену рідину, спочатку
                FА&gt;mg і воно спливає. Біля поверхні занурений об’єм
                зменшується до рівноваги. Рівність густин усуває вертикальну
                результуючу силу, але не гарантує повернення на одну вибрану
                глибину.
              </p>
              <details className={styles.disclosure}>
                <summary>Одиниці для числових сил</summary>
                <p>
                  У формулах сил використовуй m у кг, Vзанур у м³, густину у
                  кг/м³ та g≈10 Н/кг. 1 г=0,001 кг; 1 см³=0,000001 м³; 1
                  г/см³=1000 кг/м³. Для поверхневого плавання спочатку визнач
                  Vзанур або скористайся умовою рівноваги.
                </p>
              </details>
            </section>
            <section id="guide-method" className={styles.section}>
              <div className={styles.sectionNumber}>03 / ХІД РОБОТИ</div>
              <h2>Змінюй пісок, зберігай зовнішній об’єм</h2>
              <ol className={styles.method}>
                {labTenMethod.map((step) => (
                  <li key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>Три рядки основної таблиці · вода ≈1 г/см³</caption>
                  <thead>
                    <tr>
                      <th scope="col">Рядок</th>
                      <th scope="col">Що записуємо</th>
                      <th scope="col">Що пояснюємо</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Тоне / на дні</th>
                      <td>Той самий V, власна m, ρсер</td>
                      <td>Коли з’являється N; рух і спокій на дні</td>
                    </tr>
                    <tr>
                      <th scope="row">Усередині</th>
                      <td>Той самий V, нова m, ρсер</td>
                      <td>Нейтральна плавучість у межах точності</td>
                    </tr>
                    <tr>
                      <th scope="row">На поверхні</th>
                      <td>Той самий V, ще менша m, ρсер</td>
                      <td>Рівновага за меншого Vзанур</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.callout}>
                <strong>
                  Не визначай повний V за витісненням під час поверхневого
                  плавання.
                </strong>
                <p>
                  Це дасть лише Vзанур. Повний об’єм вимірюємо окремо за повного
                  занурення, включаючи виступний корок; внесок тримача
                  враховуємо. На дні простеж, щоб контакт не перекривав доступ
                  води до нижньої поверхні.
                </p>
              </div>
              <h3>Як заповнити схеми сил у звіті</h3>
              <p>
                Обери стан тіла, познач напрямки та співвідношення сил. Числові
                mg, FА та за потреби N у ньютонах обґрунтуй у висновку. Довжини
                стрілок у наявному редакторі задані в умовних одиницях; вони не
                перетворюються автоматично на ньютони. Точки прикладання в
                редакторі спрощено.
              </p>
              <details className={styles.disclosure}>
                <summary>
                  Чому реальна пробірка може повільно рухатися замість
                  «зависання»?
                </summary>
                <p>
                  Маса окремої піщинки, похибка об’єму й терезів, бульбашки,
                  змочування, протікання та течії заважають точно встановити
                  рівність густин. Запиши, наскільки повільно вона піднімається
                  чи опускається; не оголошуй приблизний результат точною
                  рівністю.
                </p>
              </details>
            </section>
            <section id="guide-experiment" className={styles.section}>
              <div className={styles.sectionNumber}>04 / СПРОБУЙ</div>
              <h2>Три стани та перехід у солону воду</h2>
              <p>
                Спочатку задай повний V й зберігай його. Змінюй лише масу піску,
                запускай дослід і порівнюй поведінку. Для творчого завдання
                одержи нейтральну плавучість у воді та зміни тільки рідину.
              </p>
              <div className={styles.practiceNotice}>
                <strong>Тренування без збереження.</strong> Покази не
                потрапляють у журнал. Для здавання відкрий призначену роботу й
                обери відповідний рядок таблиці. Солона вода належить
                додатковому дослідженню.
              </div>
              <VirtualLab
                number={10}
                experiment={labs[9].content.experiments[0]}
                allowTransfer={false}
              />
              <details className={styles.disclosure}>
                <summary>Межі моделі</summary>
                <p>
                  Закрита пробірка без піску має масу 20 г; заданий повний V
                  сталий. Густина води 1 г/см³, умовного сольового розчину 1,03
                  г/см³. Зміна V налаштовує інший умовний зразок і не є частиною
                  однієї серії.
                </p>
                <p>
                  Зовнішня форма — циліндр із заокругленим напівсферичним дном.
                  Занурений об’єм обчислено з цієї форми, а не просто з частки
                  висоти. Модель примусово зберігає вертикальну орієнтацію;
                  стійкість, перекидання, хвилі, опір руху й поверхневий натяг
                  не розглядаються.
                </p>
                <p>
                  Анімація показує напрям переміщення, її швидкість не є
                  розв’язком рівнянь руху. Сили відповідають поточному положенню
                  без опору води. Реакція опори з’являється лише після контакту
                  з дном; дно змодельоване точковою опорою, вода омиває нижню
                  поверхню.
                </p>
                <p>
                  Рівень рідини змінюється відповідно до витісненого об’єму. V
                  задано моделі, а реальні V₁,V₂ визначають за методикою.
                  Вільний внутрішній об’єм задано як V−10 см³; насипна густина
                  піску — 1,6 г/см³. Повзунок обмежений місткістю. За зменшення
                  V надлишок піску прибирається — це налаштування іншого зразка.
                </p>
                <p>
                  Точна нейтральність у моделі є ідеальним випадком. Цифрові
                  покази не містять випадкової похибки. Схема сил не заповнює
                  відповіді звіту; середню густину й числові сили обчислюй
                  самостійно.
                </p>
              </details>
            </section>
            <section id="guide-questions" className={styles.section}>
              <div className={styles.sectionNumber}>05 / ПОЯСНИ</div>
              <h2>Однаковий об’єм — різне занурення</h2>
              {labTenQuestions.map((q, i) => (
                <div key={q.title}>
                  <div className={styles.controlQuestion}>
                    <span>{i + 1}</span>
                    <div>
                      <h3>{q.title}</h3>
                      <p>{q.text}</p>
                    </div>
                  </div>
                  {i === 2 && <FloatingBodiesFigure />}
                </div>
              ))}
              <p className={styles.note}>
                Густини води та гліцерину в задачах задані як навчальні
                значення. Готові числові відповіді запиши самостійно у звіті.
                Рисунок якісний: числові частки занурення за ним не вимірюють.
              </p>
            </section>
            <section id="guide-conclusion" className={styles.section}>
              <div className={styles.sectionNumber}>06 / ВИСНОВОК</div>
              <h2>Назви густини та стан рівноваги</h2>
              <ul className={styles.checklist}>
                <li>Як визначили й зберігали повний зовнішній V?</li>
                <li>Які три маси та середні густини отримали?</li>
                <li>
                  Коли пробірка опускається, спливає або має нейтральну
                  плавучість?
                </li>
                <li>
                  Чим відрізняються сили під час потопання та спокою на дні?
                </li>
                <li>
                  Чому в рівновазі на поверхні FА=mg, хоча ρсер&lt;ρрідини?
                </li>
                <li>Які похибки й течії вплинули на спостереження?</li>
              </ul>
              <div className={styles.creative}>
                <span className={styles.sectionNumber}>
                  ДОСЛІДЖЕННЯ ІЗ ЗІРОЧКОЮ
                </span>
                <h3>Та сама пробірка — густіша рідина</h3>
                <p>
                  Почни з нейтральної пробірки у воді. Не змінюй пісок, корок
                  або V; перенеси її в густіший розчин. Порівняй початковий стан
                  повного занурення з кінцевим плаванням на поверхні.
                </p>
                <p>
                  За повного занурення густіша рідина створює більшу силу
                  Архімеда. Після спливання занурений об’єм зменшується до
                  нового балансу FА=mg. Середня густина самої герметичної
                  пробірки при цьому не змінюється.
                </p>
                <p>
                  У моделі 1,03 г/см³ — заданий приклад. Для реального розчину
                  потрібна його густина за фактичної концентрації та
                  температури. У висновку розрізни зміну рідини, зміну
                  зануреного об’єму та незмінні m і V.
                </p>
              </div>
            </section>
            <footer className={styles.source}>
              <p>
                Навчальна вебадаптація лабораторної роботи № 10 за матеріалами
                Назара Щура, «ФІЗИКА НОВА». Уточнено повний і занурений об’єми,
                середню густину, нейтральну плавучість, контакт із дном та
                порівняння рідин.
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
                  Маса змінюється.
                  <br />
                  Об’єм зберігається.
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
