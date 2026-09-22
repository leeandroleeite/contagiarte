/**
 * Traduz para inglês e espanhol as descrições das fotografias.
 *
 * A descrição de uma fotografia é o que um leitor de ecrã anuncia e o
 * que a busca do backoffice procura. As 382 que estão na mediateca
 * entraram todas por importações em lote, e o `importar-pasta` só
 * aceitava uma frase, em português: quem visita o site em inglês ouvia
 * português, porque o `texto()` cai para o pt quando não há mais nada.
 *
 * As 382 dizem 106 coisas diferentes, e a maior parte delas por
 * fórmula: "Obra de X, do portfólio da Galeria Contagiarte" repete-se
 * quarenta vezes. Por isso isto são padrões primeiro e frases soltas
 * depois, e não 106 traduções à mão: um padrão lê-se e confere-se uma
 * vez, e serve as importações que vierem a seguir.
 *
 * O que não reconhece, não toca, e diz o que ficou de fora. Uma
 * tradução inventada numa descrição é pior do que a falta dela, porque
 * ninguém volta a olhar para uma linha que já parece preenchida.
 *
 *   npm run traduzir            # mostra o que faria
 *   npm run traduzir -- --aplicar
 *
 * Os nomes próprios ficam como estão: "A Pele da Terra" é o título de
 * uma exposição, "Caretos" e "Passe-partout" são o que são, e o nome
 * de um artista não se traduz.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isNull, or, sql } from "drizzle-orm";
import { db, fecharBase } from "../src/lib/db";
import { media, obras } from "../src/lib/db/schema";
import type { Localizado } from "../src/lib/db/schema";

/** Uma frase em três idiomas. */
type Trio = { en: string; es: string };

/**
 * Fórmulas. A primeira que casar ganha, por isso a ordem conta: as
 * mais específicas vêm antes das mais largas.
 */
const PADROES: Array<{
  pt: RegExp;
  en: (m: RegExpMatchArray) => string;
  es: (m: RegExpMatchArray) => string;
}> = [
  {
    pt: /^Obra de (.+), do portfólio da Galeria Contagiarte$/,
    en: (m) => `Work by ${m[1]}, from the Galeria Contagiarte portfolio`,
    es: (m) => `Obra de ${m[1]}, del portafolio de la Galeria Contagiarte`,
  },
  {
    pt: /^(.+), de (.+), na exposição A Pele da Terra$/,
    en: (m) => `${m[1]}, by ${m[2]}, in the exhibition A Pele da Terra`,
    es: (m) => `${m[1]}, de ${m[2]}, en la exposición A Pele da Terra`,
  },
  {
    pt: /^(.+), obra da exposição A Pele da Terra$/,
    en: (m) => `${m[1]}, work from the exhibition A Pele da Terra`,
    es: (m) => `${m[1]}, obra de la exposición A Pele da Terra`,
  },
  {
    pt: /^Retrato de (.+)$/,
    en: (m) => `Portrait of ${m[1]}`,
    es: (m) => `Retrato de ${m[1]}`,
  },
  // "Wonder Frida, de Mário Ferreira, técnica mista sobre tela". Só casa
  // quando a técnica está no dicionário abaixo: sem isso, um "de X, de
  // Y, qualquer coisa" passava por aqui e saía traduzido pela metade.
  {
    pt: /^(.+), de ([^,]+), (.+)$/,
    en: (m) => {
      const t = TECNICAS[m[3].toLowerCase()];
      if (!t) throw new NaoSei();
      return `${m[1]}, by ${m[2]}, ${t.en}`;
    },
    es: (m) => {
      const t = TECNICAS[m[3].toLowerCase()];
      if (!t) throw new NaoSei();
      return `${m[1]}, de ${m[2]}, ${t.es}`;
    },
  },
];

/** Sinal de que um padrão casou mas não sabe traduzir o que apanhou. */
class NaoSei extends Error {}

/**
 * As técnicas, que aparecem na ficha de cada obra e dentro de algumas
 * descrições de fotografia. As três longas são as que vieram do
 * catálogo da galeria, palavra por palavra.
 *
 * A chave está em minúsculas porque a mesma técnica aparece a começar
 * por maiúscula na ficha e por minúscula no meio de uma frase.
 */
