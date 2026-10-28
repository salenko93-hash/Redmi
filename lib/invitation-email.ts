import nodemailer from "nodemailer";
import { isIP } from "node:net";
import { z } from "zod";

type Environment = Record<string, string | undefined>;
export function invitationMailConfig(env: Environment = process.env) {
  const host = env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(env.SMTP_PORT || 465);
  const secure = (env.SMTP_SECURE || "true") === "true";
  const user = env.SMTP_USER?.trim() || "";
  const pass = env.SMTP_PASSWORD || "";
  const from = env.SMTP_FROM?.trim() || user;
  if (
    !z.email().safeParse(user).success ||
    !z.email().safeParse(from).success ||
    !pass ||
    /[\r\n]/.test(host) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !["true", "false"].includes(env.SMTP_SECURE || "true")
  )
    return null;
  try {
    const url = new URL(env.PUBLIC_APP_URL || env.APP_URL || "");
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      isIP(url.hostname) ||
      !url.hostname.includes(".") ||
      /\.(localhost|local|internal)$/.test(url.hostname)
    )
      return null;
    return { host, port, secure, user, pass, from, url: url.origin };
  } catch {
    return null;
  }
}
export function invitationMessage(input: {
  name: string;
  classroom: string;
  teacher: string;
  code: string;
  email: string;
  url: string;
}) {
  const clean = (s: string) => s.replace(/[\r\n]+/g, " ");
  const name = clean(input.name),
    classroom = clean(input.classroom),
    teacher = clean(input.teacher);
  const subject = `ФізЛаб: запрошення до класу «${classroom}»`;
  const text = `Вітаємо, ${name}!\n\n${teacher} запрошує вас до класу «${classroom}» у ФізЛаб.\n\nВаш особистий код: ${input.code}\nСайт: ${input.url}\n\n1. Відкрийте сайт. Якщо ще немає акаунту, натисніть «Зареєструватися», оберіть «Учень / учениця», укажіть адресу ${input.email}, власний пароль та особистий код із цього листа. Ви одразу приєднаєтеся до класу.\n2. Якщо акаунт уже є, увійдіть із адресою ${input.email}, відкрийте «Мій клас», введіть код та натисніть «Приєднатися».\n\nЦей код призначений для учня і не дає прав учителя. Це не пароль облікового запису. Не передавайте його іншим.\nЯкщо ви вже приєдналися, повторно вводити код не потрібно.\n\nЦей лист надіслано за запрошенням учителя. Якщо запрошення помилкове, проігноруйте його.\n`;
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const html = `<div lang="uk" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#244b3b"><h1>Запрошення до ФізЛаб</h1><p>Вітаємо, ${escape(name)}!</p><p>${escape(teacher)} запрошує вас до класу <strong>${escape(classroom)}</strong>.</p><p>Ваш особистий код:</p><p style="font-size:24px;letter-spacing:2px;font-weight:bold;padding:20px;background:#eef4e6;border-radius:12px">${escape(input.code)}</p><p><a href="${escape(input.url)}" style="display:inline-block;padding:14px 22px;background:#285540;color:#fff;border-radius:8px;text-decoration:none">Відкрити ФізЛаб</a></p><p>Для нового акаунту натисніть «Зареєструватися», оберіть «Учень / учениця», укажіть адресу <strong>${escape(input.email)}</strong>, власний пароль і особистий код із цього листа. Ви одразу приєднаєтеся до класу.</p><p>Якщо акаунт уже є, увійдіть із цією адресою, відкрийте «Мій клас», введіть код та натисніть «Приєднатися». Цей код не дає прав учителя.</p><p>Це код приєднання, а не пароль. Якщо ви вже у класі, повторно вводити його не потрібно.</p><p style="font-size:12px;color:#657368">Лист надіслано за запрошенням учителя. Якщо запрошення помилкове, проігноруйте його.</p></div>`;
  return { subject, text, html };
}
export function invitationTransport(
  config: NonNullable<ReturnType<typeof invitationMailConfig>>,
) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}
// ECONNECTION can also mean the server accepted DATA but its acknowledgement was lost.
export function definiteMailFailure(error: unknown) {
  const e = error as { responseCode?: number; code?: string } | null;
  return Boolean(
    e &&
    ((e.responseCode && e.responseCode >= 400) ||
      ["EAUTH", "EENVELOPE", "EDNS"].includes(e.code || "")),
  );
}
