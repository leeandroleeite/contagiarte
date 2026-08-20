/**
 * Traz para a mediateca as fotografias que a própria galeria já tem
 * publicadas no seu sítio antigo.
 *
 * As imagens que vieram do projecto de design saíram de um PDF e têm
 * 440px no lado maior: esticadas num ecrã grande ficam desfocadas. As
 * do sítio da galeria são os originais, até 12000px, e são dela — o
 * que é a diferença que interessa, porque nenhuma fotografia de obra
 * de terceiros tem lugar no sítio comercial de uma galeria.
 *
 * Aqui não se decide a que obra pertence cada fotografia: isso só quem
 * conhece o espólio pode dizer, e faz-se no backoffice. O que o script
 * faz é pôr o material lá dentro, já em tamanho de web e com o nome do
 * artista quando o sítio antigo o dava.
 *
 *   npm run galeria -- scripts/dados/galeria.json [pasta-de-cache]
 *
 * O manifesto guarda os endereços; a pasta de cache evita voltar a
 * descarregar o que já se descarregou. É idempotente: uma imagem já
 * importada não entra outra vez.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db, sql } from "../src/lib/db";
import { lugares, media } from "../src/lib/db/schema";
import { guardarFicheiro } from "../src/lib/media/armazenamento";
import { normalizarNome } from "../src/lib/media/r2";

/** Lado maior, em pixéis, a que as fotografias ficam guardadas. */
const LADO_MAXIMO = 2000;

type Entrada = {
  url: string;
  nome: string;
  alt: string;
  /**
   * Só quando a fotografia se identifica sozinha — a marca do sítio à
   * vista, a oficina reconhecível. Nas outras não se adivinha: ficam na
   * mediateca à espera de quem conhece o espólio.
   */
  lugar?: string;
};

async function lerManifesto(caminho: string): Promise<Entrada[]> {
  const bruto = await fs.readFile(caminho, "utf8");
  const lista = JSON.parse(bruto) as Entrada[];
  if (!Array.isArray(lista)) throw new Error("O manifesto não é uma lista.");
  return lista;
}

/** Descarrega, com cache em disco para não repetir o trabalho. */
async function obterBytes(url: string, cache: string): Promise<Buffer> {
  const nome = createHash("sha1").update(url).digest("hex");
  const destino = path.join(cache, nome);

  try {
    return await fs.readFile(destino);
  } catch {
    // Ainda não está em cache.
  }

  const resposta = await fetch(url, {
    headers: { "User-Agent": "Contagiarte/1.0 (importador de media)" },
  });
  if (!resposta.ok) {
    throw new Error(`${resposta.status} ao descarregar ${url}`);
  }

  const bytes = Buffer.from(await resposta.arrayBuffer());
  await fs.mkdir(cache, { recursive: true });
  await fs.writeFile(destino, bytes);
  return bytes;
}

/** Põe a fotografia como a do lugar. */
async function ligar(slug: string, fotografiaId: string) {
  await db.update(lugares).set({ fotografiaId }).where(eq(lugares.slug, slug));
}

async function importar(entrada: Entrada, cache: string) {
  const pasta = process.env.APP_ENV === "producao" ? "producao" : "local";
  const chave = `${pasta}/imagens/${normalizarNome(entrada.nome)}`;

  const [existente] = await db
    .select({ id: media.id })
    .from(media)
    .where(eq(media.chave, chave))
    .limit(1);
  if (existente) {
    // A imagem não volta a entrar, mas a ligação sim: o manifesto pode
    // ter ganho um lugar depois de a fotografia já cá estar.
    if (entrada.lugar) await ligar(entrada.lugar, existente.id);
    return "repetida" as const;
  }

  const bytes = await obterBytes(entrada.url, cache);

  // Reduzir sem nunca aumentar: uma fotografia pequena fica como está,
  // esticá-la só inventava pixéis.
  const reduzida = await sharp(bytes, { failOn: "none" })
    .rotate()
    .resize(LADO_MAXIMO, LADO_MAXIMO, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const imagem = sharp(reduzida);
  const meta = await imagem.metadata();
  const { dominant } = await imagem.stats();
  const pequena = await sharp(reduzida)
    .resize(16, 16, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();

  await guardarFicheiro(chave, reduzida, "image/jpeg");

  const [novo] = await db
    .insert(media)
    .values({
      chave,
      nomeOriginal: entrada.nome,
      tipoMime: "image/jpeg",
      tamanho: reduzida.byteLength,
      largura: meta.width ?? null,
      altura: meta.height ?? null,
      corDominante: `#${[dominant.r, dominant.g, dominant.b]
        .map((c) => Math.round(c).toString(16).padStart(2, "0"))
        .join("")}`,
      blur: `data:image/webp;base64,${pequena.toString("base64")}`,
      alt: { pt: entrada.alt, en: null, es: null },
    })
    .returning({ id: media.id });

  if (entrada.lugar) await ligar(entrada.lugar, novo.id);

  return { largura: meta.width, altura: meta.height, kb: Math.round(reduzida.byteLength / 1024) };
}

async function principal() {
  const manifesto = process.argv[2];
  const cache = process.argv[3] ?? ".cache/galeria";
  if (!manifesto) {
    console.error("Falta o manifesto. npm run galeria -- <manifesto.json>");
    process.exit(1);
  }

  const entradas = await lerManifesto(manifesto);
  let novas = 0;
  let repetidas = 0;
  const falhas: string[] = [];

  for (const entrada of entradas) {
    try {
      const r = await importar(entrada, cache);
      if (r === "repetida") {
        repetidas++;
        continue;
      }
      novas++;
      console.log(`+ ${entrada.nome} ${r.largura}x${r.altura} ${r.kb}KB`);
    } catch (erro) {
      falhas.push(`${entrada.nome}: ${String(erro)}`);
    }
  }

  console.log(`\n${novas} novas, ${repetidas} já lá estavam.`);
  if (falhas.length > 0) {
    console.log(`${falhas.length} falharam:`);
    for (const f of falhas) console.log(`  ${f}`);
  }

  await sql.end();
  process.exit(falhas.length > 0 ? 1 : 0);
}

principal();
