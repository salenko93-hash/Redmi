import { databaseConfig } from "../lib/postgres";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { labs } from "../lib/labs";
import { inquiryContent } from "../lib/ramp-inquiry";
import { revisedContent } from "../lib/methodology-content";
const db = new PrismaClient({
  adapter: new PrismaPg(databaseConfig()),
});
async function main() {
  for (const lab of labs)
    await db.labVersion.upsert({
      where: { number_version: { number: lab.number, version: 1 } },
      update: {},
      create: {
        number: lab.number,
        version: 1,
        title: lab.title,
        content: JSON.parse(JSON.stringify(lab.content)),
      },
    });
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${1})`;
    const existing = await tx.labVersion.findFirst({
      where: {
        number: 1,
        authorId: null,
        content: { path: ["inquiry"], equals: "ramp-v1" },
      },
    });
    if (!existing) {
      const latest = await tx.labVersion.findFirst({
        where: { number: 1 },
        orderBy: { version: "desc" },
      });
      await tx.labVersion.create({
        data: {
          number: 1,
          version: (latest?.version ?? 1) + 1,
          title: "Середня швидкість руху · дослідження з доказами",
          content: JSON.parse(JSON.stringify(inquiryContent(labs[0].content))),
        },
      });
    }
  });
  for (const number of [1, 9, 10]) {
    const lab = labs.find((l) => l.number === number)!;
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${number})`;
      const existing = await tx.labVersion.findFirst({
        where: {
          number,
          authorId: null,
          content: { path: ["methodology", "version"], equals: "2026-11" },
        },
      });
      if (existing) return;
      const latest = await tx.labVersion.findFirst({
        where: { number },
        orderBy: { version: "desc" },
      });
      await tx.labVersion.create({
        data: {
          number,
          version: (latest?.version ?? 1) + 1,
          title:
            number === 1
              ? "Середня швидкість руху · дослідження з доказами"
              : lab.title,
          content: JSON.parse(JSON.stringify(revisedContent(lab))),
        },
      });
    });
  }
  if (process.argv.includes("--demo")) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Demo seed is forbidden in production");
    const passwordHash = await hash("LabDemo2026!", 12);
    const teacher = await db.user.upsert({
      where: { email: "teacher@demo.test" },
      update: {},
      create: {
        email: "teacher@demo.test",
        name: "Олена Коваленко",
        passwordHash,
        role: "TEACHER",
      },
    });
    const student = await db.user.upsert({
      where: { email: "student@demo.test" },
      update: {},
      create: {
        email: "student@demo.test",
        name: "Андрій Мельник",
        passwordHash,
        role: "STUDENT",
      },
    });
    const classroom = await db.classroom.upsert({
      where: { code: "FIZ7A2026" },
      update: {},
      create: {
        code: "FIZ7A2026",
        name: "7-А · Фізика",
        teacherId: teacher.id,
      },
    });
    await db.membership.upsert({
      where: {
        classroomId_userId: { classroomId: classroom.id, userId: student.id },
      },
      update: {},
      create: { classroomId: classroom.id, userId: student.id },
    });
    for (const lab of await db.labVersion.findMany({ where: { version: 1 } }))
      await db.assignment.upsert({
        where: {
          classroomId_labVersionId: {
            classroomId: classroom.id,
            labVersionId: lab.id,
          },
        },
        update: {},
        create: { classroomId: classroom.id, labVersionId: lab.id },
      });
    console.log(
      "Демонстраційний клас створено. Облікові записи описано в README.",
    );
  }
  console.log(
    "10 базових шаблонів і нові методичні версії №1, №9, №10 готові. Попередні роботи збережено.",
  );
}
main().finally(() => db.$disconnect());
