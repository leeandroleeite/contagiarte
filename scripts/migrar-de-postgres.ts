/**
 * Passa o conteúdo do Postgres para o ficheiro SQLite.
 *
 * Corre uma vez, na migração de 2026. Fica no repositório porque a
 * mesma operação é precisa em staging e em produção, e porque uma
 * migração que não se pode repetir não se pode verificar.
 *
 *   npx tsx scripts/migrar-de-postgres.ts <url-do-postgres>
 *
 * Compara as contagens no fim: se alguma tabela não bater certo, sai
 * com erro em vez de dizer que correu bem.
 */
import postgres from "postgres";
import { db, fecharBase } from "../src/lib/db";

/** Ordem de inserção: as tabelas apontadas entram antes das que apontam. */
const ORDEM = [
  "utilizadores", "media", "artistas", "lugares", "exposicoes",
  "exposicoes_artistas", "obras", "obras_media", "salas", "salas_obras",
  "molduras", "descarregaveis", "textos", "definicoes", "pedidos",
  "subscritores", "registo",
] as const;

/** Colunas que são datas e têm de virar Date para o SQLite as guardar. */
const DATAS = new Set([
  "criado_em", "actualizado_em", "ultimo_acesso", "expira_em", "confirmado_em",
]);

/** Colunas JSON, que no Postgres já vêm como objecto. */
function normalizar(linha: Record<string, unknown>) {
  const saida: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(linha)) {
    if (valor === null || valor === undefined) {
      saida[chave] = null;
    } else if (valor instanceof Date) {
      // Dois tipos de data no Postgres: `timestamp`, que aqui vira
      // segundos, e `date`, que continua a ser uma string AAAA-MM-DD.
      // O driver devolve ambos como Date; a diferença está na coluna.
      saida[chave] = DATAS.has(chave)
        ? Math.floor(valor.getTime() / 1000)
        : valor.toISOString().slice(0, 10);
    } else if (typeof valor === "boolean") {
      saida[chave] = valor ? 1 : 0;
    } else if (typeof valor === "object") {
      saida[chave] = JSON.stringify(valor);
    } else {
      saida[chave] = valor;
    }
  }
  return saida;
}

async function principal() {
  const url = process.argv[2];
  if (!url) {
    console.error("Falta o URL do Postgres.");
    process.exit(1);
  }

  const pg = postgres(url, { max: 1 });
  const contagens: Array<[string, number, number]> = [];

  try {
    for (const tabela of ORDEM) {
      const linhas = await pg`select * from ${pg(tabela)}`;
      if (linhas.length > 0) {
        const preparadas = linhas.map((l) => normalizar(l as Record<string, unknown>));
        const colunas = Object.keys(preparadas[0]);
        const marcas = colunas.map(() => "?").join(", ");
        const insercao = (db as unknown as {
          $client: { prepare: (s: string) => { run: (...a: unknown[]) => void } };
        }).$client.prepare(
          `insert into "${tabela}" (${colunas.map((c) => `"${c}"`).join(", ")}) values (${marcas})`,
        );
        for (const linha of preparadas) {
          insercao.run(...colunas.map((c) => linha[c] as never));
        }
      }

      const [{ n }] = await pg`select count(*)::int as n from ${pg(tabela)}`;
      const destino = (db as unknown as {
        $client: { prepare: (s: string) => { get: () => { n: number } } };
      }).$client.prepare(`select count(*) as n from "${tabela}"`).get().n;
      contagens.push([tabela, n as number, destino]);
    }
  } finally {
    await pg.end();
  }

  let falhou = false;
  console.log("\ntabela                    postgres   sqlite");
  for (const [tabela, origem, destino] of contagens) {
    const igual = origem === destino;
    if (!igual) falhou = true;
    console.log(
      `${tabela.padEnd(24)} ${String(origem).padStart(8)} ${String(destino).padStart(8)}  ${igual ? "ok" : "DIFERENTE"}`,
    );
  }

  fecharBase();
  if (falhou) {
    console.error("\nAs contagens não batem certo. Nada disto conta como migrado.");
    process.exit(1);
  }
  console.log("\nMigração completa e conferida.");
  process.exit(0);
}

principal();
