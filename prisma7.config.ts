import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI (migrate, studio, generate) needs a *direct* connection to
// Postgres, not the pooled/pgbouncer one — Supabase's transaction pooler
// doesn't support the prepared statements Migrate relies on. The app's
// runtime PrismaClient (lib/prisma.ts) uses the pooled DATABASE_URL instead.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