const TECNICAS: Record<string, Trio> = {
  "técnica mista": { en: "Mixed media", es: "Técnica mixta" },
  "técnica mista sobre tela": {
    en: "mixed media on canvas",
    es: "técnica mixta sobre lienzo",
  },
  "cerâmica e gesso": { en: "Ceramic and plaster", es: "Cerámica y yeso" },
  "em cerâmica e gesso": {
    en: "in ceramic and plaster",
    es: "en cerámica y yeso",
  },
  "grés e pigmentos": {
    en: "Stoneware and pigments",
    es: "Gres y pigmentos",
  },
  "em grés e pigmentos": {
    en: "in stoneware and pigments",
    es: "en gres y pigmentos",
  },
  "colagem e spray": { en: "Collage and spray", es: "Collage y espray" },
  "técnica mista em kapa plast e impressão directa com instalação de letras 3d e luzes led":
    {
      en: "Mixed media on Kapa Plast with direct printing, with 3D lettering and LED lights installed",
      es: "Técnica mixta en Kapa Plast e impresión directa con instalación de letras 3D y luces led",
    },
  "técnica mista em kapa plast e impressão directa com instalação do farol original. possibilidade de personalização de acordo com o veículo":
    {
      en: "Mixed media on Kapa Plast with direct printing, with the original headlamp installed. Can be personalised to match the vehicle",
      es: "Técnica mixta en Kapa Plast e impresión directa con instalación del faro original. Posibilidad de personalización según el vehículo",
    },
  "técnica mista em kapa plast e impressão directa trabalhada manualmente em sobreposição de várias camadas, com instalação de luz neon-led em caixa de acrílico":
    {
      en: "Mixed media on Kapa Plast with direct printing, worked by hand in several overlaid layers, with Neon-LED lighting installed in an acrylic case",
      es: "Técnica mixta en Kapa Plast e impresión directa trabajada a mano en superposición de varias capas, con instalación de luz Neon-Led en caja de acrílico",
    },
};

/**
 * As frases que não seguem fórmula nenhuma.
 *
 * A adega da Quanta Terra é uma "winery" e uma "bodega"; as barricas
 * são "barrels" e "barricas"; e uma cuba centenária forrada a azulejo
 * não tem tradução curta, por isso fica descrita.
 */
