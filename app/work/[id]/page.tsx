import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { Workspace } from "@/components/workspace";
import type { LabContent } from "@/lib/types";
export default async function Work({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/");
  const a = await db.assignment.findFirst({
    where: {
      id: (await params).id,
      classroom: { memberships: { some: { userId: u.id } } },
    },
    include: { labVersion: true, classroom: true },
  });
  if (!a || u.role !== "STUDENT") notFound();
  const submission = await db.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId: a.id, studentId: u.id } },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      attempts: { orderBy: { createdAt: "asc" } },
    },
  });
  return (
    <Shell title="Лабораторний зошит">
      <Link href="/dashboard" className="back-link">
        ← Мої роботи
      </Link>
      <div className="page-heading work-heading">
        <div>
          <div className="eyebrow">
            ЛАБОРАТОРНА РОБОТА {String(a.labVersion.number).padStart(2, "0")} ·{" "}
            {a.classroom.name}
          </div>
          <h1>{a.labVersion.title}</h1>
          <p>
            Спостерігайте уважно. Записуйте чесно. Пояснюйте власними словами.
          </p>
        </div>
      </div>
      <Workspace
        assignmentId={a.id}
        userId={u.id}
        content={a.labVersion.content as unknown as LabContent}
        number={a.labVersion.number}
        initial={
          submission
            ? {
                ...submission,
                attempts: submission.attempts.map((s) => ({
                  ...s,
                  createdAt: s.createdAt.toISOString(),
                })),
              }
            : null
        }
        feedbackMode={a.feedbackMode}
        experimentMode={a.experimentMode}
      />
    </Shell>
  );
}
