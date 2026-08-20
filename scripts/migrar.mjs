/**
 * Aplica as migrações pendentes.
 *
 * É este o comando que o entrypoint corre no arranque, depois de o
 * Litestream ter restaurado a base se ela não existir. Se falhar, o
 * contentor não abre e a versão anterior continua no ar.
 *
 * Escrito em JavaScript simples de propósito, para correr dentro da
 * imagem de produção sem precisar de TypeScript nem do drizzle-kit.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const ficheiro = path.join(process.env.DADOS_DIR ?? "var", "contagiarte.db");
mkdirSync(path.dirname(ficheiro), { recursive: true });

const cliente = new Database(ficheiro);
cliente.pragma("journal_mode = WAL");
cliente.pragma("foreign_keys = ON");

try {
  migrate(drizzle(cliente), { migrationsFolder: "./drizzle" });
  console.log(`Migrações aplicadas a ${ficheiro}.`);
  cliente.close();
  process.exit(0);
} catch (erro) {
  console.error("Falhou a migração:", erro);
  cliente.close();
  process.exit(1);
}
