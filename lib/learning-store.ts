import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { ClassAccessError, requireClassMembership } from "./class-members";
import {
  correctedCalculations,
  learningCutoff,
  LEARNING_EVENT_LIMIT,
} from "./learning-progress";
import type { Answers, LabContent } from "./types";

export async function lockLearningJournal(
  tx: Prisma.TransactionClient,
  assignmentId: string,
  studentId: string,
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"learning:" + assignmentId + ":" + studentId}))`;
}
export async function getLearningJournal(
  assignmentId: string,
  studentId: string,
) {
  await db.learningEvent.deleteMany({
    where: { assignmentId, studentId, createdAt: { lt: learningCutoff() } },
  });
  const tracking = await db.learningTracking.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });
  const events = tracking?.enabled
    ? await db.learningEvent.findMany({
        where: {
          assignmentId,
          studentId,
          createdAt: { gte: learningCutoff() },
        },
        orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        take: LEARNING_EVENT_LIMIT,
        select: { kind: true, experimentId: true, payload: true },
      })
    : [];
  return { enabled: tracking?.enabled ?? false, events };
}
export async function recordCalculationCorrections(
  tx: Prisma.TransactionClient,
  assignmentId: string,
  studentId: string,
  submissionId: string,
  revision: number,
  content: LabContent,
  before: Answers,
  after: Answers,
) {
  await lockLearningJournal(tx, assignmentId, studentId);
  const tracking = await tx.learningTracking.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });
  if (!tracking?.enabled) return;
  await tx.learningEvent.deleteMany({
    where: { assignmentId, studentId, createdAt: { lt: learningCutoff() } },
  });
  const count = await tx.learningEvent.count({
    where: { assignmentId, studentId },
  });
  const fixes = correctedCalculations(content, before, after).slice(
    0,
    Math.max(0, LEARNING_EVENT_LIMIT - count),
  );
  if (fixes.length)
    await tx.learningEvent.createMany({
      data: fixes.map((fix, index) => ({
        eventId: `fix:${submissionId}:${revision}:${index}`,
        assignmentId,
        studentId,
        kind: "CALCULATION_FIXED",
        experimentId: fix.experimentId,
        payload: fix,
        occurredAt: new Date(),
      })),
      skipDuplicates: true,
    });
}
export async function requireLearningStudent(
  tx: Prisma.TransactionClient,
  assignmentId: string,
  studentId: string,
) {
  const assignment = await tx.assignment.findUnique({
    where: { id: assignmentId },
    include: { labVersion: true },
  });
  if (!assignment) throw new ClassAccessError("Роботу не знайдено.", 404);
  await requireClassMembership(tx, assignment.classroomId, studentId);
  await lockLearningJournal(tx, assignmentId, studentId);
  return assignment;
}
