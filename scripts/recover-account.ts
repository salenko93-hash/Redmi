import "dotenv/config";
import { hash } from "bcryptjs";
import { readNewPassword } from "../lib/password-prompt";
import { randomBytes, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";
import { databaseConfig } from "../lib/postgres";
const position = process.argv.indexOf("--email");
const email = z
  .email()
  .safeParse(
    position >= 0 ? process.argv[position + 1]?.trim().toLowerCase() : "",
  );
if (!email.success) {
  console.error(
    "Використання: npm run account:recover -- --email user@school.example",
  );
  process.exit(1);
}
const db = new PrismaClient({ adapter: new PrismaPg(databaseConfig()) });
const code = randomBytes(32).toString("hex");
try {
  const setPassword = process.argv.includes("--set-password");
  if (process.argv.includes("--password-stdin") && !setPassword)
    throw new Error("PASSWORD_STDIN_FLAG");
  const passwordHash = setPassword
    ? await hash(
        await readNewPassword(process.argv.includes("--password-stdin")),
        12,
      )
    : undefined;
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "email" = ${email.data} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { email: email.data } });
    if (!user) throw new Error("ACCOUNT_NOT_FOUND");
    if (!user.isActive) throw new Error("ACCOUNT_DISABLED");
    await tx.user.update({
      where: { id: user.id },
      data: {
        recoveryHash: createHash("sha256").update(code).digest("hex"),
        ...(passwordHash ? { passwordHash } : {}),
      },
    });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.adminAudit.create({
      data: {
        actorId: null,
        targetId: user.id,
        action: setPassword
          ? "PASSWORD_RESET_BY_OPERATOR"
          : "RECOVERY_CODE_REISSUED",
        detail: { email: email.data },
      },
    });
  });
  if (setPassword)
    console.log(
      "Пароль оновлено. Увійдіть зі своєю поштою та новим паролем. Права й роботи збережено.",
    );
  console.log("Новий особистий код відновлення (показується лише зараз):");
  console.log(code);
  console.log(
    setPassword
      ? "Збережіть цей резервний код. Старий код і попередні сеанси скасовано. Пароль і код не надсилайте в чат."
      : "На сторінці входу виберіть «Забули пароль?», введіть пошту, цей код і новий пароль (від 10 символів). Старий резервний код і попередні сеанси скасовано. Після відновлення збережіть новий код, який покаже сайт. Не надсилайте коди в чат.",
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "";
  const passwordErrors: Record<string, string> = {
    PASSWORD_LENGTH:
      "Потрібен пароль від 10 до 128 символів, без перенесень рядка. Змін не внесено.",
    PASSWORD_MISMATCH: "Паролі не збігаються. Змін не внесено.",
    PASSWORD_TERMINAL: "Запустіть команду в інтерактивному вікні PowerShell.",
    PASSWORD_CANCELLED: "Операцію скасовано. Змін не внесено.",
    PASSWORD_STDIN_FLAG: "Параметр --password-stdin потребує --set-password.",
  };
  console.error(
    passwordErrors[message] ??
      (message === "ACCOUNT_NOT_FOUND"
        ? "Облікового запису з цією адресою немає. Команда не створює нового користувача."
        : message === "ACCOUNT_DISABLED"
          ? "Доступ до облікового запису призупинено. Відновіть його через адміністратора; ця команда не знімає блокування."
          : "Не вдалося відновити доступ. Перевірте доступність бази даних і налаштування .env."),
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
