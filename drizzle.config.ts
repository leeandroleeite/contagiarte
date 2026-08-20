import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: process.env.DATABASE_URL ?? "file:./var/contagiarte.db" },
  casing: "snake_case",
  verbose: true,
  strict: true,
} satisfies Config;
