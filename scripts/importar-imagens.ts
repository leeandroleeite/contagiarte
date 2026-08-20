/**
 * Importa as imagens do projecto de design para a base de dados.
 *
 * As imagens vieram do catálogo da própria galeria, extraídas de um
 * PDF, e por isso são de baixa resolução. Servem para o site poder ser
 * visto e navegado como ficará, e para a galeria as substituir uma a
 * uma pelo backoffice, sem tocar em código.
 *
 * O script é idempotente: uma imagem já importada não entra outra vez.
 *
 *   npm run imagens -- <pasta-com-os-json>
 *
 * A pasta é a dos resultados guardados pelo DesignSync, onde cada
 * ficheiro é um JSON com `path` e `content` em base64.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db, fecharBase } from "../src/lib/db";
import {
  artistas,
  exposicoes,
  lugares,
  media,
  obras,
} from "../src/lib/db/schema";
import { guardarFicheiro } from "../src/lib/media/armazenamento";
import { normalizarNome } from "../src/lib/media/r2";

/** A que registo pertence cada ficheiro do design. */
const LIGACOES: Record<
  string,
  | { tipo: "obra"; slug: string; alt: string }
  | { tipo: "artista"; slug: string; alt: string }
  | { tipo: "lugar"; slug: string; alt: string }
  | { tipo: "exposicao"; slug: string; alt: string }
  | { tipo: "solto"; alt: string }
> = {
  "obra-1.png": {
    tipo: "obra",
    slug: "reminiscencia",
    alt: "Reminiscência, de Ana+Betânia, em grés e pigmentos",
  },
  "obra-2.png": {
    tipo: "obra",
    slug: "wonder-frida",
    alt: "Wonder Frida, de Mário Ferreira, técnica mista sobre tela",
  },
  "obra-3.png": {
    tipo: "obra",
    slug: "honey-gold",
    alt: "Honey Gold, de Ana+Betânia, em cerâmica e gesso",
  },
  "obra-4.png": {
    tipo: "obra",
    slug: "censored-hero",
    alt: "Censored Hero, de Mário Ferreira, técnica mista",
  },
  "obra-5.png": {
    tipo: "obra",
    slug: "egg",
    alt: "Egg, de Ana+Betânia, em cerâmica e gesso",
  },
  "obra-6.png": {
    tipo: "obra",
    slug: "sem-titulo-pant",
    alt: "Obra sem título, de Pant., em colagem e spray",
  },
  "artista-1.png": {
    tipo: "artista",
    slug: "ana-betania",
    alt: "Retrato de Ana+Betânia",
  },
  "artista-2.png": {
    tipo: "artista",
    slug: "mario-ferreira",
    alt: "Retrato de Mário Ferreira",
  },
  "artista-3.png": {
    tipo: "artista",
    slug: "vanessa-teodoro",
    alt: "Retrato de Vanessa Teodoro",
  },
  "artista-4.png": {
    tipo: "artista",
    slug: "pant",
    alt: "Retrato de Pant.",
  },
  "lugar-1.png": {
    tipo: "lugar",
    slug: "quanta-terra",
    alt: "Quanta Terra, adega em Favaios, Alijó",
  },
  "lugar-2.png": {
    tipo: "lugar",
    slug: "forte-de-gaia",
    alt: "Hotel Forte de Gaia, Marriott Autograph Collection",
  },
  "lugar-3.png": {
    tipo: "lugar",
    slug: "off-padel",
    alt: "Off Padel, em Leça da Palmeira",
  },
  "lugar-4.png": {
    tipo: "lugar",
    slug: "cafe-da-praca",
    alt: "Café da Praça, em Matosinhos",
  },
  "expo-pele-da-terra.png": {
    tipo: "exposicao",
    slug: "a-pele-da-terra",
    alt: "Vista da exposição A Pele da Terra, na adega da Quanta Terra",
  },
  "hero-obra.png": {
    tipo: "solto",
    alt: "Obra em destaque da Galeria Contagiarte",
  },
  "molduras.png": {
    tipo: "solto",
    alt: "Moldura produzida em parceria com a MOLDARTPÓVOA",
  },
};

