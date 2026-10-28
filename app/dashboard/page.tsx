import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  FlaskConical,
  CheckCheck,
  Clock3,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { labs } from "@/lib/labs";
import { Shell } from "@/components/shell";
import { LabGrid } from "@/components/lab-grid";
export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/");
  const teacher = user.role === "TEACHER";
  const loadedAssignments = await db.assignment.findMany({
    where: {
      classroom: teacher
        ? { teacherId: user.id }
        : { memberships: { some: { userId: user.id, status: "ACTIVE" } } },
    },
    include: {
      labVersion: true,
      classroom: {
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            select: { userId: true },
          },
          _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
        },
      },
      submissions: {
        where: teacher ? {} : { studentId: user.id },
        select: { status: true, score: true, studentId: true },
      },
    },
    orderBy: { labVersion: { number: "asc" } },
  });
  const assignments = loadedAssignments.map((a) => ({
    ...a,
    submissions: teacher
      ? a.submissions.filter((s) =>
          a.classroom.memberships.some((m) => m.userId === s.studentId),
        )
      : a.submissions,
  }));
  const subs = assignments.flatMap((a) => a.submissions);
  const graded = subs.filter((s) => s.status === "GRADED"),
    pending = subs.filter((s) => s.status === "SUBMITTED");
  const avg = graded.length
    ? (graded.reduce((a, s) => a + (s.score ?? 0), 0) / graded.length).toFixed(
        1,
      )
    : "—";
  const cards = assignments.map((a) => {
    const meta = labs.find((l) => l.number === a.labVersion.number)!;
    return {
      id: a.labVersion.id,
      number: meta.number,
      title: a.labVersion.title,
      category: meta.category,
      minutes: meta.minutes,
      version: a.labVersion.version,
      assignmentId: a.id,
      status: teacher
        ? a.submissions.some((s) => s.status === "SUBMITTED")
          ? "SUBMITTED"
          : a.submissions.some((s) => s.status === "RETURNED")
            ? "RETURNED"
            : a.classroom._count.memberships > 0 &&
                a.submissions.filter((s) => s.status === "GRADED").length ===
                  a.classroom._count.memberships
              ? "GRADED"
              : a.submissions.length
                ? "DRAFT"
                : undefined
        : a.submissions[0]?.status,
      score: teacher ? null : a.submissions[0]?.score,
      classroomId: a.classroom.id,
      classProgress: teacher
        ? `${a.submissions.filter((s) => s.status === "GRADED").length}/${a.classroom._count.memberships} оцінено`
        : undefined,
      className: a.classroom.name,
      dueAt: a.dueAt?.toISOString(),
    };
  });
  return (
    <Shell>
      <div className="page-heading">
        <div>
          <div className="eyebrow">МІЙ ПРОСТІР / ОГЛЯД</div>
          <h1>
            Вітаємо, {user.name.split(" ")[0]}{" "}
            <span className="greeting-spark">✳</span>
          </h1>
          <p>
            {teacher
              ? "Допоможіть учням перетворити спостереження на відкриття."
              : "Кожен дослід — крок до розуміння світу. Почнімо?"}
          </p>
        </div>
        <Link
          href={teacher ? "/classes" : "/library"}
          className="button secondary"
        >
          <BookOpen size={17} />
          {teacher ? "Керувати класами" : "До бібліотеки"}
        </Link>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="pill light">
            <span className="live-dot" /> ВІД ЗАПИТАННЯ ДО ВІДКРИТТЯ
          </span>
          <h2>
            Фізика ближче,
            <br />
            ніж здається.
          </h2>
          <p>
            {teacher
              ? "Десять готових робіт, живі результати й більше часу для пояснень."
              : "Спостерігай, вимірюй, перевіряй свої припущення. Твої відкриття зберігаються тут."}
          </p>
          <Link
            href={
              teacher
                ? "/classes"
                : assignments[0]
                  ? "/work/" + assignments[0].id
                  : "/classes"
            }
            className="button cream"
          >
            {teacher
              ? "Призначити дослідження"
              : assignments[0]
                ? "Почати дослідження"
                : "Приєднатися до класу"}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-grid" />
          <div className="hero-orbit" />
          <div className="hero-orbit tilted" />
          <div className="hero-sphere">
            <FlaskConical size={84} strokeWidth={0.9} />
          </div>
          <span className="formula f1">ρ = m/V</span>
          <span className="formula f2">F = ma</span>
          <span className="visual-plus p1">+</span>
          <span className="visual-plus p2">+</span>
          <span className="visual-caption">ЦІКАВІСТЬ → ДОСЛІД → РОЗУМІННЯ</span>
        </div>
      </section>
      <section className="stats">
        <div>
          <span className="stat-icon mint">
            <FlaskConical />
          </span>
          <div>
            <small>{teacher ? "Призначено робіт" : "Доступно робіт"}</small>
            <strong>
              {assignments.length}
              <em>досліджень</em>
            </strong>
          </div>
        </div>
        <div>
          <span className="stat-icon lavender">
            <CheckCheck />
          </span>
          <div>
            <small>Оцінено</small>
            <strong>
              {graded.length}
              <em>робіт</em>
            </strong>
          </div>
        </div>
        <div>
          <span className="stat-icon peach">
            <Clock3 />
          </span>
          <div>
            <small>На перевірці</small>
            <strong>
              {pending.length}
              <em>робіт</em>
            </strong>
          </div>
        </div>
        <div>
          <span className="stat-icon blue">
            <Sparkles />
          </span>
          <div>
            <small>Середній бал</small>
            <strong>
              {avg}
              <em>із 12</em>
            </strong>
          </div>
        </div>
      </section>
      <div className="section-title">
        <h2>
          {teacher ? "Призначені дослідження" : "Мої лабораторні роботи"}{" "}
          <span>{assignments.length}</span>
        </h2>
        <Link href="/library">
          Усі 10 робіт <ArrowRight size={16} />
        </Link>
      </div>
      <LabGrid cards={cards} teacher={teacher} />
      <div className="bottom-tip">
        <span>✦</span>
        <p>
          <strong>Помилка — теж результат.</strong> Важливо зрозуміти, чому вона
          виникла, та перевірити своє припущення.
        </p>
      </div>
    </Shell>
  );
}
