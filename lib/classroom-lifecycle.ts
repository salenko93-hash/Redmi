import { db } from "./db";
import { ClassAccessError } from "./class-members";

export async function changeClassroom(
  actorId: string,
  classroomId: string,
  action: "archive" | "restore" | "delete",
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${actorId} FOR SHARE`;
    const actor = await tx.user.findFirst({
      where: { id: actorId, role: "TEACHER", isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!actor)
      throw new ClassAccessError("Доступ лише для активного вчителя.");
    await tx.$queryRaw`SELECT "id" FROM "Classroom" WHERE "id"=${classroomId} FOR UPDATE`;
    const classroom = await tx.classroom.findFirst({
      where: { id: classroomId, teacherId: actorId },
      include: {
        _count: {
          select: {
            memberships: true,
            assignments: true,
            studentInvites: true,
          },
        },
      },
    });
    if (!classroom) throw new ClassAccessError("Клас не знайдено.", 404);
    if (action === "delete") {
      if (Object.values(classroom._count).some((count) => count > 0))
        throw new ClassAccessError(
          "Видалити можна лише порожній клас без учнів, запрошень і призначених робіт. Скористайтеся архівуванням.",
          409,
        );
      await tx.classroom.delete({ where: { id: classroomId } });
      return { ok: true, deleted: true };
    }
    await tx.classroom.update({
      where: { id: classroomId },
      data: {
        archivedAt:
          action === "archive" ? (classroom.archivedAt ?? new Date()) : null,
      },
    });
    return { ok: true, archived: action === "archive" };
  });
}
