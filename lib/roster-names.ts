import { db } from "./db";
export async function teacherRosterNames(teacherId: string) {
  const rows = await db.membership.findMany({
    where: { classroom: { teacherId }, rosterName: { not: null } },
    select: { classroomId: true, userId: true, rosterName: true },
  });
  return new Map(
    rows.map((r) => [`${r.classroomId}:${r.userId}`, r.rosterName!]),
  );
}
