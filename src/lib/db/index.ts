import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL em falta. Copie .env.example para .env.local e preencha.",
  );
}

// Em dev o Next recarrega o módulo a cada alteração; sem este cache
// abríamos uma pool nova de cada vez até esgotar as ligações.
const global_ = globalThis as unknown as {
  __contagiarte_sql?: ReturnType<typeof postgres>;
};

const sql =
  global_.__contagiarte_sql ??
  postgres(url, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    // A Fly termina TLS no proxy interno; fora dela seguimos o que o URL diz.
    ssl: url.includes("sslmode=require") ? "require" : undefined,
  });

if (process.env.NODE_ENV !== "production") global_.__contagiarte_sql = sql;

export const db = drizzle(sql, { schema: { ...schema, ...relations } });
export { sql };
export * from "./schema";
