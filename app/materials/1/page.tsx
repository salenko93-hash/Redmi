import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Ruler,
  CheckCircle2,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { labs } from "@/lib/labs";
import { labOneMethod } from "@/lib/lab-one-material";
import { Shell } from "@/components/shell";
import { RampScene } from "@/components/ramp-scene";
import { VirtualLab } from "@/components/virtual-lab";
import { SpeedTimeFigure } from "@/components/speed-time-figure";
import { MaterialPrint } from "@/components/material-print";
import styles from "../guide.module.css";

export const metadata: Metadata = {
  title: "Лабораторна № 1 — Середня швидкість",
};

function Formula() {
  return (
    <span
      className={styles.formula}
      role="math"
      aria-label="Середня швидкість дорівнює шляху, поділеному на час"
    >
      <span>
        <i>v</i>
        <sub>сер</sub>
      </span>
      <span>=</span>
      <span className={styles.fraction}>
        <i>l</i>
        <i>t</i>
      </span>
    </span>
  );
}

export default async function LabOneMaterial() {
  const user = await currentUser();
  if (!user) redirect("/");
  const template = await db.labVersion.findFirst({
    where: { number: 1, authorId: null },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  const lab = labs[0];
  const sections = [
    ["guide-purpose", "Мета й обладнання"],
    ["guide-theory", "Ідея досліду"],
    ["guide-method", "Хід роботи"],
    ["guide-experiment", "Віртуальний прилад"],
    ["guide-questions", "Контрольні запитання"],
    ["guide-conclusion", "Висновок і дослідження"],
  ];
  return (
    <Shell title="Навчальні матеріали · Робота № 1">
      <article className={styles.guide} id="lab-one-guide">
        <div className={`${styles.topline} no-print`}>
          <Link
            href={template ? `/library/${template.id}` : "/library"}
            className="back-link"
          >
            <ArrowLeft size={16} /> До роботи № 1
          </Link>
          <MaterialPrint />
        </div>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>
              ФІЗЛАБ / ЛАБОРАТОРНА РОБОТА 01
            </span>
            <h1>Середня швидкість руху</h1>
            <p>
              Виміряй шлях і час. Дізнайся, як описати одним числом рух, що
              змінюється.
            </p>
            <div className={styles.heroMeta}>
              <span>
                <Clock3 size={16} /> Орієнтовно 30 хв
              </span>
              <span>
                <Ruler size={16} /> Жолоб до 2 м
              </span>
            </div>
            <a href="#guide-method" className={styles.heroButton}>
              Почати дослідження <ArrowDown size={17} />
            </a>
          </div>
          <div className={styles.heroVisual}>
            <svg
              viewBox="0 0 600 410"
              className="simulation-scene"
              role="img"
              aria-label="Кулька на похилому жолобі зі штативом, стартом, фінішним упором та лінійкою до двох метрів"
            >
              <RampScene
                distance={1.2}
                angle={18}
                phase={0.25}
                id="material-ramp"
              />
            </svg>
            <div className={styles.visualCaption}>
              <span>01 / СПОСТЕРІГАЙ</span>
              <span>Шлях → час → швидкість</span>
            </div>
          </div>
        </header>

        <div className={styles.layout}>
          <div className={styles.reading}>
            <section id="guide-purpose" className={styles.section}>
              <div className={styles.sectionNumber}>01 / ПІДГОТОВКА</div>
              <h2>Що будемо досліджувати?</h2>
              <p>
                Дослідимо нерівномірне скочування кульки та визначимо її середню
                швидкість на трьох різних шляхах за незмінного нахилу жолоба.
              </p>
              <div className={styles.question}>
                Як зміниться середня швидкість, якщо кулька зі спокою долатиме
                довший шлях?
              </div>
              <h3>Підготуй обладнання</h3>
              <ul className={styles.equipment}>
                {[
                  "Жолоб і штатив",
                  "Одна кулька",
                  "Фінішний упор",
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
                Для реального досліду надійно закріпи прилад і подбай, щоб
                кулька не падала зі столу. Для віртуального — потрібен лише
                пристрій із браузером.
              </p>
            </section>

            <section id="guide-theory" className={styles.section}>
              <div className={styles.sectionNumber}>02 / ІДЕЯ ДОСЛІДУ</div>
              <h2>Одна формула. Два вимірювання.</h2>
              <div className={styles.formulaCard}>
                <Formula />
                <dl>
                  <div>
                    <dt>l — шлях</dt>
                    <dd>вимірюємо в метрах, м</dd>
                  </div>
                  <div>
                    <dt>t — час руху</dt>
                    <dd>вимірюємо в секундах, с</dd>
                  </div>
                  <div>
                    <dt>vсер — середня швидкість</dt>
                    <dd>отримуємо в м/с</dd>
                  </div>
                </dl>
              </div>
              <p>
                Середня швидкість описує весь обраний шлях. Вона не показує, з
                якою швидкістю кулька рухалася в кожну окрему мить.
              </p>
              <details className={styles.disclosure}>
                <summary>Чи можна просто усереднити швидкості?</summary>
                <p>
                  Для послідовних ділянок одного маршруту потрібно поділити
                  сумарний шлях на сумарний час: vсер = (l₁ + l₂) / (t₁ + t₂).
                  Середнє арифметичне двох швидкостей можна використовувати для
                  ділянок однакової тривалості; у загальному випадку користуйся
                  відношенням сумарного шляху до сумарного часу. Рядки цієї
                  лабораторної — окремі запуски, їх не потрібно об’єднувати в
                  один маршрут.
                </p>
              </details>
            </section>

            <section id="guide-method" className={styles.section}>
              <div className={styles.sectionNumber}>03 / ХІД РОБОТИ</div>
              <h2>Змінюй шлях. Решту умов зберігай.</h2>
              <ol className={styles.method}>
                {labOneMethod.map((step) => (
                  <li key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.callout}>
                <strong>Для всіх трьох рядків незмінні:</strong>
                <p>
                  кут нахилу, кулька, старт і спосіб відпускання без поштовху.
                  Пересувається тільки фінішний упор.
                </p>
              </div>
              <h3>Що записати у звіт</h3>
              <div className={styles.tableWrap}>
                <table className={styles.measurements}>
                  <caption>Три окремі запуски зі зменшенням шляху</caption>
                  <thead>
                    <tr>
                      <th scope="col">Дослід</th>
                      <th scope="col">Шлях l, м</th>
                      <th scope="col">Час t, с</th>
                      <th scope="col">vсер, м/с</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((n) => (
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
                Це схема заповнення. Власні вимірювання та розрахунки вводь у
                призначеній роботі. Не округлюй проміжні обчислення надто рано й
                не записуй більше значущих цифр, ніж дозволяє точність
                вимірювань.
              </p>
            </section>

            <section id="guide-experiment" className={styles.section}>
              <div className={styles.sectionNumber}>04 / СПРОБУЙ</div>
              <h2>Спочатку — маленький експеримент</h2>
              <p>
                Зліва встанови нахил, справа — шлях. Проведи три запуски зі
                зменшенням шляху. Спостерігай, як змінюються час і рух кульки.
              </p>
              <div className={styles.practiceNotice}>
                <strong>Тренування без збереження.</strong> Цей прилад не
                записує відповіді у звіт. Для здавання відкрий роботу,
                призначену вчителем.
              </div>
              <VirtualLab
                number={1}
                experiment={lab.content.experiments[0]}
                allowTransfer={false}
              />
              <details className={styles.disclosure}>
                <summary>
                  Чим модель відрізняється від реального досліду?
                </summary>
                <p>
                  Модель описує кочення суцільної кульки без проковзування та
                  опору руху: a = (5/7)g sin α, g = 10 м/с². У ній немає похибки
                  реакції людини або випадкових відхилень. Кулька прискорюється,
                  тому цей рух не є рівномірним. Час приладу — фізичний час
                  моделі; анімація може відтворювати його в іншому темпі.
                </p>
              </details>
            </section>

            <section id="guide-questions" className={styles.section}>
              <div className={styles.sectionNumber}>05 / ПОЯСНИ</div>
              <h2>Не лише обчислити — зрозуміти</h2>
              <div className={styles.controlQuestion}>
                <span>1</span>
                <div>
                  <h3>Прочитай графік</h3>
                  <p>
                    Опиши характер руху на кожному проміжку часу. Чи є рух
                    рівномірним на всьому показаному інтервалі?
                  </p>
                </div>
              </div>
              <SpeedTimeFigure />
              <div className={styles.controlQuestion}>
                <span>2</span>
                <div>
                  <h3>Що знає спідометр?</h3>
                  <p>
                    Під час руху автомобіля щохвилини записували покази
                    спідометра. Чи достатньо цих миттєвих значень, щоб точно
                    визначити середню швидкість за весь час? Поясни, яких
                    відомостей бракує.
                  </p>
                </div>
              </div>
              <div className={styles.controlQuestion}>
                <span>3</span>
                <div>
                  <h3>Туди й назад</h3>
                  <p>
                    Перше тіло проходить 120 км зі швидкістю 40 км/год, а ті
                    самі 120 км назад — зі швидкістю 30 км/год. Друге тіло долає
                    весь маршрут 240 км із середньою швидкістю 40 км/год.
                    Порівняй загальний час руху обох тіл.
                  </p>
                </div>
              </div>
              <p className={styles.note}>
                Пояснення й розрахунки запиши у звіті. Ця пам’ятка не підставляє
                готових відповідей.
              </p>
            </section>

            <section id="guide-conclusion" className={styles.section}>
              <div className={styles.sectionNumber}>06 / ЗРОБИ ВИСНОВОК</div>
              <h2>Результат — це число з поясненням</h2>
              <ul className={styles.checklist}>
                <li>
                  Який рух досліджували та як визначали середню швидкість?
                </li>
                <li>
                  Які три значення швидкості отримали? Наведи одиниці
                  вимірювання.
                </li>
                <li>
                  Чи підтвердився прогноз? Як результат пов’язаний зі шляхом?
                </li>
                <li>
                  Чи можна пояснити відмінності точністю вимірювань? Не
                  стверджуй наперед, що результати обов’язково різні.
                </li>
                <li>
                  Як на результат вплинули вимірювання відстані, реакція під час
                  запуску секундоміра та спосіб відпускання кульки?
                </li>
              </ul>
              <div className={styles.creative}>
                <span className={styles.sectionNumber}>
                  ДОСЛІДЖЕННЯ ІЗ ЗІРОЧКОЮ
                </span>
                <h3>А якщо змінити одну умову?</h3>
                <p>
                  <strong>Дослід А.</strong> Збережи шлях і кульку, зміни тільки
                  нахил. Порівняй середні швидкості.
                </p>
                <p>
                  <strong>Дослід Б — із реальним обладнанням.</strong> Збережи
                  шлях і нахил, порівняй кульки з різних матеріалів, за
                  можливості однакового радіуса й форми. Зазнач відмінності
                  поверхні та кочення.
                </p>
                <p>
                  Не роби висновок «важча кулька завжди швидша». В ідеальній
                  моделі суцільних кульок однакової форми маса не визначає
                  прискорення. Матеріал у цьому віртуальному приладі не
                  змінюється.
                </p>
              </div>
            </section>
            <footer className={styles.source}>
              <p>
                Навчальна вебадаптація лабораторної роботи № 1 за матеріалами
                Назара Щура, «ФІЗИКА НОВА». Уточнено методику, формулювання
                запитань і подання графіка.
              </p>
              <p>
                Це загальна методична пам’ятка. Якщо вчитель адаптував завдання
                для твого класу, виконуй умови призначеної роботи.
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
                  Шлях у метрах.
                  <br />
                  Час у секундах.
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
