import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL contourne le pooler pour les migrations (requis par Neon/Supabase).
    url: process.env.DIRECT_URL ?? env("DATABASE_URL"),
  },
});
