/**
 * Exporta o conteúdo todo para um JSON no R2.
 *
 * Não substitui o Litestream: são coisas diferentes. O Litestream copia
 * a base tal e qual, alteração a alteração, e por isso copia também um
 * engano fielmente. Este export é a rede por baixo dessa: um retrato
 * legível de um dia, que se pode abrir e ler sem SQLite nenhum.
 *
 * Corre-se à mão, de dentro da máquina, porque a base vive num volume
 * a que mais ninguém chega:
 *
 *   fly ssh console -a contagiarte -C "npx tsx scripts/copia-seguranca.ts"
 */
import { sql as raw } from "drizzle-orm";
import { db, fecharBase } from "../src/lib/db";
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
    const linhas = await db.all(raw.raw(`select * from "${tabela}"`));
    conteudo[tabela] = linhas as unknown[];
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
  fecharBase();
  process.exit(0);
}

principal().catch(async (erro) => {
  console.error("Falhou a cópia de segurança:", erro);
  fecharBase();
  process.exit(1);
});
