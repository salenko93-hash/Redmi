import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, rateLimit } from "@/lib/auth";
import {
  adminOverview,
  createTeacherInvitation,
  revokeTeacherInvitation,
  setTeacherAccess,
  promoteStudentToTeacher,
  removeTeacher,
  AdminActionError,
} from "@/lib/admin";
import {
  invitationMailConfig,
  invitationTransport,
} from "@/lib/invitation-email";
import { db } from "@/lib/db";
const json = (value: unknown, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ action: string[] }> },
) {
  try {
    if (req.method !== "GET") {
      if (
        req.headers.get("origin") !==
        new URL(process.env.APP_URL ?? req.url).origin
      )
        return json({ error: "Недозволене джерело запиту." }, 403);
      if (Number(req.headers.get("content-length") ?? 0) > 10000)
        return json({ error: "Завеликий запит." }, 413);
    }
    const user = await currentUser();
    if (!user) return json({ error: "Увійдіть у свій обліковий запис." }, 401);
    if (!user.isAdmin || user.role !== "TEACHER")
      return json({ error: "Доступ лише для адміністратора." }, 403);
    const path = (await ctx.params).action,
      route = path.join("/");
    if (route === "overview" && req.method === "GET")
      return json(await adminOverview());
    if (route === "teachers/promote" && req.method === "POST") {
      const { id, email } = z
        .object({
          id: z.string().min(1).max(100),
          email: z
            .string()
            .trim()
            .email()
            .max(254)
            .transform((s) => s.toLowerCase()),
          confirmed: z.literal(true),
        })
        .parse(await req.json());
      if (!(await rateLimit("admin-promote:" + user.id, 20)))
        return json(
          { error: "Забагато змін. Спробуйте через 15 хвилин." },
          429,
        );
      return json(await promoteStudentToTeacher(user.id, id, email));
    }
    if (route === "invites" && req.method === "POST") {
      const { email } = z
        .object({
          email: z
            .email()
            .max(254)
            .transform((s) => s.toLowerCase()),
        })
        .parse(await req.json());
      if (!(await rateLimit("admin-invite:" + user.id, 20)))
        return json(
          { error: "Забагато запрошень. Спробуйте через 15 хвилин." },
          429,
        );
      return json(await createTeacherInvitation(user.id, email), 201);
    }
    if (path[0] === "invites" && path.length === 2 && req.method === "DELETE") {
      await revokeTeacherInvitation(user.id, path[1]);
      return json({ ok: true });
    }
    if (path[0] === "teachers" && path.length === 2 && req.method === "PATCH") {
      const { active } = z
        .object({ active: z.boolean() })
        .parse(await req.json());
      await setTeacherAccess(user.id, path[1], active);
      return json({ ok: true });
    }
    if (
      path[0] === "teachers" &&
      path.length === 2 &&
      req.method === "DELETE"
    ) {
      z.object({ confirmed: z.literal(true) }).parse(await req.json());
      await removeTeacher(user.id, path[1]);
      return json({ ok: true });
    }
    if (route === "mail/check" && req.method === "POST") {
      const config = invitationMailConfig();
      if (!config)
        return json(
          {
            error:
              "Потрібно налаштувати пошту та публічну HTTPS-адресу сайту за інструкцією адміністратора.",
          },
          503,
        );
      if (!(await rateLimit("admin-mail-check:" + user.id, 5)))
        return json(
          { error: "Забагато перевірок. Спробуйте через 15 хвилин." },
          429,
        );
      let ok = false;
      try {
        ok = await invitationTransport(config).verify();
      } catch {
        /* Do not expose SMTP credentials or raw server responses. */
      }
      await db.adminAudit.create({
        data: {
          actorId: user.id,
          action: ok ? "MAIL_CHECK_OK" : "MAIL_CHECK_FAILED",
          detail: {},
        },
      });
      return ok
        ? json({
            ok: true,
            message: "Підключення до пошти перевірено. Листів не надсилали.",
          })
        : json(
            {
              error:
                "Не вдалося підключитися до пошти. Перевірте налаштування та доступність поштового сервера.",
            },
            502,
          );
    }
    return json({ error: "Маршрут не знайдено." }, 404);
  } catch (error) {
    if (error instanceof AdminActionError)
      return json(
        {
          error: error.message,
          ...(error.existingStudent
            ? { existingStudent: error.existingStudent }
            : {}),
        },
        error.status,
      );
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return json({ error: "Перевірте введені дані." }, 400);
    console.error(
      "Admin API failure",
      error instanceof Error ? error.name : "unknown",
    );
    return json(
      {
        error: "Не вдалося виконати дію. Оновіть сторінку та спробуйте знову.",
      },
      500,
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
