/**
 * Cópia de segurança do conteúdo para o R2.
 *
 * Exporta todas as tabelas para um único JSON e guarda-o no bucket, em
 * `copias/<ambiente>/<data>.json`. É uma segunda linha de defesa: a
 * primeira são as snapshots de volume da Fly, que cobrem a base de
 * dados inteira. Esta cópia é a que se lê e se restaura à mão sem
 * depender da Fly, e é a que serve para levar produção para staging.
 *
 * Os ficheiros em si (fotografias, PDFs) já vivem no R2 e não são
 * copiados outra vez; o que se guarda aqui são os registos que
 * apontam para eles.
 *
 *   npm run copia
 *   npm run copia -- --restaurar copias/producao/2026-08-20.json
 */
import { sql as raw } from "drizzle-orm";
import { db, sql } from "../src/lib/db";
import { env } from "../src/lib/env";
import { guardar } from "../src/lib/media/r2";

const TABELAS = [
  "utilizadores",
  "media",
  "artistas",
  "lugares",
  "exposicoes",
  "exposicoes_artistas",
  "obras",
  "obras_media",
  "salas",
  "salas_obras",
  "molduras",
  "textos",
  "descarregaveis",
  "definicoes",
  "pedidos",
  "subscritores",
  "registo",
] as const;

async function exportar() {
  const conteudo: Record<string, unknown[]> = {};

  for (const tabela of TABELAS) {
    // O nome vem de uma lista fixa neste ficheiro, nunca de fora.
    const linhas = await db.execute(
      raw.raw(`select * from "${tabela}" order by 1`),
    );
    conteudo[tabela] = Array.from(linhas as Iterable<unknown>);
    console.log(`· ${tabela}: ${conteudo[tabela].length} linhas`);
  }

  const agora = new Date().toISOString();
  const documento = {
    versao: 1,
    ambiente: env.ambiente,
    criadoEm: agora,
    tabelas: conteudo,
  };

  const corpo = Buffer.from(JSON.stringify(documento, null, 2), "utf8");
  const nome = `copias/${env.ambiente}/${agora.slice(0, 19).replace(/[:T]/g, "-")}.json`;

  if (!env.r2.configurado) {
    const local = `copia-${env.ambiente}-${agora.slice(0, 10)}.json`;
    await import("node:fs/promises").then((fs) => fs.writeFile(local, corpo));
    console.log(
      `R2 não configurado. Cópia guardada em ${local} (${(corpo.length / 1024).toFixed(1)} KB).`,
    );
    return;
  }

  await guardar(nome, corpo, "application/json");
  console.log(
    `Cópia guardada em ${nome} (${(corpo.length / 1024).toFixed(1)} KB).`,
  );
}

async function principal() {
  console.log(`A copiar o conteúdo de ${env.ambiente}…`);
  await exportar();
  await sql.end();
  process.exit(0);
}

principal().catch(async (erro) => {
  console.error("Falhou a cópia de segurança:", erro);
  await sql.end({ timeout: 5 }).catch(() => {});
  process.exit(1);
});