const EXACTOS: Record<string, Trio> = {
  "Inauguração de A Pele da Terra, na adega da Quanta Terra, em Favaios": {
    en: "Opening of A Pele da Terra, at the Quanta Terra winery, in Favaios",
    es: "Inauguración de A Pele da Terra, en la bodega de Quanta Terra, en Favaios",
  },
  "Caretos na inauguração de A Pele da Terra, na Quanta Terra, em Favaios": {
    en: "Caretos at the opening of A Pele da Terra, at Quanta Terra, in Favaios",
    es: "Caretos en la inauguración de A Pele da Terra, en Quanta Terra, en Favaios",
  },
  "Exterior da adega da Quanta Terra, em Favaios, no dia da inauguração": {
    en: "Outside the Quanta Terra winery, in Favaios, on the opening day",
    es: "Exterior de la bodega de Quanta Terra, en Favaios, el día de la inauguración",
  },
  "Fotografia da Galeria Contagiarte": {
    en: "Photograph of Galeria Contagiarte",
    es: "Fotografía de la Galeria Contagiarte",
  },
  "Peça em cerâmica de Ana+Betânia": {
    en: "Ceramic piece by Ana+Betânia",
    es: "Pieza de cerámica de Ana+Betânia",
  },
  "Sessão de abertura na sala das barricas da Quanta Terra": {
    en: "Opening session in the barrel room at Quanta Terra",
    es: "Sesión de apertura en la sala de barricas de Quanta Terra",
  },
  "Peça de cerâmica da exposição A Pele da Terra, na adega da Quanta Terra": {
    en: "Ceramic piece from the exhibition A Pele da Terra, at the Quanta Terra winery",
    es: "Pieza de cerámica de la exposición A Pele da Terra, en la bodega de Quanta Terra",
  },
  "Quarteto de cordas a tocar entre as barricas, na adega da Quanta Terra": {
    en: "String quartet playing among the barrels, at the Quanta Terra winery",
    es: "Cuarteto de cuerda tocando entre las barricas, en la bodega de Quanta Terra",
  },
  "Obras de A Pele da Terra nas paredes da adega da Quanta Terra": {
    en: "Works from A Pele da Terra on the walls of the Quanta Terra winery",
    es: "Obras de A Pele da Terra en las paredes de la bodega de Quanta Terra",
  },
  "Mesa de provas, com petiscos servidos em peças de cerâmica da exposição": {
    en: "Tasting table, with food served on ceramic pieces from the exhibition",
    es: "Mesa de degustación, con aperitivos servidos en piezas de cerámica de la exposición",
  },
  "Prova de vinhos comentada na adega da Quanta Terra, durante A Pele da Terra":
    {
      en: "Guided wine tasting at the Quanta Terra winery, during A Pele da Terra",
      es: "Cata de vinos comentada en la bodega de Quanta Terra, durante A Pele da Terra",
    },
  "Confraria do vinho na inauguração de A Pele da Terra, na Quanta Terra": {
    en: "Wine brotherhood at the opening of A Pele da Terra, at Quanta Terra",
    es: "Cofradía del vino en la inauguración de A Pele da Terra, en Quanta Terra",
  },
  "Catálogo e materiais da exposição A Pele da Terra": {
    en: "Catalogue and materials from the exhibition A Pele da Terra",
    es: "Catálogo y materiales de la exposición A Pele da Terra",
  },
  "Peça de cerâmica dentro de uma cuba centenária forrada a azulejo, na adega da Quanta Terra":
    {
      en: "Ceramic piece inside a century-old tile-lined vat, at the Quanta Terra winery",
      es: "Pieza de cerámica dentro de una cuba centenaria revestida de azulejos, en la bodega de Quanta Terra",
    },
  "Hotel Forte de Gaia, Marriott Autograph Collection": {
    en: "Hotel Forte de Gaia, Marriott Autograph Collection",
    es: "Hotel Forte de Gaia, Marriott Autograph Collection",
  },
  "Moldura produzida em parceria com a MOLDARTPÓVOA": {
    en: "Frame produced in partnership with MOLDARTPÓVOA",
    es: "Marco producido en colaboración con MOLDARTPÓVOA",
  },
  "Armazém de molduras da MOLDARTPÓVOA": {
    en: "MOLDARTPÓVOA frame warehouse",
    es: "Almacén de marcos de MOLDARTPÓVOA",
  },
  "Amostra de moldura sobre uma gravura": {
    en: "Frame sample over a print",
    es: "Muestra de marco sobre un grabado",
  },
  "Máquina de corte na oficina de molduras": {
    en: "Cutting machine in the framing workshop",
    es: "Máquina de corte en el taller de marcos",
  },
  "Escolha de moldura para uma obra em papel": {
    en: "Choosing a frame for a work on paper",
    es: "Elección de marco para una obra sobre papel",
  },
  "Cantos de moldura pousados sobre uma serigrafia": {
    en: "Frame corners resting on a screen print",
    es: "Esquinas de marco colocadas sobre una serigrafía",
  },
  "Canto de moldura preta sobre uma gravura": {
    en: "Black frame corner over a print",
    es: "Esquina de marco negro sobre un grabado",
  },
  "Passe-partout e moldura sobre um desenho a tinta": {
    en: "Passe-partout and frame over an ink drawing",
    es: "Paspartú y marco sobre un dibujo a tinta",
  },
  "Passe-partout azul sobre uma gravura": {
    en: "Blue passe-partout over a print",
    es: "Paspartú azul sobre un grabado",
  },
  "Obras da Contagiarte nas paredes do Off Padel, em Leça da Palmeira": {
    en: "Contagiarte works on the walls of Off Padel, in Leça da Palmeira",
    es: "Obras de Contagiarte en las paredes de Off Padel, en Leça da Palmeira",
  },
  "Jogo no Off Padel, com obras da Contagiarte em redor": {
    en: "A game at Off Padel, with Contagiarte works all around",
    es: "Un partido en Off Padel, con obras de Contagiarte alrededor",
  },
  "Campo do Off Padel, com a exposição montada nas paredes": {
    en: "The Off Padel court, with the exhibition hung on the walls",
    es: "La pista de Off Padel, con la exposición montada en las paredes",
  },
  "Catálogo da Galeria Contagiarte, em PDF": {
    en: "Galeria Contagiarte catalogue, in PDF",
    es: "Catálogo de la Galeria Contagiarte, en PDF",
  },
  "Dossier da exposição A Pele da Terra, Quanta Terra e Contagiarte, em PDF": {
    en: "Dossier for the exhibition A Pele da Terra, Quanta Terra and Contagiarte, in PDF",
    es: "Dossier de la exposición A Pele da Terra, Quanta Terra y Contagiarte, en PDF",
  },
  "Desdobrável da exposição A Pele da Terra, em PDF": {
    en: "Leaflet for the exhibition A Pele da Terra, in PDF",
    es: "Folleto de la exposición A Pele da Terra, en PDF",
  },
  // As que ficaram por atribuir quando se descobriu que o conjunto do
  // protótipo estava todo trocado. A tradução tem de dizer o mesmo: que
  // ninguém sabe ainda o que é.
  "Retrato de artista, pessoa por identificar": {
    en: "Portrait of an artist, person not yet identified",
    es: "Retrato de artista, persona por identificar",
  },
  "Vista de exposição, lugar por identificar": {
    en: "Exhibition view, venue not yet identified",
    es: "Vista de exposición, lugar por identificar",
  },
  "Oficina de molduras, lugar por identificar": {
    en: "Framing workshop, venue not yet identified",
    es: "Taller de marcos, lugar por identificar",
  },
  "Atelier de pintura, lugar por identificar": {
    en: "Painting studio, venue not yet identified",
    es: "Taller de pintura, lugar por identificar",
  },
  "Escultura em cerâmica, obra por identificar": {
    en: "Ceramic sculpture, work not yet identified",
    es: "Escultura en cerámica, obra por identificar",
  },
  "Colagem sobre painel, obra por identificar": {
    en: "Collage on panel, work not yet identified",
    es: "Collage sobre panel, obra por identificar",
  },
  "Serigrafia, obra por identificar": {
    en: "Screen print, work not yet identified",
    es: "Serigrafía, obra por identificar",
  },
  "Pintura, obra por identificar": {
    en: "Painting, work not yet identified",
    es: "Pintura, obra por identificar",
  },
  "Desenho, obra por identificar": {
    en: "Drawing, work not yet identified",
    es: "Dibujo, obra por identificar",
  },
  "Obra com asas, por identificar": {
    en: "Work with wings, not yet identified",
    es: "Obra con alas, por identificar",
  },
  // Do protótipo, que ainda vive no staging.
  "Café da Praça, em Matosinhos": {
    en: "Café da Praça, in Matosinhos",
    es: "Café da Praça, en Matosinhos",
  },
  "Off Padel, em Leça da Palmeira": {
    en: "Off Padel, in Leça da Palmeira",
    es: "Off Padel, en Leça da Palmeira",
  },
  "Quanta Terra, adega em Favaios, Alijó": {
    en: "Quanta Terra, a winery in Favaios, Alijó",
    es: "Quanta Terra, bodega en Favaios, Alijó",
  },
  "Obra em destaque da Galeria Contagiarte": {
    en: "Featured work at Galeria Contagiarte",
    es: "Obra destacada de la Galeria Contagiarte",
  },
  "Vista da exposição A Pele da Terra, na adega da Quanta Terra": {
    en: "View of the exhibition A Pele da Terra, at the Quanta Terra winery",
    es: "Vista de la exposición A Pele da Terra, en la bodega de Quanta Terra",
  },
};

