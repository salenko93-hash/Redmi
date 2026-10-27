import "dotenv/config";
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
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "email" = ${email.data} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { email: email.data } });
    if (!user) throw new Error("ACCOUNT_NOT_FOUND");
    if (!user.isActive) throw new Error("ACCOUNT_DISABLED");
    await tx.user.update({
      where: { id: user.id },
      data: { recoveryHash: createHash("sha256").update(code).digest("hex") },
    });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.adminAudit.create({
      data: {
        actorId: null,
        targetId: user.id,
        action: "RECOVERY_CODE_REISSUED",
        detail: { email: email.data },
      },
    });
  });
  console.log("Новий особистий код відновлення (показується лише зараз):");
  console.log(code);
  console.log(
    "На сторінці входу виберіть «Забули пароль?», введіть пошту, цей код і новий пароль (від 10 символів). Старий резервний код і попередні сеанси скасовано. Після відновлення збережіть новий код, який покаже сайт. Не надсилайте коди в чат.",
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "";
  console.error(
    message === "ACCOUNT_NOT_FOUND"
      ? "Облікового запису з цією адресою немає. Команда не створює нового користувача."
      : message === "ACCOUNT_DISABLED"
        ? "Доступ до облікового запису призупинено. Відновіть його через адміністратора; ця команда не знімає блокування."
        : "Не вдалося оновити код. Перевірте доступність бази даних і налаштування .env.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
