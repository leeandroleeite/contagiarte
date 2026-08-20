/**
 * Povoa a base de dados com o conteúdo que veio do design.
 *
 * É idempotente: corre as vezes que forem precisas sem duplicar nada.
 * O conteúdo editorial vive em `conteudo.ts` e `textos.ts`; aqui fica
 * só a mecânica de o gravar.
 *
 * As fotografias ficam por carregar de propósito: as do protótipo eram
 * extraídas de um PDF de catálogo e não servem para produção.
 *
 *   npm run semear
 */
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
  artistas,
  definicoes,
  descarregaveis,
  exposicoes,
  exposicoesArtistas,
  lugares,
  molduras,
  obras,
  salas,
  textos,
  utilizadores,
} from "../src/lib/db/schema";
import { DEFINICOES_OMISSAO } from "../src/lib/db/omissoes";
import {
  ARTISTAS,
  EXPOSICOES,
  LUGARES,
  MOLDURAS,
  OBRAS,
  SALAS,
} from "./conteudo";
import { DESCARREGAVEIS, TEXTOS } from "./textos";

async function semearDefinicoes() {
  await db
    .insert(definicoes)
    .values({ id: 1, valor: DEFINICOES_OMISSAO })
    .onConflictDoNothing();
  console.log("· definições");
}

async function semearTextos() {
  for (const t of TEXTOS) {
    await db.insert(textos).values(t).onConflictDoNothing();
  }
  console.log(`· ${TEXTOS.length} textos`);
}

async function semearArtistas() {
  for (const a of ARTISTAS) {
    await db
      .insert(artistas)
      .values({ ...a, estado: "publicado" })
      .onConflictDoNothing();
  }
  console.log(`· ${ARTISTAS.length} artistas`);
}

async function semearLugares() {
  for (const l of LUGARES) {
    await db
      .insert(lugares)
      .values({ ...l, estado: "publicado" })
      .onConflictDoNothing();
  }
  console.log(`· ${LUGARES.length} lugares`);
}

async function semearExposicoes() {
  const mapaLugares = new Map(
    (await db.select().from(lugares)).map((l) => [l.slug, l.id]),
  );
  const mapaArtistas = new Map(
    (await db.select().from(artistas)).map((a) => [a.slug, a.id]),
  );

  for (const e of EXPOSICOES) {
    const { lugarSlug, artistasSlugs, ...resto } = e;
    await db
      .insert(exposicoes)
      .values({
        ...resto,
        lugarId: lugarSlug ? (mapaLugares.get(lugarSlug) ?? null) : null,
        estado: "publicado",
      })
      .onConflictDoNothing();

    const [gravada] = await db
      .select()
      .from(exposicoes)
      .where(eq(exposicoes.slug, e.slug))
      .limit(1);
    if (!gravada) continue;

    for (const [i, slug] of artistasSlugs.entries()) {
      const artistaId = mapaArtistas.get(slug);
      if (!artistaId) continue;
      await db
        .insert(exposicoesArtistas)
        .values({ exposicaoId: gravada.id, artistaId, ordem: i })
        .onConflictDoNothing();
    }
  }
  console.log(`· ${EXPOSICOES.length} exposições`);
}

async function semearObras() {
  const mapaArtistas = new Map(
    (await db.select().from(artistas)).map((a) => [a.slug, a.id]),
  );
  const mapaExpo = new Map(
    (await db.select().from(exposicoes)).map((e) => [e.slug, e.id]),
  );

  for (const o of OBRAS) {
    const { artista, exposicao, ...resto } = o;
    await db
      .insert(obras)
      .values({
        ...resto,
        artistaId: mapaArtistas.get(artista) ?? null,
        exposicaoId: exposicao ? (mapaExpo.get(exposicao) ?? null) : null,
        preco: {
          pt: "Sob consulta",
          en: "Price on request",
          es: "Precio a consultar",
        },
        estado: "publicado",
      })
      .onConflictDoNothing();
  }
  console.log(`· ${OBRAS.length} obras`);
}

async function semearSalas() {
  const [expo] = await db
    .select()
    .from(exposicoes)
    .where(eq(exposicoes.slug, "a-pele-da-terra"))
    .limit(1);
  if (!expo) return;

  for (const s of SALAS) {
    await db
      .insert(salas)
      .values({ ...s, exposicaoId: expo.id })
      .onConflictDoNothing();
  }
  console.log(`· ${SALAS.length} salas do percurso`);
}

async function semearMolduras() {
  for (const m of MOLDURAS) {
    await db.insert(molduras).values(m).onConflictDoNothing();
  }
  console.log(`· ${MOLDURAS.length} molduras`);
}

async function semearDescarregaveis() {
  for (const d of DESCARREGAVEIS) {
    // Ficam em rascunho até o PDF estar carregado, para não haver
    // cartões de descarga que não descarregam nada.
    await db
      .insert(descarregaveis)
      .values({ ...d, estado: "rascunho" })
      .onConflictDoNothing();
  }
  console.log(
    `· ${DESCARREGAVEIS.length} descarregáveis (em rascunho, faltam os PDFs)`,
  );
}

async function semearAdministrador() {
  const email = (process.env.ADMIN_EMAIL ?? "galeria@contagiarte.pt")
    .trim()
    .toLowerCase();
  const [existente] = await db
    .select()
    .from(utilizadores)
    .where(eq(utilizadores.email, email))
    .limit(1);

  if (existente) {
    console.log(`· administrador já existe (${email})`);
    return;
  }

  const palavraPasse = process.env.ADMIN_PASSWORD ?? gerarPalavraPasse();

  await db.insert(utilizadores).values({
    email,
    nome: process.env.ADMIN_NOME ?? "Galeria Contagiarte",
    palavraPasseHash: await bcrypt.hash(palavraPasse, 12),
    papel: "administrador",
  });

  console.log(`· administrador criado: ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`  palavra-passe gerada: ${palavraPasse}`);
    console.log("  guarde-a agora; não volta a ser mostrada.");
  }
}

function gerarPalavraPasse(): string {
  const alfabeto = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}

async function principal() {
  console.log("A semear a base de dados…");
  await semearDefinicoes();
  await semearTextos();
  await semearArtistas();
  await semearLugares();
  await semearExposicoes();
  await semearObras();
  await semearSalas();
  await semearMolduras();
  await semearDescarregaveis();
  await semearAdministrador();

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(obras);
  console.log(`Pronto. ${total} obras na base de dados.`);
  process.exit(0);
}

principal().catch((erro) => {
  console.error("Falhou a semear:", erro);
  process.exit(1);
});
