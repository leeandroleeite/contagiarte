import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

/**
 * A ligação abre-se na primeira consulta, não ao importar o módulo.
 *
 * Parece um pormenor e não é: o Next importa este módulo durante a
 * compilação, e num contentor a compilar não há base de dados nenhuma.
 * Com a ligação a abrir no topo do ficheiro, a imagem de produção nem
 * chegava a construir-se.
 */

const todo = { ...schema, ...relations };
type Base = ReturnType<typeof drizzle<typeof todo>>;
type Cliente = ReturnType<typeof postgres>;

// Em dev o Next recarrega o módulo a cada alteração; sem este cache
// abríamos uma pool nova de cada vez até esgotar as ligações.
const global_ = globalThis as unknown as {
  __contagiarte_sql?: Cliente;
  __contagiarte_db?: Base;
};

function ligacao(): Cliente {
  if (global_.__contagiarte_sql) return global_.__contagiarte_sql;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL em falta. Copie .env.example para .env.local e preencha.",
    );
  }

  const cliente = postgres(url, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    // A Fly termina TLS no proxy interno; fora dela seguimos o que o URL diz.
    ssl: url.includes("sslmode=require") ? "require" : undefined,
  });

  global_.__contagiarte_sql = cliente;
  return cliente;
}

function base(): Base {
  global_.__contagiarte_db ??= drizzle(ligacao(), { schema: todo });
  return global_.__contagiarte_db;
}

/**
 * `db` e `sql` continuam a parecer objectos normais a quem os usa: os
 * proxies só existem para adiar a ligação até ao primeiro acesso.
 */
export const db: Base = new Proxy({} as Base, {
  get: (_, chave) => Reflect.get(base(), chave, base()),
  has: (_, chave) => Reflect.has(base(), chave),
});

export const sql: Cliente = new Proxy(function () {} as unknown as Cliente, {
  apply: (_, esse, argumentos) =>
    Reflect.apply(ligacao(), esse, argumentos as unknown[]),
  get: (_, chave) => Reflect.get(ligacao(), chave, ligacao()),
  has: (_, chave) => Reflect.has(ligacao(), chave),
});

export * from "./schema";
