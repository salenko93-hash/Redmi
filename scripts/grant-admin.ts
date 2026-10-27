import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";
import { databaseConfig } from "../lib/postgres";
const position = process.argv.indexOf("--email"),
  email = z
    .email()
    .safeParse(
      position >= 0 ? process.argv[position + 1]?.trim().toLowerCase() : "",
    );
if (!email.success) {
  console.error(
    "Використання: npm run admin:grant -- --email teacher@school.example",
  );
  process.exit(1);
}
const db = new PrismaClient({ adapter: new PrismaPg(databaseConfig()) });
try {
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email: email.data } });
    if (!user || user.role !== "TEACHER" || !user.isActive)
      throw new Error(
        "Потрібен наявний активний обліковий запис учителя з цією адресою.",
      );
    if (user.isAdmin) {
      console.log("Цей учитель уже має доступ адміністратора.");
      return;
    }
    await tx.user.update({ where: { id: user.id }, data: { isAdmin: true } });
    await tx.adminAudit.create({
      data: {
        actorId: null,
        targetId: user.id,
        action: "ADMIN_GRANTED",
        detail: { email: email.data },
      },
    });
    console.log(
      "Доступ адміністратора надано. Відкрийте розділ «Адміністрування» після оновлення сторінки.",
    );
  });
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Не вдалося надати доступ.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
