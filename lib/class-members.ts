import type { Prisma } from "@prisma/client";
import { db } from "./db";
export class ClassAccessError extends Error {
  constructor(
    message: string,
    public status = 403,
  ) {
    super(message);
  }
}
/** Keep archive/delete serialized with joins, imports, assignments and student saves. */
export async function requireOpenClass(
  tx: Prisma.TransactionClient,
  classroomId: string,
) {
  const rows = await tx.$queryRaw<{ archivedAt: Date | null }[]>`
    SELECT "archivedAt" FROM "Classroom" WHERE "id"=${classroomId} FOR SHARE`;
  if (!rows.length) throw new ClassAccessError("Клас не знайдено.", 404);
  if (rows[0].archivedAt)
    throw new ClassAccessError(
      "Клас в архіві. Для внесення змін учитель має відновити клас.",
      409,
    );
}
/** Hold the membership read lock until a join/save finishes, so withdrawal cannot race a save. */
export async function requireClassMembership(
  tx: Prisma.TransactionClient,
  classroomId: string,
  userId: string,
  allowMissing = false,
) {
  await requireOpenClass(tx, classroomId);
  const rows = allowMissing
    ? await tx.$queryRaw<
        { status: string }[]
      >`SELECT "status" FROM "Membership" WHERE "classroomId"=${classroomId} AND "userId"=${userId} FOR UPDATE`
    : await tx.$queryRaw<
        { status: string }[]
      >`SELECT "status" FROM "Membership" WHERE "classroomId"=${classroomId} AND "userId"=${userId} FOR SHARE`;
  if (
    (!rows.length && !allowMissing) ||
    (rows.length && rows[0].status !== "ACTIVE")
  )
    throw new ClassAccessError(
      "Доступ до цього класу призупинено або учень вибув. Для відновлення зверніться до вчителя.",
    );
}
export async function changeClassMember(
  actorId: string,
  classroomId: string,
  userId: string,
  status: "ACTIVE" | "SUSPENDED" | "LEFT",
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${actorId} FOR SHARE`;
    const actor = await tx.user.findFirst({
      where: { id: actorId, role: "TEACHER", isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!actor) throw new ClassAccessError("Доступ учителя припинено.");
    await tx.$queryRaw`SELECT "id" FROM "Classroom" WHERE "id"=${classroomId} FOR UPDATE`;
    await requireOpenClass(tx, classroomId);
    if (
      !(await tx.classroom.findFirst({
        where: { id: classroomId, teacherId: actorId },
        select: { id: true },
      }))
    )
      throw new ClassAccessError("Клас не знайдено.", 404);
    const member = await tx.membership.findUnique({
      where: { classroomId_userId: { classroomId, userId } },
    });
    if (!member)
      throw new ClassAccessError("Учня не знайдено у цьому класі.", 404);
    if (member.status === "LEFT" && status === "SUSPENDED")
      throw new ClassAccessError(
        "Учень вибув. Спочатку відновіть його у класі.",
        409,
      );
    await tx.membership.update({ where: { id: member.id }, data: { status } });
    return { ok: true, status };
  });
}
