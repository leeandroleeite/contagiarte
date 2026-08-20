import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import * as relations from "./relations";

/**
 * A base de dados é um ficheiro.
 *
 * Vive em `INNA_DATA_DIR`-style: `DADOS_DIR`, que em produção é o volume
 * montado na máquina e localmente é `./var`. O Litestream vai atrás do
 * WAL e replica cada escrita para o R2, o que dá um segundo de perda no
 * pior caso em vez de um dia.
 *
 * A ligação abre-se na primeira consulta e não ao importar o módulo: o
 * Next importa isto durante a compilação, onde não há dados nenhuns.
 */

const todo = { ...schema, ...relations };
type Base = ReturnType<typeof drizzle<typeof todo>>;

const global_ = globalThis as unknown as {
  __contagiarte_sqlite?: Database.Database;
  __contagiarte_db?: Base;
};

/** Onde o ficheiro da base vive. */
export function caminhoDaBase(): string {
  const dir = process.env.DADOS_DIR ?? "var";
  return path.join(dir, "contagiarte.db");
}

function ligacao(): Database.Database {
  if (global_.__contagiarte_sqlite) return global_.__contagiarte_sqlite;

  const ficheiro = caminhoDaBase();
  mkdirSync(path.dirname(ficheiro), { recursive: true });

  const cliente = new Database(ficheiro);
  // WAL é o que o Litestream segue, e também o que deixa ler enquanto
  // se escreve. NORMAL basta com WAL: o checkpoint garante a durabilidade
  // e poupa um fsync por transacção.
  cliente.pragma("journal_mode = WAL");
  cliente.pragma("synchronous = NORMAL");
  cliente.pragma("foreign_keys = ON");
  // Sem isto, duas escritas ao mesmo tempo dão SQLITE_BUSY em vez de
  // esperarem pela vez delas.
  cliente.pragma("busy_timeout = 5000");

  global_.__contagiarte_sqlite = cliente;
  return cliente;
}

function base(): Base {
  global_.__contagiarte_db ??= drizzle(ligacao(), { schema: todo });
  return global_.__contagiarte_db;
}

/**
 * `db` e `sql` continuam a parecer objectos normais a quem os usa: os
 * proxies só existem para adiar a abertura do ficheiro até ser preciso.
 */
export const db: Base = new Proxy({} as Base, {
  get: (_, chave) => Reflect.get(base(), chave, base()),
  has: (_, chave) => Reflect.has(base(), chave),
});

/**
 * Fecha o ficheiro. Os scripts chamam isto no fim; a aplicação não,
 * porque o processo dela só termina com a máquina.
 */
export function fecharBase() {
  global_.__contagiarte_sqlite?.close();
  global_.__contagiarte_sqlite = undefined;
  global_.__contagiarte_db = undefined;
}

export * from "./schema";
