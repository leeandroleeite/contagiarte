/**
 * Importa uma pasta de fotografias para a mediateca.
 *
 * É o caminho para material que chega por fora: a entrega de um
 * fotógrafo, um cartão de máquina, uma pasta do Drive. Ao contrário do
 * `importar-galeria`, que lê endereços de um manifesto, este lê do
 * disco e não precisa de rede nenhuma.
 *
 *   npm run pasta -- <pasta> [prefixo] [--alt "texto"]
 *
 * Exemplo, a entrega da exposição na adega:
 *
 *   npm run pasta -- ~/Downloads/contagiarte-quantaterra quanta-terra \
 *     --alt "Exposição A Pele da Terra, na adega da Quanta Terra"
 *
 * Reduz para 2000px de lado maior, converte para JPEG, e é idempotente:
 * um ficheiro já importado não entra outra vez. Nada é atribuído a
 * obras nem a exposições, porque isso é escolha de quem conhece o
 * espólio e faz-se no backoffice.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db, fecharBase } from "../src/lib/db";
import { media } from "../src/lib/db/schema";
import { guardarFicheiro } from "../src/lib/media/armazenamento";
import { normalizarNome } from "../src/lib/media/r2";

/** Lado maior, em pixéis, a que as fotografias ficam guardadas. */
const LADO_MAXIMO = 2000;

const EXTENSOES = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic"]);

/** Todos os ficheiros de imagem de uma pasta, incluindo subpastas. */
async function percorrer(dir: string): Promise<string[]> {
  const saida: string[] = [];
  for (const entrada of await fs.readdir(dir, { withFileTypes: true })) {
    // Pastas escondidas e restos do macOS não interessam.
    if (entrada.name.startsWith(".") || entrada.name === "__MACOSX") continue;
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) saida.push(...(await percorrer(caminho)));
    else if (EXTENSOES.has(path.extname(entrada.name).toLowerCase()))
      saida.push(caminho);
  }
  return saida.sort();
}

async function importar(ficheiro: string, prefixo: string, alt: string) {
  const pasta = process.env.APP_ENV === "producao" ? "producao" : "local";
  const nome = `${prefixo}-${path.basename(ficheiro, path.extname(ficheiro))}.jpg`;
  const chave = `${pasta}/imagens/${normalizarNome(nome)}`;

  const [existente] = await db
    .select({ id: media.id })
    .from(media)
    .where(eq(media.chave, chave))
    .limit(1);
  if (existente) return "repetida" as const;

  const bytes = await fs.readFile(ficheiro);

  // Reduzir sem nunca aumentar, e endireitar pela orientação da máquina.
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

  await db.insert(media).values({
    chave,
    nomeOriginal: nome,
    tipoMime: "image/jpeg",
    tamanho: reduzida.byteLength,
    largura: meta.width ?? null,
    altura: meta.height ?? null,
    corDominante: `#${[dominant.r, dominant.g, dominant.b]
      .map((c) => Math.round(c).toString(16).padStart(2, "0"))
      .join("")}`,
    blur: `data:image/webp;base64,${pequena.toString("base64")}`,
    alt: { pt: alt, en: null, es: null },
  });

  return {
    largura: meta.width,
    altura: meta.height,
    kb: Math.round(reduzida.byteLength / 1024),
  };
}

async function principal() {
  const args = process.argv.slice(2);
  const iAlt = args.indexOf("--alt");
  // Tudo o que vem depois de `--alt` é a descrição. O npm come as
  // aspas a caminho do guião, por isso uma frase chega aqui partida em
  // palavras soltas: ficar só com a primeira dava descrições de uma
  // palavra sem ninguém reparar, que foi o que aconteceu às 258
  // fotografias da adega.
  const alt = iAlt >= 0 ? args.slice(iAlt + 1).join(" ").trim() : "";
  const posicionais = (iAlt >= 0 ? args.slice(0, iAlt) : args).filter(Boolean);
  const [pasta, prefixo = "foto"] = posicionais;

  if (!pasta) {
    console.error("Falta a pasta. npm run pasta -- <pasta> [prefixo] [--alt \"texto\"]");
    process.exit(1);
  }
  if (alt.length < 12) {
    console.error(
      alt
        ? `Descrição curta de mais: "${alt}". Uma palavra não chega para distinguir uma fotografia de outras duzentas.`
        : "Falta o --alt. Uma fotografia sem descrição é uma fotografia que ninguém encontra no backoffice, e que um leitor de ecrã não sabe anunciar.",
    );
    process.exit(1);
  }

  const ficheiros = await percorrer(path.resolve(pasta));
  console.log(`${ficheiros.length} ficheiros em ${pasta}\n`);

  let novas = 0;
  let repetidas = 0;
  let bytes = 0;
  const falhas: string[] = [];

  for (const [i, f] of ficheiros.entries()) {
    try {
      const r = await importar(f, prefixo, alt);
      if (r === "repetida") {
        repetidas++;
        continue;
      }
      novas++;
      bytes += r.kb * 1024;
      // Uma linha a cada dez chega para se perceber que anda.
      if (novas % 10 === 0 || i === ficheiros.length - 1) {
        console.log(`  ${novas} importadas, ${Math.round(bytes / 1048576)}MB`);
      }
    } catch (erro) {
      falhas.push(`${path.basename(f)}: ${String(erro).slice(0, 90)}`);
    }
  }

  console.log(
    `\n${novas} novas, ${repetidas} já lá estavam, ${Math.round(bytes / 1048576)}MB no total.`,
  );
  if (falhas.length > 0) {
    console.log(`${falhas.length} falharam:`);
    for (const f of falhas.slice(0, 10)) console.log(`  ${f}`);
  }

  fecharBase();
  process.exit(falhas.length > 0 ? 1 : 0);
}

principal();
