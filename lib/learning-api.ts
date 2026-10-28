import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "./db";
import { ClassAccessError } from "./class-members";
import { getLearningJournal, requireLearningStudent } from "./learning-store";
import {
  buildLearningReport,
  learningEventSchema,
  learningCutoff,
  LEARNING_EVENT_LIMIT,
} from "./learning-progress";
import { initialParameters, validateParameters } from "./simulation";
import type { Answers, LabContent } from "./types";

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function learningApi(
  req: NextRequest,
  user: { id: string; role: string },
  assignmentId: string,
) {
  if (user.role !== "STUDENT")
    throw new ClassAccessError("Журналом керує учень у власній роботі.");
  if (!["GET", "PUT", "POST"].includes(req.method))
    return json({ error: "Метод не підтримується." }, 405);
  if (req.method === "GET") {
    const assignment = await db.assignment.findFirst({
      where: {
        id: assignmentId,
        classroom: {
          memberships: { some: { userId: user.id, status: "ACTIVE" } },
        },
      },
      include: { labVersion: true },
    });
    if (!assignment) throw new ClassAccessError("Роботу не знайдено.", 404);
    const journal = await getLearningJournal(assignmentId, user.id);
    const submission = await db.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
    });
    const report = buildLearningReport(
      assignment.labVersion.content as unknown as LabContent,
      (submission?.answers ?? {}) as Answers,
      journal.events,
    );
    // Assessment calculations remain private until the teacher grades the work.
    if (
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
    return json({ enabled: journal.enabled, report });
  }
  if (req.method === "PUT") {
    const { enabled } = z
      .object({ enabled: z.boolean() })
      .strict()
      .parse(await req.json());
    await db.$transaction(async (tx) => {
      await requireLearningStudent(tx, assignmentId, user.id);
      await tx.learningTracking.upsert({
        where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
        create: { assignmentId, studentId: user.id, enabled },
        update: { enabled },
      });
      if (!enabled)
        await tx.learningEvent.deleteMany({
          where: { assignmentId, studentId: user.id },
        });
    });
    return json({ enabled });
  }
  const input = z
    .object({ events: z.array(learningEventSchema).min(1).max(20) })
    .strict()
    .parse(await req.json());
  const result = await db.$transaction(async (tx) => {
    const assignment = await requireLearningStudent(tx, assignmentId, user.id);
    const tracking = await tx.learningTracking.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
    });
    if (!tracking?.enabled)
      throw new ClassAccessError("Запис навчальних дій вимкнено.", 409);
    const submission = await tx.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
      select: { status: true },
    });
    if (submission && !["DRAFT", "RETURNED"].includes(submission.status))
      throw new ClassAccessError(
        "Роботу вже здано. Журнал доступний для перегляду.",
        409,
      );
    const content = assignment.labVersion.content as unknown as LabContent;
    for (const event of input.events) {
      if (
        "experimentId" in event &&
        !content.experiments.some((e) => e.id === event.experimentId)
      )
        throw new ClassAccessError("Невідома серія дослідів.", 422);
      if (event.kind === "RUN_COMPLETED") {
        const p = event.payload.parameters;
        const defaults = initialParameters(
          assignment.labVersion.number,
          event.experimentId,
        );
        if (
          Object.keys(p).length !== Object.keys(defaults).length ||
          Object.keys(defaults).some((k) => !(k in p)) ||
          !validateParameters(
            assignment.labVersion.number,
            event.experimentId,
            p,
          )
        )
          throw new ClassAccessError("Некоректні параметри досліду.", 422);
      }
    }
    await tx.learningEvent.deleteMany({
      where: {
        assignmentId,
        studentId: user.id,
        createdAt: { lt: learningCutoff() },
      },
    });
    const count = await tx.learningEvent.count({
      where: { assignmentId, studentId: user.id },
    });
    const data = input.events
      .slice(0, Math.max(0, LEARNING_EVENT_LIMIT - count))
      .map((event) => ({
        ...event,
        experimentId: "experimentId" in event ? event.experimentId : null,
        assignmentId,
        studentId: user.id,
        // Client order is for trial comparisons only. Retention always uses server time.
        occurredAt: new Date(event.occurredAt),
      }));
    const inserted = data.length
      ? await tx.learningEvent.createMany({ data, skipDuplicates: true })
      : { count: 0 };
    return {
      recorded: inserted.count,
      capped: count + data.length >= LEARNING_EVENT_LIMIT,
    };
  });
  return json(result, 201);
}
