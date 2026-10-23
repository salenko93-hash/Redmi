import { databaseConfig } from "./postgres";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export const db =
  globalDb.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(databaseConfig()),
  });
if (process.env.NODE_ENV !== "production") globalDb.prisma = db;