type Ficheiro = { nome: string; bytes: Buffer };

/** Lê os JSON do DesignSync e devolve os PNG já descodificados. */
async function lerDaPasta(pasta: string): Promise<Ficheiro[]> {
  const nomes = await fs.readdir(pasta);
  const ficheiros: Ficheiro[] = [];

  for (const nome of nomes) {
    if (!nome.endsWith(".txt") && !nome.endsWith(".json")) continue;
    let bruto: string;
    try {
      bruto = await fs.readFile(path.join(pasta, nome), "utf8");
    } catch {
      continue;
    }

    let dados: { path?: string; content?: string };
    try {
      dados = JSON.parse(bruto);
    } catch {
      continue;
    }

    if (!dados.path || !dados.content) continue;
    const base = path.basename(dados.path);
    if (!(base in LIGACOES)) continue;

    ficheiros.push({ nome: base, bytes: Buffer.from(dados.content, "base64") });
  }

  return ficheiros;
}

async function importar(ficheiro: Ficheiro) {
  const ligacao = LIGACOES[ficheiro.nome];
  const chave = `${process.env.APP_ENV === "producao" ? "producao" : "local"}/imagens/design-${normalizarNome(ficheiro.nome)}`;

  // Idempotente: se a chave já existe, reaproveita o registo.
  const [existente] = await db
    .select()
    .from(media)
    .where(eq(media.chave, chave))
    .limit(1);

  let id = existente?.id;

  if (!existente) {
    const imagem = sharp(ficheiro.bytes, { failOn: "none" });
    const meta = await imagem.metadata();
    const { dominant } = await imagem.stats();
    const pequena = await sharp(ficheiro.bytes, { failOn: "none" })
      .resize(16, 16, { fit: "inside" })
      .webp({ quality: 40 })
      .toBuffer();

    await guardarFicheiro(chave, ficheiro.bytes, "image/png");

    const [novo] = await db
      .insert(media)
      .values({
        chave,
        nomeOriginal: ficheiro.nome,
        tipoMime: "image/png",
        tamanho: ficheiro.bytes.byteLength,
        largura: meta.width ?? null,
        altura: meta.height ?? null,
        corDominante: `#${[dominant.r, dominant.g, dominant.b]
          .map((c) => c.toString(16).padStart(2, "0"))
          .join("")}`,
        blur: `data:image/webp;base64,${pequena.toString("base64")}`,
        alt: { pt: ligacao.alt, en: null, es: null },
      })
      .returning();
    id = novo.id;
  }

  if (!id) return;

  switch (ligacao.tipo) {
    case "obra":
      await db
        .update(obras)
        .set({ fotografiaId: id })
        .where(eq(obras.slug, ligacao.slug));
      break;
    case "artista":
      await db
        .update(artistas)
        .set({ retratoId: id })
        .where(eq(artistas.slug, ligacao.slug));
      break;
    case "lugar":
      await db
        .update(lugares)
        .set({ fotografiaId: id })
        .where(eq(lugares.slug, ligacao.slug));
      break;
    case "exposicao":
      await db
        .update(exposicoes)
        .set({ imagemId: id })
        .where(eq(exposicoes.slug, ligacao.slug));
      break;
    case "solto":
      // Fica na biblioteca, para a galeria a usar onde quiser.
      break;
  }

  console.log(`· ${ficheiro.nome} → ${ligacao.tipo}`);
}

async function principal() {
  const pasta = process.argv[2];
  if (!pasta) {
    console.error(
      "Uso: npm run imagens -- <pasta-com-os-json-do-design>",
    );
    process.exit(1);
  }

  const ficheiros = await lerDaPasta(pasta);
  if (ficheiros.length === 0) {
    console.error(`Nenhuma imagem reconhecida em ${pasta}.`);
    process.exit(1);
  }

  console.log(`A importar ${ficheiros.length} imagens…`);
  for (const f of ficheiros) await importar(f);

  console.log("Pronto. As imagens são substituíveis pelo backoffice.");
  fecharBase();
  process.exit(0);
}

principal().catch(async (erro) => {
  console.error("Falhou a importação:", erro);
  fecharBase();
  process.exit(1);
});
