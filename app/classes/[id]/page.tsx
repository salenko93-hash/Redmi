import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { AssignForm, CopyCode } from "@/components/class-actions";
import { statuses } from "@/components/lab-grid";
export default async function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/");
  const c = await db.classroom.findFirst({
    where: {
      id: (await params).id,
      ...(u.role === "TEACHER"
        ? { teacherId: u.id }
        : { memberships: { some: { userId: u.id } } }),
    },
    include: {
      memberships: { include: { user: { select: { id: true, name: true } } } },
      assignments: {
        include: {
          labVersion: true,
          submissions: { include: { student: { select: { name: true } } } },
        },
        orderBy: { labVersion: { number: "asc" } },
      },
    },
  });
  if (!c) notFound();
  const teacher = u.role === "TEACHER";
  const all = teacher
    ? await db.labVersion.findMany({
        where: { OR: [{ authorId: null }, { authorId: u.id }] },
        orderBy: [{ number: "asc" }, { version: "desc" }],
        distinct: ["number"],
      })
    : [];
  return (
    <Shell title="Клас">
      <Link className="back-link" href="/classes">
        ← Усі класи
      </Link>
      <div className="page-heading">
        <div>
          <h1>{c.name}</h1>
          <p>
            {c.memberships.length} учнів · {c.assignments.length} призначених
            робіт
          </p>
        </div>
        {teacher && <CopyCode code={c.code} />}
      </div>
      <div className={teacher ? "two-column" : "single-column"}>
        <section>
          <div className="panel">
            <h2>Дослідження класу</h2>
            {!c.assignments.length && (
              <p className="muted">Ще немає призначених робіт.</p>
            )}
            {c.assignments.map((a) => (
              <div className="assignment-row" key={a.id}>
                <div>
                  <small className="eyebrow">
                    РОБОТА {a.labVersion.number} · ВЕРСІЯ {a.labVersion.version}
                  </small>
                  <h3>{a.labVersion.title}</h3>
                  <small className="muted">
                    {a.experimentMode === "REAL"
                      ? "Власний експеримент"
                      : "Надані дані"}{" "}
                    ·{" "}
                    {a.feedbackMode === "PRACTICE"
                      ? "З підказками"
                      : "Самостійно"}
                    {a.dueAt
                      ? " · До " +
                        a.dueAt.toLocaleDateString("uk-UA", {
                          timeZone: "Europe/Kyiv",
                        })
                      : ""}
                  </small>
                </div>
                {!teacher ? (
                  <Link className="button secondary" href={"/work/" + a.id}>
                    Відкрити
                  </Link>
                ) : (
                  <span className="pill">
                    {
                      a.submissions.filter((s) => s.status === "SUBMITTED")
                        .length
                    }{" "}
                    на перевірці
                  </span>
                )}
                {teacher && (
                  <div className="student-list">
                    {c.memberships.map((m) => {
                      const s = a.submissions.find(
                        (s) => s.studentId === m.user.id,
                      );
                      return (
                        <div key={m.id}>
                          <span>
                            {m.user.name}{" "}
                            {s && (s.answers as { help?: boolean }).help && (
                              <span title="Потребує допомоги">🙋</span>
                            )}
                          </span>
                          {s ? (
                            <Link
                              href={"/review/" + s.id}
                              className="review-link"
                            >
                              {statuses[s.status]}
                              {s.score !== null
                                ? " · " + s.score + "/12"
                                : ""}{" "}
                              →
                            </Link>
                          ) : (
                            <small className="muted">Не розпочато</small>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          {teacher && (
            <div className="panel">
              <h2>Учні класу</h2>
              {c.memberships.map((m) => (
                <p key={m.id}>{m.user.name}</p>
              ))}
              {!c.memberships.length && (
                <p className="muted">Поділіться кодом класу з учнями.</p>
              )}
            </div>
          )}
        </section>
        {teacher && <AssignForm classroomId={c.id} labs={all} />}
      </div>
    </Shell>
  );
}
