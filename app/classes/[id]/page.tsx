import Link from "next/link";
import { MemberActions } from "@/components/member-actions";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import {
  AssignForm,
  CopyCode,
  AssignmentMode,
} from "@/components/class-actions";
import { statuses } from "@/components/lab-grid";
import { StudentImport } from "@/components/student-import";
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
        : { memberships: { some: { userId: u.id, isActive: true } } }),
    },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
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
  c.memberships.sort((a, b) =>
    (a.rosterName ?? a.user.name).localeCompare(
      b.rosterName ?? b.user.name,
      "uk",
    ),
  );
  const invites = teacher
    ? await db.studentInvite.findMany({
        where: { classroomId: c.id, claimedAt: null },
        select: { id: true, name: true, email: true, code: true },
        orderBy: { name: "asc" },
      })
    : [];

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
            {c.memberships.filter((m) => m.isActive).length} активних учнів
            {teacher && invites.length > 0
              ? ` · ${invites.length} очікують приєднання`
              : ""}{" "}
            · {c.assignments.length} призначених робіт
          </p>
        </div>
        {teacher && <CopyCode code={c.code} />}
      </div>
      <div className={teacher ? "two-column" : "single-column"}>
        <section>
          {teacher && (
            <div className="panel">
              <h2>Учні класу</h2>
              <StudentImport classroomId={c.id} invites={invites} />
              {c.memberships.length > 0 && (
                <h3>Приєдналися · {c.memberships.length}</h3>
              )}
              <p className="muted">
                Видалення з активного списку закриває доступ лише до цього
                класу. Роботи й оцінки зберігаються; учня можна відновити.
              </p>
              {c.memberships.map((m) => (
                <div key={m.id} data-roster-member={m.user.id}>
                  {m.rosterName ?? m.user.name}{" "}
                  <small className="muted">· {m.user.email}</small>
                  <MemberActions
                    classroomId={c.id}
                    userId={m.user.id}
                    name={m.rosterName ?? m.user.name}
                    active={m.isActive}
                    removed={Boolean(m.removedAt)}
                  />
                </div>
              ))}
              {!c.memberships.length && !invites.length && (
                <p className="muted">Поділіться кодом класу з учнями.</p>
              )}
            </div>
          )}
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
                    {a.experimentMode === "SIMULATION"
                      ? "Віртуальний експеримент"
                      : a.experimentMode === "REAL"
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
                  <AssignmentMode
                    id={a.id}
                    mode={a.experimentMode}
                    locked={a.submissions.some(
                      (s) =>
                        s.status !== "DRAFT" ||
                        ((s.answers as { simulationRecords?: unknown[] })
                          .simulationRecords?.length ?? 0) > 0,
                    )}
                  />
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
                            {m.rosterName ?? m.user.name}
                            {!m.isActive && (
                              <small className="muted">
                                {" "}
                                ·{" "}
                                {m.removedAt ? "Вибув / вибула" : "Призупинено"}
                              </small>
                            )}{" "}
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
        </section>
        {teacher && <AssignForm classroomId={c.id} labs={all} />}
      </div>
    </Shell>
  );
}
