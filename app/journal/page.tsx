import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { statuses } from "@/lib/submission-status";
import { teacherRosterNames } from "@/lib/roster-names";
export default async function Journal() {
  const u = await currentUser();
  if (!u) redirect("/");
  if (u.role !== "TEACHER") redirect("/dashboard");
  const rows = await db.submission.findMany({
    where: { assignment: { classroom: { teacherId: u.id } } },
    include: {
      student: { select: { name: true } },
      assignment: { include: { classroom: true, labVersion: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const rosterNames = await teacherRosterNames(u.id);
  return (
    <Shell title="Журнал оцінок">
      <div className="page-heading">
        <div>
          <div className="eyebrow">РЕЗУЛЬТАТИ ДОСЛІДЖЕНЬ</div>
          <h1>Журнал оцінок</h1>
          <p>
            Перевіряйте відповіді, підтримуйте прогрес і повертайтеся до
            попередніх спроб.
          </p>
        </div>
        <a href="/api/export" className="button secondary">
          <Download size={17} />
          Експорт CSV
        </a>
      </div>
      <div className="panel table-scroll">
        <table>
          <thead>
            <tr>
              <th>Учень</th>
              <th>Клас</th>
              <th>Робота</th>
              <th>Статус</th>
              <th>Оцінка</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  {rosterNames.get(
                    `${s.assignment.classroomId}:${s.studentId}`,
                  ) ?? s.student.name}
                </td>
                <td>{s.assignment.classroom.name}</td>
                <td>
                  № {s.assignment.labVersion.number} ·{" "}
                  {s.assignment.labVersion.title}
                </td>
                <td>
                  <span className={"status " + s.status.toLowerCase()}>
                    {statuses[s.status]}
                  </span>
                </td>
                <td>{s.score !== null ? s.score + "/12" : "—"}</td>
                <td>
                  <Link href={"/review/" + s.id}>Відкрити →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="empty">
            Коли учні почнуть роботи, їхні результати з’являться тут.
          </p>
        )}
      </div>
    </Shell>
  );
}
