/**
 * Aplica as migrações pendentes. É este o comando que a Fly corre em
 * cada deploy (release_command), antes de a versão nova receber tráfego.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL em falta.");
  process.exit(1);
}

// Uma ligação só, sem pool: o processo morre a seguir.
const sql = postgres(url, { max: 1 });

try {
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  console.log("Migrações aplicadas.");
  await sql.end();
  process.exit(0);
} catch (erro) {
  console.error("Falhou a migração:", erro);
  await sql.end({ timeout: 5 });
  process.exit(1);
}
