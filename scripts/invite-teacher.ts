import { databaseConfig } from "../lib/postgres";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";
const db = new PrismaClient({
  adapter: new PrismaPg(databaseConfig()),
});
const token = randomBytes(24).toString("hex");
await db.teacherInvite.create({
  data: {
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 86400000),
  },
});
console.log("Одноразове запрошення вчителя (діє 24 години): " + token);
await db.$disconnect();
