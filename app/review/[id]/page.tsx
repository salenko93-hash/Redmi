import { inquiryRubric, isRampInquiry } from "@/lib/ramp-inquiry";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
import { Workspace } from "@/components/workspace";
import { ReviewForm } from "@/components/review-form";
import { checkCalculations } from "@/lib/physics";
import type { Answers, LabContent } from "@/lib/types";
export default async function Review({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/");
  if (u.role !== "TEACHER") notFound();
  const s = await db.submission.findFirst({
    where: {
      id: (await params).id,
      assignment: { classroom: { teacherId: u.id } },
    },
    include: {
      student: { select: { name: true } },
      assignment: { include: { classroom: true, labVersion: true } },
      comments: { orderBy: { createdAt: "asc" } },
      attempts: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!s) notFound();
  const membership = await db.membership.findUnique({
    where: {
      classroomId_userId: {
        classroomId: s.assignment.classroomId,
        userId: s.studentId,
      },
    },
    select: { rosterName: true },
  });
  const content = s.assignment.labVersion.content as unknown as LabContent;
  const checks = checkCalculations(content, s.answers as Answers);
  return (
    <Shell title="Перевірка роботи">
      <Link href={"/classes/" + s.assignment.classroomId} className="back-link">
        ← До класу
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            ПЕРЕВІРКА · {s.assignment.classroom.name}
          </div>
          <h1>{membership?.rosterName ?? s.student.name}</h1>
          <p>
            № {s.assignment.labVersion.number} · {s.assignment.labVersion.title}{" "}
            · Версія {s.assignment.labVersion.version}
          </p>
        </div>
      </div>
      <Link
        className="button secondary no-print"
        href={`/progress?class=${s.assignment.classroomId}&student=${s.studentId}`}
      >
        Навчальний поступ учня →
      </Link>
      <ReviewForm
        id={s.id}
        revision={s.revision}
        status={s.status}
        initialRubric={s.rubric}
        initialFeedback={s.feedback}
        criteria={isRampInquiry(content) ? inquiryRubric : undefined}
        fields={[
          { key: "prediction", label: "Прогноз" },
          ...(isRampInquiry(content)
            ? [
                { key: "inquiry-plan", label: "План перевірки" },
                { key: "inquiry-evidence", label: "Докази та перевірка" },
                { key: "inquiry-reflection", label: "Перегляд прогнозу" },
              ]
            : []),
          ...content.experiments.map((e) => ({ key: e.id, label: e.title })),
          ...content.questions.map((_, i) => ({
            key: "question-" + i,
            label: "Запитання " + (i + 1),
          })),
          { key: "conclusion", label: "Висновок" },
          ...(content.diagram ? [{ key: "diagram", label: "Схеми сил" }] : []),
        ]}
      />
      <details className="panel no-print">
        <summary>Перевірка обчислень · {checks.length} полів</summary>
        <p className="muted">
          Перевіряється арифметика за введеними даними, а не достовірність
          вимірювань чи пояснень.
        </p>
        {checks.map((c, i) => (
          <p key={i} className={c.error ? "field-error" : ""}>
            {c.experiment}, рядок {c.row}, {c.field}:{" "}
            {c.actual || "не заповнено"} ·{" "}
            {c.error ?? (c.actual ? "обчислення узгоджене" : "немає відповіді")}
            {c.expected !== null
              ? " · За формулою: " + Number(c.expected.toPrecision(5))
              : ""}
          </p>
        ))}
      </details>
      <Workspace
        reportMeta={{
          title: s.assignment.labVersion.title,
          studentName: membership?.rosterName ?? s.student.name,
          classroom: s.assignment.classroom.name,
        }}
        preview
        assignmentId={s.assignmentId}
        userId={s.studentId}
        content={content}
        number={s.assignment.labVersion.number}
        initial={{
          ...s,
          attempts: s.attempts.map((a) => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
          })),
        }}
        feedbackMode="PRACTICE"
        experimentMode={s.assignment.experimentMode}
      />
    </Shell>
  );
}
