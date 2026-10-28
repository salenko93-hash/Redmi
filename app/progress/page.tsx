import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLearningJournal } from "@/lib/learning-store";
import {
  buildLearningReport,
  learningCutoff,
  LEARNING_RULE_VERSION,
} from "@/lib/learning-progress";
import { LearningReport } from "@/components/learning-report";
import { Shell } from "@/components/shell";
import type { Answers, LabContent } from "@/lib/types";
import styles from "@/components/learning-progress.module.css";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; student?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/");
  const teacher = user.role === "TEACHER";
  const query = await searchParams;
  const classes = await db.classroom.findMany({
    where: teacher
      ? { teacherId: user.id }
      : { memberships: { some: { userId: user.id, status: "ACTIVE" } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const classroom = query.class
    ? classes.find((c) => c.id === query.class)
    : classes[0];
  if (query.class && !classroom) notFound();
  const members = classroom
    ? await db.membership.findMany({
        where: {
          classroomId: classroom.id,
          ...(teacher ? {} : { userId: user.id, status: "ACTIVE" }),
        },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { rosterName: "asc" },
      })
    : [];
  members.sort((a, b) =>
    (a.rosterName ?? a.user.name).localeCompare(
      b.rosterName ?? b.user.name,
      "uk",
    ),
  );
  const member =
    teacher && query.student
      ? members.find((m) => m.userId === query.student)
      : members[0];
  if (query.student && (!teacher ? query.student !== user.id : !member))
    notFound();
  // Physical cleanup also runs on overview reads; daily pruning is available for quiet periods.
  await db.learningEvent.deleteMany({
    where: { createdAt: { lt: learningCutoff() } },
  });
  const assignments =
    classroom && member
      ? await db.assignment.findMany({
          where: { classroomId: classroom.id },
          include: {
            labVersion: true,
            submissions: {
              where: { studentId: member.userId },
              select: {
                id: true,
                answers: true,
                status: true,
                updatedAt: true,
              },
            },
          },
          orderBy: [{ labVersion: { number: "asc" } }, { createdAt: "asc" }],
        })
      : [];
  const works = await Promise.all(
    assignments.map(async (assignment) => {
      const submission = assignment.submissions[0];
      const journal = await getLearningJournal(assignment.id, member!.userId);
      const report = buildLearningReport(
        assignment.labVersion.content as unknown as LabContent,
        (submission?.answers ?? {}) as Answers,
        journal.events,
      );
      if (
        !teacher &&
        assignment.feedbackMode !== "PRACTICE" &&
        submission?.status !== "GRADED"
      ) {
        const calculation = report.dimensions.find(
          (d) => d.key === "calculation",
        )!;
        calculation.evidence = [
          "Деталі перевірки обчислень відкриються після оцінювання.",
        ];
        calculation.next = "Самостійно перевір формули, одиниці та округлення.";
      }
      return { assignment, submission, journal, report };
    }),
  );
  return (
    <Shell title="Навчальний поступ">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ВІД СПОСТЕРЕЖЕННЯ ДО ПОЯСНЕННЯ</div>
          <h1>
            {teacher ? "Навчальний поступ учнів" : "Мій навчальний поступ"}
          </h1>
          <p className={styles.intro}>
            Чотири напрями дослідження: планування, вимірювання, обчислення та
            висновки. Кожне спостереження має конкретну підставу й наступний
            крок.
          </p>
        </div>
      </div>
      <div className={styles.notice}>
        Це опис збережених дій і відповідей, а не психологічна характеристика чи
        рейтинг. Швидкість роботи, паузи та використання допомоги не оцінюються.
        Якість пояснень перевіряє вчитель. Журнал може бути неповним через
        роботу без інтернету або вимкнення запису.
      </div>
      <form method="GET" action="/progress" className={styles.filter}>
        <label>
          Клас
          <select name="class" defaultValue={classroom?.id}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="button secondary" disabled={!classes.length}>
          Відкрити клас
        </button>
      </form>
      {teacher && classroom && (
        <form method="GET" action="/progress" className={styles.filter}>
          <input type="hidden" name="class" value={classroom.id} />
          <label>
            Учень / учениця
            <select name="student" defaultValue={member?.userId}>
              {members.map((m) => (
                <option key={m.id} value={m.userId}>
                  {m.rosterName ?? m.user.name}
                  {m.status === "LEFT"
                    ? " · вибув / вибула"
                    : m.status === "SUSPENDED"
                      ? " · доступ призупинено"
                      : ""}
                </option>
              ))}
            </select>
          </label>
          <button className="button secondary" disabled={!members.length}>
            Показати поступ
          </button>
          <Link href={`/classes/${classroom.id}`}>До класу →</Link>
        </form>
      )}
      {member && <h2>{member.rosterName ?? member.user.name}</h2>}
      {!works.length && (
        <section className="panel">
          <p className={styles.empty}>
            Ще немає призначених робіт або учнів у вибраному класі.
          </p>
        </section>
      )}
      {works.map(({ assignment, submission, journal, report }) => (
        <details key={assignment.id} className={`panel ${styles.student}`}>
          <summary>
            № {assignment.labVersion.number} · {assignment.labVersion.title}
          </summary>
          <div className={styles.meta}>
            <span>
              {journal.enabled
                ? "Журнал увімкнено · події за останні 180 днів"
                : "Журнал вимкнено · лише збережені відповіді"}
            </span>
            <span>
              {submission
                ? `Звіт збережено: ${submission.updatedAt.toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" })}`
                : "Звіту ще немає"}
            </span>
            {submission && (
              <Link
                href={
                  teacher
                    ? `/review/${submission.id}`
                    : `/work/${assignment.id}`
                }
              >
                {teacher ? "Відкрити звіт" : "До роботи"} →
              </Link>
            )}
            {!submission && !teacher && (
              <Link href={`/work/${assignment.id}`}>Розпочати роботу →</Link>
            )}
          </div>
          <LearningReport report={report} />
        </details>
      ))}
      <details className="panel">
        <summary>
          Як працюють спостереження · правила {LEARNING_RULE_VERSION}
        </summary>
        <ul className={styles.intro}>
          <li>
            Параметри порівнюються між послідовними завершеними запусками тієї
            самої серії. Однакові параметри означають повтор, одна відмінність —
            зміну однієї величини. Кілька змін можуть бути передбачені
            методикою.
          </li>
          <li>
            Заповнені поля не доводять точності вимірювань. Арифметика
            перевіряється лише за введеними даними.
          </li>
          <li>
            Виправлення фіксується під час серверного збереження: раніше
            заповнений помилковий розрахунок став узгодженим, а вхідні дані не
            змінилися.
          </li>
          <li>
            Для висновку перевіряється наявність чотирьох частин; зміст
            автоматично не оцінюється.
          </li>
          <li>
            Запис добровільний для кожної роботи. Його вимкнення видаляє події.
            Звіти й оцінки зберігаються окремо. Події надходять із браузера,
            можуть бути неповними та не є доказом списування.
          </li>
        </ul>
      </details>
    </Shell>
  );
}
