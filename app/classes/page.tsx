import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/shell";
import { ClassAction, CopyCode } from "@/components/class-actions";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClassroomActions } from "@/components/classroom-actions";
export default async function Classes({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/");
  const teacher = u.role === "TEACHER";
  const archived = (await searchParams).view === "archive";
  const access = teacher
    ? { teacherId: u.id }
    : { memberships: { some: { userId: u.id, status: "ACTIVE" } } };
  const [activeCount, archiveCount] = await Promise.all([
    db.classroom.count({ where: { ...access, archivedAt: null } }),
    db.classroom.count({ where: { ...access, archivedAt: { not: null } } }),
  ]);
  const classes = await db.classroom.findMany({
    where: { ...access, archivedAt: archived ? { not: null } : null },
    include: {
      _count: {
        select: {
          memberships: true,
          assignments: true,
          studentInvites: true,
        },
      },
      teacher: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <Shell title="Класи">
      <div className="page-heading">
        <div>
          <div className="eyebrow">НАВЧАЄМОСЯ РАЗОМ</div>
          <h1>{teacher ? "Мої класи" : "Мій клас"}</h1>
          <p>
            {teacher
              ? "Створіть клас, запросіть учнів і призначте перший дослід."
              : "Приєднайтеся за кодом, який надав учитель."}
          </p>
        </div>
      </div>
      <section className="panel">
        <ClassAction teacher={teacher} />
      </section>
      <nav
        className="button-row"
        aria-label="Список класів"
        style={{ marginBottom: 22 }}
      >
        <Link
          href="/classes"
          className={`button ${!archived ? "primary" : "secondary"}`}
          aria-current={!archived ? "page" : undefined}
        >
          Активні · {activeCount}
        </Link>
        <Link
          href="/classes?view=archive"
          className={`button ${archived ? "primary" : "secondary"}`}
          aria-current={archived ? "page" : undefined}
        >
          Архів · {archiveCount}
        </Link>
      </nav>
      {archived && (
        <p className="muted">
          Архівні класи доступні для перегляду. Відновлення повертає клас до
          активного списку.
        </p>
      )}
      {!classes.length && (
        <section className="panel">
          <p>{archived ? "Архів порожній." : "Ще немає активних класів."}</p>
        </section>
      )}
      <div className="class-grid">
        {classes.map((c) => (
          <article className="panel class-card" key={c.id}>
            {c.archivedAt && <span className="pill">В архіві</span>}
            <span className="lab-symbol tone-0">
              <Users />
            </span>
            <h2>
              <Link href={"/classes/" + c.id}>
                {c.name} <ArrowUpRight size={20} />
              </Link>
            </h2>
            <p>{c.teacher.name}</p>
            <div className="class-metrics">
              <span>{c._count.memberships} учнів</span>
              <span>{c._count.assignments} робіт</span>
            </div>
            {teacher && !archived && (
              <div>
                <small className="muted">Код для приєднання</small>
                <CopyCode code={c.code} />
              </div>
            )}
            {teacher && (
              <ClassroomActions
                id={c.id}
                name={c.name}
                archived={archived}
                empty={
                  c._count.memberships === 0 &&
                  c._count.assignments === 0 &&
                  c._count.studentInvites === 0
                }
              />
            )}
          </article>
        ))}
      </div>
    </Shell>
  );
}
