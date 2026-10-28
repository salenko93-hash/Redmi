import { validateSimulationRecords } from "@/lib/simulation";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  currentUser,
  hashToken,
  logout,
  rateLimit,
  newToken,
} from "@/lib/auth";
import {
  answersSchema,
  credentials,
  registrationCredentials,
} from "@/lib/validation";
import { parseRosterCsv, planRoster, rosterCsvCell } from "@/lib/roster";
import {
  invitationMailConfig,
  invitationMessage,
  invitationTransport,
  definiteMailFailure,
} from "@/lib/invitation-email";
import { teacherRosterNames } from "@/lib/roster-names";
import { completeness, checkCalculations } from "@/lib/physics";
import type { Answers, LabContent } from "@/lib/types";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const fail = (message: string, status = 400) =>
  json({ error: message }, status);
async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    const path = (await ctx.params).path;
    const route = path.join("/");
    const method = req.method;
    if (method !== "GET") {
      const origin = req.headers.get("origin");
      const expected = new URL(process.env.APP_URL ?? req.url).origin;
      if (!origin || origin !== expected)
        return fail("Недозволене джерело запиту.", 403);
      if (Number(req.headers.get("content-length") ?? 0) > 250000)
        return fail("Завеликий запит.", 413);
    }
    if (route === "auth/logout" && method === "POST") {
      await logout();
      return json({ ok: true });
    }
    if (route === "auth/recover" && method === "POST") {
      const input = z
        .object({
          email: z
            .email()
            .trim()
            .transform((s) => s.toLowerCase()),
          code: z.string().trim().min(10).max(100),
          password: z.string().min(10).max(128),
        })
        .parse(await req.json());
      if (!(await rateLimit("recover:" + hashToken(input.email), 5)))
        return fail("Забагато спроб. Спробуйте через 15 хвилин.", 429);
      const replacement = newToken();
      const passwordHash = await hash(input.password, 12);
      const ok = await db.$transaction(async (tx) => {
        const u = await tx.user.findFirst({
          where: { email: input.email, recoveryHash: hashToken(input.code) },
        });
        if (!u) return false;
        const changed = await tx.user.updateMany({
          where: { id: u.id, recoveryHash: hashToken(input.code) },
          data: { passwordHash, recoveryHash: hashToken(replacement) },
        });
        if (!changed.count) return false;
        await tx.session.deleteMany({ where: { userId: u.id } });
        return true;
      });
      if (!ok) return fail("Неправильна пошта або код відновлення.", 401);
      return json({ ok: true, recoveryCode: replacement });
    }
    if (
      (route === "auth/login" || route === "auth/register") &&
      method === "POST"
    ) {
      const input = (
        route === "auth/register" ? registrationCredentials : credentials
      ).parse(await req.json());
      if (!(await rateLimit("auth:" + hashToken(input.email), 10)))
        return fail("Забагато спроб. Спробуйте через 15 хвилин.", 429);
      if (route === "auth/login") {
        const user = await db.user.findUnique({
          where: { email: input.email },
        });
        // Always perform a password comparison, even for unknown accounts.
        const valid = await compare(
          input.password,
          user?.passwordHash ??
            "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW",
        );
        if (!user || !valid || !user.isActive)
          return fail("Неправильна пошта або пароль.", 401);
        await createSession(user.id);
        return json({ ok: true });
      }
      if (!input.name) return fail("Вкажіть ім’я.");
      const requestedRole = "role" in input ? input.role : undefined;
      const studentCode =
        "studentCode" in input
          ? (input.studentCode as string | undefined)
          : undefined;
      if (requestedRole === "TEACHER" && studentCode)
        return fail(
          "Код учня не підходить для ролі «Учитель». Потрібне запрошення адміністратора.",
        );
      if (input.invite && studentCode)
        return fail("Використайте лише код, який відповідає обраній ролі.");
      if (requestedRole === "TEACHER" && !input.invite)
        return fail(
          "Для реєстрації вчителя введіть код запрошення від адміністратора.",
        );
      if (requestedRole === "STUDENT" && input.invite)
        return fail(
          "Код запрошення вчителя можна використати лише з роллю «Учитель».",
        );
      if (requestedRole === "STUDENT" && !studentCode)
        return fail("Для реєстрації учня введіть особистий код від учителя.");
      const passwordHash = await hash(input.password, 12);
      const recoveryCode = newToken();
      const user = await db.$transaction(async (tx) => {
        let role: "STUDENT" | "TEACHER" = "STUDENT";
        // A pending staff invitation must not silently become a pupil account.
        if (
          !input.invite &&
          (await tx.teacherInvite.findFirst({
            where: {
              email: input.email,
              usedAt: null,
              expiresAt: { gt: new Date() },
            },
            select: { tokenHash: true },
          }))
        )
          throw new Error("TEACHER_INVITE_REQUIRED");
        if (input.invite) {
          const used = await tx.teacherInvite.updateMany({
            where: {
              tokenHash: hashToken(input.invite),
              usedAt: null,
              expiresAt: { gt: new Date() },
              OR: [{ email: null }, { email: input.email }],
            },
            data: { usedAt: new Date() },
          });
          if (!used.count) throw new Error("INVALID_INVITE");
          role = "TEACHER";
        }
        const studentInvite = studentCode
          ? await tx.studentInvite.findUnique({ where: { code: studentCode } })
          : null;
        if (
          studentCode &&
          (!studentInvite ||
            studentInvite.claimedAt ||
            studentInvite.claimedById ||
            (studentInvite.email && studentInvite.email !== input.email))
        )
          throw new Error("INVALID_STUDENT_INVITE");
        const created = await tx.user.create({
          data: {
            email: input.email,
            name: input.name!,
            passwordHash,
            role,
            recoveryHash: hashToken(recoveryCode),
          },
        });
        if (studentInvite) {
          const claimed = await tx.studentInvite.updateMany({
            where: { id: studentInvite.id, claimedAt: null, claimedById: null },
            data: { claimedById: created.id, claimedAt: new Date() },
          });
          if (!claimed.count) throw new Error("INVALID_STUDENT_INVITE");
          await tx.membership.create({
            data: {
              userId: created.id,
              classroomId: studentInvite.classroomId,
              rosterName: studentInvite.name,
            },
          });
        }
        return created;
      });
      await createSession(user.id);
      return json({ ok: true, recoveryCode }, 201);
    }
    const user = await currentUser();
    if (!user) return fail("Увійдіть у свій обліковий запис.", 401);
    if (
      path[0] === "classes" &&
      path[2] === "students" &&
      ((path.length === 4 && ["import", "codes", "email"].includes(path[3])) ||
        (path.length === 5 && path[3] === "invites"))
    ) {
      if (user.role !== "TEACHER") return fail("Доступ лише для вчителя.", 403);
      const classroom = await db.classroom.findFirst({
        where: { id: path[1], teacherId: user.id },
        select: { id: true, name: true },
      });
      if (!classroom) return fail("Клас не знайдено.", 404);
      if (path[3] === "email" && path.length === 4) {
        const config = invitationMailConfig();
        if (method === "GET") {
          const invites = await db.studentInvite.findMany({
            where: { classroomId: classroom.id, claimedAt: null },
            select: {
              id: true,
              name: true,
              email: true,
              emailStatus: true,
              emailAttemptAt: true,
              emailSentAt: true,
            },
            orderBy: { name: "asc" },
          });
          return json({
            configured: Boolean(config),
            sender: config?.from ?? null,
            siteUrl: config?.url ?? null,
            invites,
          });
        }
        if (method === "POST") {
          const { ids, resend } = z
            .object({
              ids: z.array(z.string().min(1).max(100)).min(1).max(5),
              resend: z.boolean().default(false),
            })
            .parse(await req.json());
          if (!config)
            return fail(
              "Розсилка ще не налаштована. Попросіть адміністратора підключити пошту та публічну адресу сайту.",
              503,
            );
          if (!(await rateLimit("invite-email:" + user.id, 100)))
            return fail(
              "Ліміт розсилки вичерпано. Спробуйте через 15 хвилин.",
              429,
            );
          const transport = invitationTransport(config);
          const results = await Promise.all(
            [...new Set(ids)].map(async (id) => {
              const now = new Date(),
                attemptId = randomBytes(16).toString("hex");
              const eligible = await db.studentInvite.updateMany({
                where: {
                  id,
                  classroomId: classroom.id,
                  claimedAt: null,
                  email: { not: null },
                  AND: [
                    {
                      OR: [
                        { emailAttemptAt: null },
                        {
                          emailAttemptAt: {
                            lt: new Date(now.getTime() - 60000),
                          },
                        },
                      ],
                    },
                    {
                      OR: [
                        {
                          emailStatus: {
                            in: resend
                              ? ["NOT_SENT", "FAILED", "SENT", "UNKNOWN"]
                              : ["NOT_SENT", "FAILED"],
                          },
                        },
                        ...(resend
                          ? [
                              {
                                emailStatus: "SENDING",
                                emailAttemptAt: {
                                  lt: new Date(now.getTime() - 120000),
                                },
                              },
                            ]
                          : []),
                      ],
                    },
                  ],
                },
                data: {
                  emailStatus: "SENDING",
                  emailAttemptId: attemptId,
                  emailAttemptAt: now,
                },
              });
              if (!eligible.count) return { id, status: "skipped" };
              const invite = await db.studentInvite.findUnique({
                where: { id },
              });
              if (!invite?.email) return { id, status: "skipped" };
              let status = "SENT";
              try {
                const result = await transport.sendMail({
                  from: { name: "ФізЛаб", address: config.from },
                  to: { name: invite.name, address: invite.email },
                  messageId: `<${attemptId}@${config.from.split("@")[1]}>`,
                  ...invitationMessage({
                    name: invite.name,
                    email: invite.email,
                    code: invite.code,
                    classroom: classroom.name,
                    teacher: user.name,
                    url: config.url,
                  }),
                });
                if (!result.accepted.length) status = "FAILED";
              } catch (error) {
                status = definiteMailFailure(error) ? "FAILED" : "UNKNOWN";
              }
              await db.studentInvite.updateMany({
                where: { id, emailAttemptId: attemptId },
                data: {
                  emailStatus: status,
                  ...(status === "SENT" ? { emailSentAt: new Date() } : {}),
                },
              });
              return {
                id,
                status:
                  status === "SENT"
                    ? "sent"
                    : status === "FAILED"
                      ? "failed"
                      : "uncertain",
              };
            }),
          );
          return json({ results });
        }
        return fail("Маршрут не знайдено.", 404);
      }
      if (path[3] === "codes" && path.length === 4 && method === "GET") {
        const invites = await db.studentInvite.findMany({
          where: { classroomId: classroom.id },
          orderBy: { name: "asc" },
        });
        const rows = [
          ["ПІБ", "Email", "Код приєднання", "Статус"],
          ...invites.map((i) => [
            i.name,
            i.email ?? "",
            i.claimedAt ? "" : i.code,
            i.claimedAt ? "Приєднався" : "Очікує приєднання",
          ]),
        ];
        return new NextResponse(
          "\uFEFF" +
            rows.map((row) => row.map(rosterCsvCell).join(";")).join("\r\n"),
          {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition":
                'attachment; filename="fizlab-student-codes.csv"',
              "Cache-Control": "no-store",
            },
          },
        );
      }
      if (path[3] === "invites" && path.length === 5 && method === "DELETE") {
        const removed = await db.studentInvite.deleteMany({
          where: {
            id: path[4],
            classroomId: classroom.id,
            claimedAt: null,
            OR: [
              { emailStatus: { not: "SENDING" } },
              { emailAttemptAt: { lt: new Date(Date.now() - 120000) } },
            ],
          },
        });
        if (!removed.count)
          return fail(
            "Запрошення вже використане, видалене або зараз надсилається. Оновіть список.",
            409,
          );
        return json({ ok: true });
      }
      if (path[3] === "import" && path.length === 4 && method === "POST") {
        const { csv, mode } = z
          .object({
            csv: z.string().max(131072),
            mode: z.enum(["preview", "commit"]),
          })
          .parse(await req.json());
        const parsed = parseRosterCsv(csv);
        if (parsed.errors.length)
          return json(
            {
              rows: parsed.rows,
              errors: parsed.errors,
              ignoredColumns: parsed.ignoredColumns,
            },
            mode === "preview" ? 200 : 422,
          );
        const loadPlan = async (client: Prisma.TransactionClient) => {
          const [invites, memberships] = await Promise.all([
            client.studentInvite.findMany({
              where: { classroomId: classroom.id },
              select: { key: true, name: true },
            }),
            client.membership.findMany({
              where: { classroomId: classroom.id },
              select: {
                user: { select: { name: true, email: true } },
                rosterName: true,
              },
            }),
          ]);
          return planRoster(
            parsed.rows,
            invites,
            memberships.map((m) => ({
              ...m.user,
              name: m.rosterName ?? m.user.name,
            })),
          );
        };
        if (mode === "preview")
          return json({
            rows: await loadPlan(db),
            errors: [],
            ignoredColumns: parsed.ignoredColumns,
          });
        if (!(await rateLimit("roster-import:" + user.id, 20)))
          return fail("Забагато імпортів. Спробуйте пізніше.", 429);
        const result = await db.$transaction(async (tx) => {
          // Serialize imports into one class, including mixed name-only/email lists.
          await tx.$queryRaw`SELECT "id" FROM "Classroom" WHERE "id" = ${classroom.id} FOR UPDATE`;
          const rows = await loadPlan(tx);
          const inserted = await tx.studentInvite.createMany({
            data: rows
              .filter((r) => r.action === "create")
              .map((r) => ({
                classroomId: classroom.id,
                name: r.name,
                email: r.email,
                key: r.key,
                code: "S" + randomBytes(8).toString("hex").toUpperCase(),
              })),
            skipDuplicates: true,
          });
          return {
            created: inserted.count,
            skipped: rows.length - inserted.count,
          };
        });
        return json(result, 201);
      }
      return fail("Маршрут не знайдено.", 404);
    }
    if (route === "me" && method === "GET") return json(user);
    if (route === "classes" && method === "POST") {
      if (user.role !== "TEACHER") return fail("Доступ лише для вчителя.", 403);
      const { name } = z
        .object({ name: z.string().trim().min(2).max(80) })
        .parse(await req.json());
      return json(
        await db.classroom.create({
          data: {
            name,
            teacherId: user.id,
            code: randomBytes(5).toString("hex").toUpperCase(),
          },
        }),
        201,
      );
    }
    if (route === "classes/join" && method === "POST") {
      if (user.role !== "STUDENT") return fail("Це дія для учня.", 403);
      if (!(await rateLimit("join:" + user.id, 20)))
        return fail("Забагато спроб.", 429);
      const { code } = z
        .object({
          code: z
            .string()
            .trim()
            .max(40)
            .transform((s) => s.replace(/[\s-]/g, "").toUpperCase()),
        })
        .parse(await req.json());
      const c = await db.classroom.findUnique({ where: { code } });
      if (!c) {
        const joined = await db.$transaction(async (tx) => {
          const invite = await tx.studentInvite.findUnique({ where: { code } });
          if (
            !invite ||
            (invite.email && invite.email !== user.email) ||
            (invite.claimedAt && invite.claimedById !== user.id)
          )
            return null;
          const alreadyClaimed = await tx.studentInvite.findUnique({
            where: {
              classroomId_claimedById: {
                classroomId: invite.classroomId,
                claimedById: user.id,
              },
            },
          });
          if (alreadyClaimed && alreadyClaimed.id !== invite.id) return null;
          if (!invite.claimedAt) {
            const changed = await tx.studentInvite.updateMany({
              where: { id: invite.id, claimedAt: null },
              data: { claimedById: user.id, claimedAt: new Date() },
            });
            if (!changed.count) {
              const latest = await tx.studentInvite.findUnique({
                where: { id: invite.id },
              });
              if (latest?.claimedById !== user.id) return null;
            }
          }
          await tx.membership.upsert({
            where: {
              classroomId_userId: {
                classroomId: invite.classroomId,
                userId: user.id,
              },
            },
            update: { rosterName: invite.name },
            create: {
              classroomId: invite.classroomId,
              userId: user.id,
              rosterName: invite.name,
            },
          });
          return invite.classroomId;
        });
        if (!joined)
          return fail(
            "Код недійсний, уже використаний або призначений іншому обліковому запису.",
            404,
          );
        return json({ ok: true, classroomId: joined });
      }
      await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "Classroom" WHERE "id" = ${c.id} FOR UPDATE`;
        const pending = await tx.studentInvite.findFirst({
          where: { classroomId: c.id, email: user.email, claimedAt: null },
        });
        const claimed = await tx.studentInvite.findUnique({
          where: {
            classroomId_claimedById: {
              classroomId: c.id,
              claimedById: user.id,
            },
          },
        });
        let rosterName: string | undefined;
        if (pending && !claimed) {
          const changed = await tx.studentInvite.updateMany({
            where: { id: pending.id, claimedAt: null },
            data: { claimedAt: new Date(), claimedById: user.id },
          });
          if (changed.count) rosterName = pending.name;
        }
        await tx.membership.upsert({
          where: { classroomId_userId: { classroomId: c.id, userId: user.id } },
          update: rosterName ? { rosterName } : {},
          create: { classroomId: c.id, userId: user.id, rosterName },
        });
      });
      return json({ ok: true, classroomId: c.id });
    }
    if (route === "assignments" && method === "POST") {
      if (user.role !== "TEACHER") return fail("Доступ лише для вчителя.", 403);
      const input = z
        .object({
          classroomId: z.string(),
          labVersionId: z.string(),
          dueAt: z.string().datetime().nullable(),
          feedbackMode: z.enum(["PRACTICE", "INDEPENDENT"]),
          experimentMode: z.enum(["REAL", "DATA", "SIMULATION"]),
        })
        .parse(await req.json());
      if (
        !(await db.classroom.findFirst({
          where: { id: input.classroomId, teacherId: user.id },
        }))
      )
        return fail("Клас не знайдено.", 404);
      if (
        !(await db.labVersion.findUnique({
          where: {
            id: input.labVersionId,
            OR: [{ authorId: null }, { authorId: user.id }],
          },
        }))
      )
        return fail("Шаблон не знайдено.", 404);
      return json(await db.assignment.create({ data: input }), 201);
    }
    if (
      path[0] === "assignments" &&
      path[1] &&
      path[2] === "mode" &&
      method === "PATCH"
    ) {
      if (user.role !== "TEACHER") return fail("Доступ лише для вчителя.", 403);
      const { experimentMode } = z
        .object({ experimentMode: z.enum(["REAL", "DATA", "SIMULATION"]) })
        .parse(await req.json());
      const assignment = await db.assignment.findFirst({
        where: { id: path[1], classroom: { teacherId: user.id } },
      });
      if (!assignment) return fail("Роботу не знайдено.", 404);
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${assignment.id}))`;
        const submissions = await tx.submission.findMany({
          where: { assignmentId: assignment.id },
          select: { status: true, answers: true },
        });
        if (
          submissions.some(
            (s) =>
              s.status !== "DRAFT" ||
              ((s.answers as Answers).simulationRecords?.length ?? 0) > 0,
          )
        )
          throw new Error("MODE_LOCKED");
        await tx.assignment.update({
          where: { id: assignment.id },
          data: { experimentMode },
        });
      });
      return json({ ok: true });
    }
    if (path[0] === "labs" && path[1] && method === "POST") {
      if (user.role !== "TEACHER") return fail("Доступ лише для вчителя.", 403);
      const original = await db.labVersion.findFirst({
        where: { id: path[1], OR: [{ authorId: null }, { authorId: user.id }] },
      });
      if (!original) return fail("Шаблон не знайдено.", 404);
      const v = z
        .object({
          title: z.string().trim().min(3).max(150),
          purpose: z.string().min(10).max(3000),
          theory: z.string().min(5).max(5000),
          questions: z.array(z.string().min(3).max(2000)).min(1).max(20),
          creative: z.string().max(5000),
        })
        .parse(await req.json());
      // Advisory transaction lock serializes new version numbers for this lab.
      const result = await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${original.number})`;
        const latest = await tx.labVersion.findFirst({
          where: { number: original.number },
          orderBy: { version: "desc" },
        });
        return tx.labVersion.create({
          data: {
            authorId: user.id,
            number: original.number,
            version: latest!.version + 1,
            title: v.title,
            content: {
              ...(original.content as object),
              purpose: v.purpose,
              theory: v.theory,
              questions: v.questions,
              creative: v.creative,
            },
          },
        });
      });
      return json(result, 201);
    }
    if (path[0] === "assignments" && path[1] && path[2] === "submission") {
      const assignment = await db.assignment.findUnique({
        where: { id: path[1] },
        include: {
          classroom: {
            include: { memberships: { where: { userId: user.id } } },
          },
          labVersion: true,
        },
      });
      if (
        !assignment ||
        user.role !== "STUDENT" ||
        !assignment.classroom.memberships.length
      )
        return fail("Роботу не знайдено.", 404);
      const key = { assignmentId: assignment.id, studentId: user.id };
      if (method === "GET")
        return json(
          await db.submission.findUnique({
            where: { assignmentId_studentId: key },
            include: {
              comments: { orderBy: { createdAt: "asc" } },
              attempts: { orderBy: { createdAt: "asc" } },
            },
          }),
        );
      if (method === "PUT") {
        const input = z
          .object({
            answers: answersSchema,
            revision: z.number().int().min(0),
            submit: z.boolean().default(false),
          })
          .parse(await req.json());
        const content = assignment.labVersion.content as unknown as LabContent;
        if (input.submit) {
          const missing = completeness(content, input.answers);
          if (missing.length)
            return json({ error: "Заповніть обов’язкові поля.", missing }, 422);
        }
        const records = input.answers.simulationRecords ?? [];
        const recordError = validateSimulationRecords(
          assignment.labVersion.number,
          content.experiments,
          records,
        );
        if (recordError) return fail(recordError, 422);
        const result = await db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${assignment.id}))`;
          const latestAssignment = await tx.assignment.findUniqueOrThrow({
            where: { id: assignment.id },
            select: { experimentMode: true },
          });
          if (
            records.length &&
            latestAssignment.experimentMode !== "SIMULATION"
          )
            throw new Error("SIMULATION_NOT_ALLOWED");
          if (
            input.submit &&
            latestAssignment.experimentMode === "DATA" &&
            !input.answers.source?.trim()
          )
            throw new Error("SOURCE_REQUIRED");
          if (
            input.submit &&
            latestAssignment.experimentMode === "SIMULATION" &&
            content.experiments.some((e) =>
              e.rows.some(
                (_, i) =>
                  !records.some(
                    (r) => r.experimentId === e.id && r.rowIndex === i,
                  ),
              ),
            )
          )
            throw new Error("SIMULATION_REQUIRED");
          const existing = await tx.submission.upsert({
            where: { assignmentId_studentId: key },
            update: {},
            create: { ...key },
          });
          const updated = await tx.submission.updateMany({
            where: {
              id: existing.id,
              revision: input.revision,
              status: { in: ["DRAFT", "RETURNED"] },
            },
            data: {
              answers: input.answers as Prisma.InputJsonValue,
              revision: { increment: 1 },
              ...(input.submit
                ? {
                    status: "SUBMITTED",
                    submittedAt: new Date(),
                    score: null,
                    rubric: Prisma.DbNull,
                    feedback: null,
                  }
                : {}),
            },
          });
          if (!updated.count) throw new Error("CONFLICT");
          if (input.submit)
            await tx.attempt.create({
              data: {
                submissionId: existing.id,
                revision: input.revision + 1,
                answers: input.answers as Prisma.InputJsonValue,
              },
            });
          return tx.submission.findUniqueOrThrow({
            where: { id: existing.id },
          });
        });
        return json(result);
      }
    }
    if (path[0] === "submissions" && path[1]) {
      const s = await db.submission.findUnique({
        where: { id: path[1] },
        include: {
          assignment: { include: { classroom: true, labVersion: true } },
        },
      });
      if (
        !s ||
        !(
          s.studentId === user.id ||
          (user.role === "TEACHER" &&
            s.assignment.classroom.teacherId === user.id)
        )
      )
        return fail("Роботу не знайдено.", 404);
      if (path[2] === "checks" && method === "GET") {
        if (
          user.role === "STUDENT" &&
          s.assignment.feedbackMode === "INDEPENDENT" &&
          s.status !== "GRADED" &&
          s.status !== "RETURNED"
        )
          return fail("Перевірка відкриється після оцінювання.", 403);
        return json(
          checkCalculations(
            s.assignment.labVersion.content as unknown as LabContent,
            s.answers as Answers,
          ),
        );
      }
      if (
        user.role !== "TEACHER" ||
        s.assignment.classroom.teacherId !== user.id
      )
        return fail("Доступ лише для вчителя.", 403);
      if (path[2] === "review" && method === "POST") {
        const input = z
          .object({
            action: z.enum(["grade", "return"]),
            revision: z.number().int(),
            rubric: z.array(z.number().int().min(0).max(3)).length(4),
            feedback: z.string().max(10000),
          })
          .parse(await req.json());
        if (
          input.action === "grade" &&
          input.rubric.reduce((a, b) => a + b, 0) < 1
        )
          return fail("Оцінка за 12-бальною шкалою має бути від 1 до 12.");
        if (input.action === "return" && !input.feedback.trim())
          return fail("Поясніть, що потрібно доопрацювати.");
        await db.$transaction(async (tx) => {
          const update = await tx.submission.updateMany({
            where: {
              id: s.id,
              revision: input.revision,
              status: { in: ["SUBMITTED", "GRADED"] },
            },
            data: {
              status: input.action === "grade" ? "GRADED" : "RETURNED",
              score:
                input.action === "grade"
                  ? input.rubric.reduce((a, b) => a + b, 0)
                  : null,
              rubric: input.rubric,
              feedback: input.feedback,
              revision: { increment: 1 },
            },
          });
          if (!update.count) throw new Error("CONFLICT");
          const attempt = await tx.attempt.findFirst({
            where: { submissionId: s.id },
            orderBy: { createdAt: "desc" },
          });
          if (attempt)
            await tx.attempt.update({
              where: { id: attempt.id },
              data: {
                score:
                  input.action === "grade"
                    ? input.rubric.reduce((a, b) => a + b, 0)
                    : null,
                feedback: input.feedback,
              },
            });
        });
        return json({ ok: true });
      }
      if (path[2] === "comments" && method === "POST") {
        const input = z
          .object({
            field: z.string().min(1).max(100),
            body: z.string().trim().min(1).max(3000),
          })
          .parse(await req.json());
        return json(
          await db.comment.create({
            data: { submissionId: s.id, authorId: user.id, ...input },
          }),
          201,
        );
      }
    }
    if (route === "export" && method === "GET") {
      if (user.role !== "TEACHER") return fail("Доступ лише для вчителя.", 403);
      const rows = await db.submission.findMany({
        where: { assignment: { classroom: { teacherId: user.id } } },
        include: {
          student: true,
          assignment: { include: { classroom: true, labVersion: true } },
        },
      });
      const rosterNames = await teacherRosterNames(user.id);
      const cell = (v: unknown) =>
        '"' +
        String(v ?? "")
          .replace(/^[=+@\-\t\r]/, "'")
          .replace(/"/g, '""') +
        '"';
      const csv =
        "\uFEFF" +
        [
          ["Клас", "Учень", "Робота", "Статус", "Оцінка", "Здано"],
          ...rows.map((s) => [
            s.assignment.classroom.name,
            rosterNames.get(`${s.assignment.classroomId}:${s.studentId}`) ??
              s.student.name,
            s.assignment.labVersion.number,
            s.status,
            s.score,
            s.submittedAt?.toISOString(),
          ]),
        ]
          .map((r) => r.map(cell).join(";"))
          .join("\r\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="fizlab-grades.csv"',
          "Cache-Control": "no-store",
        },
      });
    }
    return fail("Маршрут не знайдено.", 404);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "MODE_LOCKED")
        return fail(
          "Режим уже зафіксовано: є здані роботи або перенесені віртуальні покази.",
          409,
        );
      if (err.message === "SIMULATION_NOT_ALLOWED")
        return fail(
          "Учитель не призначив цю роботу як віртуальний експеримент.",
          422,
        );
      if (err.message === "SIMULATION_REQUIRED")
        return fail(
          "Для кожного рядка проведіть віртуальний дослід і перенесіть покази приладів.",
          422,
        );
      if (err.message === "SOURCE_REQUIRED")
        return fail("Вкажіть джерело наданих даних.", 422);
    }
    if (err instanceof z.ZodError)
      return fail(
        "Перевірте введені дані: " +
          err.issues.map((x) => x.path.join(".") + ": " + x.message).join(";"),
      );
    if (err instanceof SyntaxError) return fail("Некоректний формат запиту.");
    if (err instanceof Error && err.message === "CONFLICT")
      return fail(
        "Дані змінилися на іншому пристрої або роботу вже здано. Завантажте серверну версію.",
        409,
      );
    if (err instanceof Error && err.message === "ACCOUNT_DISABLED")
      return fail("Неправильна пошта або пароль.", 401);
    if (err instanceof Error && err.message === "INVALID_INVITE")
      return fail(
        "Запрошення недійсне, прострочене, вже використане або видане на іншу пошту. Перевірте код і адресу запрошення.",
      );
    if (err instanceof Error && err.message === "TEACHER_INVITE_REQUIRED")
      return fail(
        "Для цієї адреси є запрошення вчителя. Оберіть «Учитель» і введіть код від адміністратора.",
      );
    if (err instanceof Error && err.message === "INVALID_STUDENT_INVITE")
      return fail(
        "Код учня недійсний, уже використаний або виданий на іншу пошту. Використайте особистий код від учителя; код адміністратора для цієї ролі не підходить.",
      );
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    )
      return fail("Такий запис уже існує.", 409);
    console.error("API failure", err instanceof Error ? err.name : "unknown");
    return fail("Не вдалося виконати запит. Спробуйте знову.", 500);
  }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
