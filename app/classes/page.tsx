import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/shell";
import { ClassAction, CopyCode } from "@/components/class-actions";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
export default async function Classes() {
  const u = await currentUser();
  if (!u) redirect("/");
  const teacher = u.role === "TEACHER";
  const classes = await db.classroom.findMany({
    where: teacher
      ? { teacherId: u.id }
      : { memberships: { some: { userId: u.id, status: "ACTIVE" } } },
    include: {
      _count: {
        select: {
          memberships: { where: { status: "ACTIVE" } },
          assignments: true,
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
      <div className="class-grid">
        {classes.map((c) => (
          <article className="panel class-card" key={c.id}>
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
            {teacher && (
              <div>
                <small className="muted">Код для приєднання</small>
                <CopyCode code={c.code} />
              </div>
            )}
          </article>
        ))}
      </div>
    </Shell>
  );
}
