import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { invitationMailConfig } from "./invitation-email";
import { randomBytes, createHash } from "node:crypto";
export class AdminActionError extends Error {
  constructor(
    message: string,
    public status = 409,
    public existingStudent?: { id: string; name: string; email: string },
  ) {
    super(message);
  }
}
async function requireActiveAdmin(
  tx: Prisma.TransactionClient,
  actorId: string,
) {
  const actor = await tx.user.findFirst({
    where: { id: actorId, role: "TEACHER", isAdmin: true, isActive: true },
    select: { id: true },
  });
  if (!actor)
    throw new AdminActionError("Доступ адміністратора припинено.", 403);
}
export async function adminOverview() {
  const [teachers, invitations, audit, templates] = await Promise.all([
    db.user.findMany({
      where: { role: "TEACHER" },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        removedAt: true,
        isAdmin: true,
        _count: { select: { ownedClasses: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.teacherInvite.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      select: { tokenHash: true, email: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.adminAudit.findMany({
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.labVersion.count({ where: { authorId: null, version: 1 } }),
  ]);
  const config = invitationMailConfig();
  return {
    teachers,
    invitations: invitations.map((i) => ({
      id: i.tokenHash,
      email: i.email,
      expiresAt: i.expiresAt.toISOString(),
    })),
    audit: audit.map((a) => ({
      id: a.id,
      actor: a.actor?.name ?? "Оператор сервера",
      action: a.action,
      email: (a.detail as { email?: string }).email ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
    system: {
      database: true,
      templates,
      mailConfigured: Boolean(config),
      sender: config?.from ?? null,
      siteUrl: config?.url ?? null,
    },
  };
}
export async function createTeacherInvitation(actorId: string, email: string) {
  const token = randomBytes(24).toString("hex"),
    tokenHash = createHash("sha256").update(token).digest("hex"),
    expiresAt = new Date(Date.now() + 86400000);
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('fizlab-staff-access'))`;
    await requireActiveAdmin(tx, actorId);
    const existing = await tx.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (existing?.role === "STUDENT" && existing.isActive)
      throw new AdminActionError(
        "Ця адреса вже має учнівський обліковий запис. Якщо це ваш колега, підтвердьте зміну ролі нижче.",
        409,
        { id: existing.id, name: existing.name, email: existing.email },
      );
    if (existing)
      throw new AdminActionError(
        existing.role === "TEACHER"
          ? "Ця адреса вже належить учителю. Скористайтеся керуванням доступом у команді вчителів."
          : "Цей обліковий запис призупинено. Зверніться до оператора сервера перед зміною ролі.",
      );
    if (
      await tx.teacherInvite.findFirst({
        where: { email, usedAt: null, expiresAt: { gt: new Date() } },
      })
    )
      throw new AdminActionError(
        "Для цієї адреси вже є чинне запрошення. Відкличте його, щоб створити нове.",
      );
    await tx.teacherInvite.create({
      data: { tokenHash, email, expiresAt, createdById: actorId },
    });
    await tx.adminAudit.create({
      data: {
        actorId,
        targetId: tokenHash,
        action: "TEACHER_INVITED",
        detail: { email },
      },
    });
  });
  return { token, email, expiresAt: expiresAt.toISOString() };
}
export async function promoteStudentToTeacher(
  actorId: string,
  id: string,
  email: string,
) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('fizlab-staff-access'))`;
    await requireActiveAdmin(tx, actorId);
    // Coordinate session revocation with concurrent logins on the same user row.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${id} FOR UPDATE`;
    const target = await tx.user.findFirst({
      where: { id, email },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!target)
      throw new AdminActionError(
        "Обліковий запис не знайдено. Перевірте адресу.",
        404,
      );
    if (!target.isActive)
      throw new AdminActionError(
        "Обліковий запис призупинено. Зміну ролі не виконано.",
      );
    if (target.role !== "STUDENT")
      throw new AdminActionError(
        "Обліковий запис уже має роль учителя. Оновіть сторінку.",
      );
    await tx.user.update({
      where: { id },
      data: { role: "TEACHER", isAdmin: false },
    });
    await tx.session.deleteMany({ where: { userId: id } });
    const invitations = await tx.teacherInvite.deleteMany({
      where: { email, usedAt: null },
    });
    await tx.adminAudit.create({
      data: {
        actorId,
        targetId: id,
        action: "TEACHER_ROLE_GRANTED",
        detail: {
          email,
          previousRole: "STUDENT",
          revokedInvitations: invitations.count,
        },
      },
    });
    return { id: target.id, name: target.name, email: target.email };
  });
}
export async function revokeTeacherInvitation(actorId: string, id: string) {
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('fizlab-staff-access'))`;
    await requireActiveAdmin(tx, actorId);
    const invite = await tx.teacherInvite.findUnique({
      where: { tokenHash: id },
    });
    if (!invite) throw new AdminActionError("Запрошення не знайдено.", 404);
    const removed = await tx.teacherInvite.deleteMany({
      where: { tokenHash: id, usedAt: null },
    });
    if (!removed.count)
      throw new AdminActionError(
        "Запрошення вже використане. Оновіть сторінку.",
      );
    await tx.adminAudit.create({
      data: {
        actorId,
        targetId: id,
        action: "INVITATION_REVOKED",
        detail: { email: invite.email },
      },
    });
  });
}
export async function setTeacherAccess(
  actorId: string,
  id: string,
  active: boolean,
  remove = false,
) {
  if (id === actorId)
    throw new AdminActionError(
      "Не можна змінити власний доступ через цю сторінку.",
    );
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('fizlab-staff-access'))`;
    await requireActiveAdmin(tx, actorId);
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${id} FOR UPDATE`;
    const teacher = await tx.user.findFirst({ where: { id, role: "TEACHER" } });
    if (!teacher) throw new AdminActionError("Учителя не знайдено.", 404);
    if (
      !active &&
      teacher.isAdmin &&
      (await tx.user.count({
        where: {
          role: "TEACHER",
          isAdmin: true,
          isActive: true,
          id: { not: id },
        },
      })) === 0
    )
      throw new AdminActionError(
        "Потрібен хоча б один активний адміністратор.",
      );
    if (teacher.isActive === active && !teacher.removedAt && !remove) return;
    await tx.user.update({
      where: { id },
      data: { isActive: active, removedAt: remove ? new Date() : null },
    });
    await tx.session.deleteMany({ where: { userId: id } });
    await tx.adminAudit.create({
      data: {
        actorId,
        targetId: id,
        action: remove
          ? "TEACHER_REMOVED"
          : active
            ? "TEACHER_ENABLED"
            : "TEACHER_BLOCKED",
        detail: { email: teacher.email },
      },
    });
  });
}
