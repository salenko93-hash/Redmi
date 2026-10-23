import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
// Generation needs a syntactically valid URL even when no database is present at build time.
// Runtime connections use DATABASE_URL directly in lib/db.ts; this URL is never a deployed database.
process.env.DATABASE_URL ??= "postgresql://localhost:5432/fizlab_build_only";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  experimental: { adapter: true },
  engine: "js",
  adapter: async () =>
    new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
