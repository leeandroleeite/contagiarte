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
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { eq, sql as bruto } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
  artistas,
  definicoes,
  descarregaveis,
  exposicoes,
  exposicoesArtistas,
  lugares,
  media,
  molduras,
  obras,
  salas,
  textos,
  utilizadores,
} from "../src/lib/db/schema";
import { DEFINICOES_OMISSAO } from "../src/lib/db/omissoes";
import { MEDIA_SEMENTE } from "./media-semente";
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

/**
 * As molduras são catálogo da oficina e não conteúdo da galeria: não
 * há página no backoffice para as editar, vivem em `conteudo.ts`. Por
 * isso, ao contrário de tudo o resto aqui, actualizam-se em vez de
 * serem ignoradas quando já existem. Sem isto, os tons corrigidos
 * pelas fotografias da oficina ficaram só na base local e produção
 * continuou com as quatro molduras e as cores inventadas do início.
 */
async function semearMolduras() {
  for (const m of MOLDURAS) {
    await db
      .insert(molduras)
      .values(m)
      .onConflictDoUpdate({
        target: molduras.slug,
        set: {
          nome: m.nome,
          cor: m.cor,
          espessuraMm: m.espessuraMm,
          ordem: m.ordem,
        },
      });
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

/**
 * Regista na mediateca as imagens que o repositório traz e liga-as a
 * quem pertencem.
 *
 * Sem isto, uma base semeada de raiz ficava com treze obras e zero
 * fotografias: o site inteiro feito de marcadores, e os testes do
 * simulador a falhar por não haver nenhuma obra com fotografia e
 * medidas ao mesmo tempo. Só se via no CI, porque uma base de trabalho
 * já tem imagens de outras corridas.
 *
 * Idempotente: uma imagem já registada não entra outra vez, e uma
 * ficha que já tenha fotografia não é pisada.
 */
async function semearMedia() {
  const pasta = path.join(process.cwd(), "public", "media", "local", "imagens");
  let novas = 0;
  let ligadas = 0;
  let semFicheiro = 0;

  for (const semente of MEDIA_SEMENTE) {
    const caminho = path.join(pasta, semente.ficheiro);
    let bytes: Buffer;
    try {
      bytes = await fs.readFile(caminho);
    } catch {
      semFicheiro++;
      continue;
    }

    const chave = `local/imagens/${semente.ficheiro}`;
    const [jaLa] = await db
      .select({ id: media.id })
      .from(media)
      .where(eq(media.chave, chave))
      .limit(1);

    let id = jaLa?.id;
    if (!id) {
      const imagem = sharp(bytes);
      const meta = await imagem.metadata();
      const { dominant } = await imagem.stats();
      const pequena = await sharp(bytes)
        .resize(16, 16, { fit: "inside" })
        .webp({ quality: 40 })
        .toBuffer();

      const [criada] = await db
        .insert(media)
        .values({
          chave,
          nomeOriginal: semente.ficheiro,
          tipoMime: "image/png",
          tamanho: bytes.byteLength,
          largura: meta.width ?? null,
          altura: meta.height ?? null,
          corDominante: `#${[dominant.r, dominant.g, dominant.b]
            .map((c) => Math.round(c).toString(16).padStart(2, "0"))
            .join("")}`,
          blur: `data:image/webp;base64,${pequena.toString("base64")}`,
          alt: { pt: semente.alt, en: null, es: null },
        })
        .returning({ id: media.id });
      id = criada.id;
      novas++;
    }

    const liga = semente.liga;
    if (!liga || !id) continue;

    // `where` com a coluna a nulo: quem já tem fotografia fica como
    // está, porque a escolha da galeria vale mais do que a do seed.
    const feito =
      liga.tipo === "obra"
        ? await db
            .update(obras)
            .set({ fotografiaId: id })
            .where(
              bruto`json_extract(${obras.titulo}, '$.pt') = ${liga.titulo} and ${obras.fotografiaId} is null`,
            )
            .returning({ id: obras.id })
        : liga.tipo === "artista"
          ? await db
              .update(artistas)
              .set({ retratoId: id })
              .where(
                bruto`${artistas.nome} = ${liga.nome} and ${artistas.retratoId} is null`,
              )
              .returning({ id: artistas.id })
          : liga.tipo === "lugar"
            ? await db
                .update(lugares)
                .set({ fotografiaId: id })
                .where(
                  bruto`${lugares.slug} = ${liga.slug} and ${lugares.fotografiaId} is null`,
                )
                .returning({ id: lugares.id })
            : await db
                .update(exposicoes)
                .set({ imagemId: id })
                .where(
                  bruto`${exposicoes.slug} = ${liga.slug} and ${exposicoes.imagemId} is null`,
                )
                .returning({ id: exposicoes.id });

    ligadas += feito.length;
  }

  console.log(
    `· ${MEDIA_SEMENTE.length} imagens do repositório: ${novas} novas na mediateca, ${ligadas} ligadas a fichas` +
      (semFicheiro > 0 ? `, ${semFicheiro} sem ficheiro no disco` : ""),
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
  await semearMedia();
  await semearAdministrador();

  // `count(*)` e não `count(*)::int`: o cast é do Postgres e o SQLite
  // não o entende. Ficou da migração e partia o seed na última linha,
  // depois de escrever tudo, o que no CI dava um trabalho vermelho com
  // a base já semeada.
  const total = await db.$count(obras);
  console.log(`Pronto. ${total} obras na base de dados.`);
  process.exit(0);
}

principal().catch((erro) => {
  console.error("Falhou a semear:", erro);
  process.exit(1);
});