/** A tradução de uma frase, ou nada quando não se reconhece. */
export function traduzir(pt: string): Trio | null {
  const exacto = EXACTOS[pt];
  if (exacto) return exacto;
  for (const padrao of PADROES) {
    const m = pt.match(padrao.pt);
    if (!m) continue;
    try {
      return { en: padrao.en(m), es: padrao.es(m) };
    } catch (erro) {
      // Casou a forma mas não o conteúdo. Passa ao padrão seguinte, e se
      // nenhum souber a frase fica como está e vai para o relatório.
      if (erro instanceof NaoSei) continue;
      throw erro;
    }
  }
  return null;
}

/** A tradução de uma técnica, ou nada quando não está no dicionário. */
export function traduzirTecnica(pt: string): Trio | null {
  return TECNICAS[pt.trim().toLowerCase()] ?? null;
}

const vazio = (v: string | null | undefined) => !v || v.trim() === "";

async function principal() {
  const aplicar = process.argv.includes("--aplicar");

  const linhas = await db
    .select({ id: media.id, alt: media.alt })
    .from(media)
    .where(
      or(
        isNull(sql`json_extract(${media.alt}, '$.en')`),
        sql`trim(coalesce(json_extract(${media.alt}, '$.en'), '')) = ''`,
        isNull(sql`json_extract(${media.alt}, '$.es')`),
        sql`trim(coalesce(json_extract(${media.alt}, '$.es'), '')) = ''`,
      ),
    );

  let feitas = 0;
  const semTraducao = new Map<string, number>();

  for (const linha of linhas) {
    const alt = linha.alt as Localizado | null;
    const pt = alt?.pt?.trim();
    if (!pt) continue;
    if (!vazio(alt?.en) && !vazio(alt?.es)) continue;

    const trio = traduzir(pt);
    if (!trio) {
      semTraducao.set(pt, (semTraducao.get(pt) ?? 0) + 1);
      continue;
    }

    feitas++;
    if (aplicar) {
      await db
        .update(media)
        .set({ alt: { pt, en: trio.en, es: trio.es } })
        .where(sql`${media.id} = ${linha.id}`);
    }
  }

  console.log(
    `${linhas.length} fotografias sem inglês ou espanhol.\n` +
      `${feitas} ${aplicar ? "traduzidas" : "por traduzir, se aplicares"}.`,
  );

  // As técnicas das obras vêm pelo mesmo dicionário. Os títulos não:
  // "Wonder Frida" chama-se Wonder Frida nos três idiomas, e traduzir um
  // título é inventar uma obra que não existe.
  const comTecnica = await db
    .select({ id: obras.id, slug: obras.slug, tecnica: obras.tecnica })
    .from(obras);

  let tecnicas = 0;
  const tecnicasPorSaber: string[] = [];

  for (const obra of comTecnica) {
    const tec = obra.tecnica as Localizado | null;
    const pt = tec?.pt?.trim();
    if (!pt) continue;
    if (!vazio(tec?.en) && !vazio(tec?.es)) continue;

    const trio = traduzirTecnica(pt);
    if (!trio) {
      tecnicasPorSaber.push(`${obra.slug}: ${pt}`);
      continue;
    }

    tecnicas++;
    if (aplicar) {
      await db
        .update(obras)
        .set({ tecnica: { pt, en: trio.en, es: trio.es } })
        .where(sql`${obras.id} = ${obra.id}`);
    }
  }

  console.log(
    `${tecnicas} técnicas de obra ${aplicar ? "traduzidas" : "por traduzir"}.`,
  );
  if (tecnicasPorSaber.length > 0) {
    console.log(`\n${tecnicasPorSaber.length} técnicas fora do dicionário:`);
    for (const t of tecnicasPorSaber) console.log(`  ${t}`);
  }

  if (semTraducao.size > 0) {
    console.log(`\n${semTraducao.size} frases que este guião não reconhece:`);
    for (const [pt, n] of [...semTraducao].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(n).padStart(4)}  ${pt}`);
    }
    console.log(
      "\nEstas ficaram como estavam. Acrescenta-lhes um padrão ou uma\n" +
        "entrada em EXACTOS, ou escreve-as no backoffice.",
    );
  }

  fecharBase();
}

// Só corre quando é este o ficheiro que se pediu. O `traduzir` acima é
// importado por quem precisa da tabela sem querer mexer na base, e sem
// esta guarda a importação corria o guião todo e escrevia a sua saída
// no meio do que o outro estava a produzir.
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  principal();
}
