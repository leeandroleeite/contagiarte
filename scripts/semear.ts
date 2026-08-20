/**
 * Povoa a base de dados com o conteúdo que veio do design.
 *
 * É idempotente: corre as vezes que forem precisas sem duplicar nada.
 * Os textos definitivos e o inventário real vêm depois pelo backoffice,
 * conforme o handoff avisa. As fotografias ficam por carregar: as do
 * protótipo eram extraídas de um PDF e não servem para produção.
 *
 *   npm run semear
 */
import "dotenv/config";
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
  type Localizado,
} from "../src/lib/db/schema";
import { DEFINICOES_OMISSAO } from "../src/lib/db/omissoes";
import { PRIVACIDADE } from "./textos-legais";

const L = (pt: string, en?: string, es?: string): Localizado => ({
  pt,
  en: en ?? null,
  es: es ?? null,
});

async function semearDefinicoes() {
  await db
    .insert(definicoes)
    .values({ id: 1, valor: DEFINICOES_OMISSAO })
    .onConflictDoNothing();
  console.log("· definições");
}

const TEXTOS: Array<{
  chave: string;
  grupo: string;
  nota: string;
  valor: Localizado;
}> = [
  {
    chave: "home.hero.titulo",
    grupo: "homepage",
    nota: "Título gigante do herói. Fica em inglês nos três idiomas.",
    valor: L(
      "FOR THE NEXT GENERATION OF ART LOVERS",
      "FOR THE NEXT GENERATION OF ART LOVERS",
      "FOR THE NEXT GENERATION OF ART LOVERS",
    ),
  },
  {
    chave: "home.hero.posicionamento",
    grupo: "homepage",
    nota: "Linha curta no canto inferior direito do herói.",
    valor: L(
      "Galeria de arte contemporânea. Porto, Douro e onde mais fizer sentido expor.",
      "Contemporary art gallery. Porto, the Douro, and wherever else it makes sense to exhibit.",
      "Galería de arte contemporáneo. Oporto, el Duero y donde más tenga sentido exponer.",
    ),
  },
  {
    chave: "home.porque.etiqueta",
    grupo: "homepage",
    nota: "Etiqueta do bloco claro sobre porque se compra arte.",
    valor: L(
      "PORQUE SE COMPRA ARTE",
      "WHY PEOPLE BUY ART",
      "POR QUÉ SE COMPRA ARTE",
    ),
  },
  {
    chave: "home.porque.titulo",
    grupo: "homepage",
    nota: "Título do bloco claro. Texto provisório do design.",
    valor: L(
      "UMA OBRA NÃO É SÓ O QUE FICA NA PAREDE.",
      "A WORK IS NOT ONLY WHAT HANGS ON THE WALL.",
      "UNA OBRA NO ES SOLO LO QUE QUEDA EN LA PARED.",
    ),
  },
  {
    chave: "home.porque.1.titulo",
    grupo: "homepage",
    nota: "Primeira coluna do bloco claro.",
    valor: L("O CLIQUE", "THE CLICK", "EL CLIC"),
  },
  {
    chave: "home.porque.1.texto",
    grupo: "homepage",
    nota: "Texto provisório, à espera do documento do cliente.",
    valor: L(
      "Antes de decorar, uma obra desperta. É a peça que nos prende quando entramos na sala e continua a dizer alguma coisa anos depois.",
      "Before it decorates, a work awakens something. It is the piece that holds you when you walk into the room, and still says something years later.",
      "Antes de decorar, una obra despierta. Es la pieza que nos atrapa al entrar en la sala y que sigue diciéndonos algo años después.",
    ),
  },
  {
    chave: "home.porque.2.titulo",
    grupo: "homepage",
    nota: "Segunda coluna do bloco claro.",
    valor: L(
      "UM BEM QUE CAMINHA CONNOSCO",
      "AN ASSET THAT WALKS WITH YOU",
      "UN BIEN QUE CAMINA CON NOSOTROS",
    ),
  },
  {
    chave: "home.porque.2.texto",
    grupo: "homepage",
    nota: "Texto provisório. Ligado à página A obra como ativo.",
    valor: L(
      "Escolhemos artistas e obras pela estética e pelo potencial de valorização. O que hoje ocupa uma parede pode amanhã ser um ativo.",
      "We choose artists and works for their aesthetics and for their potential to appreciate. What occupies a wall today may be an asset tomorrow.",
      "Elegimos artistas y obras por su estética y por su potencial de revalorización. Lo que hoy ocupa una pared puede ser mañana un activo.",
    ),
  },
  {
    chave: "home.porque.3.titulo",
    grupo: "homepage",
    nota: "Terceira coluna do bloco claro.",
    valor: L("ARTE FORA DO NICHO", "ART BEYOND THE NICHE", "ARTE FUERA DEL NICHO"),
  },
  {
    chave: "home.porque.3.texto",
    grupo: "homepage",
    nota: "Texto provisório.",
    valor: L(
      "Expor em adegas, hotéis e clubes rompe o elitismo. Quem hoje só olha pode ser quem amanhã compra.",
      "Exhibiting in wineries, hotels and clubs breaks the elitism. Whoever only looks today may be the one who buys tomorrow.",
      "Exponer en bodegas, hoteles y clubes rompe el elitismo. Quien hoy solo mira puede ser quien mañana compre.",
    ),
  },
  {
    chave: "home.citacao",
    grupo: "homepage",
    nota: "Citação central. Frase verificada do art dealer.",
    valor: L(
      "“Para a Galeria CONTAGIARTE, a palavra que define este projeto é, sem dúvida, Disrupção.”",
      "“For Galeria CONTAGIARTE, the word that defines this project is, without doubt, Disruption.”",
      "“Para la Galería CONTAGIARTE, la palabra que define este proyecto es, sin duda, Disrupción.”",
    ),
  },
  {
    chave: "home.citacao.autor",
    grupo: "homepage",
    nota: "Atribuição da citação.",
    valor: L("RUI PEDRO · ART DEALER, CONTAGIARTE"),
  },
  {
    chave: "home.galeria.titulo",
    grupo: "homepage",
    nota: "Bloco sobre a galeria.",
    valor: L("MAIS DO QUE UM ESPAÇO", "MORE THAN A SPACE", "MÁS QUE UN ESPACIO"),
  },
  {
    chave: "home.galeria.texto",
    grupo: "homepage",
    nota: "Bloco sobre a galeria.",
    valor: L(
      "Acompanhamos todo o percurso: da descoberta da obra à escolha da moldura, até à integração no espaço final. Cada etapa é pensada de forma personalizada, em sintonia com quem nos procura.",
      "We accompany the whole journey: from discovering the work to choosing the frame, through to its place in the final space. Every step is tailored to the person who comes to us.",
      "Acompañamos todo el recorrido: del descubrimiento de la obra a la elección del marco, hasta su integración en el espacio final. Cada etapa se piensa de forma personalizada, en sintonía con quien nos busca.",
    ),
  },
  {
    chave: "home.galeria.assinatura",
    grupo: "homepage",
    nota: "Linha por baixo do texto da galeria.",
    valor: L("Rui Pedro & Maria João · Art Dealers"),
  },
  {
    chave: "lugares.intro",
    grupo: "lugares",
    nota: "Frase de abertura da secção Os lugares.",
    valor: L(
      "Procuramos espaços que rompam com o modelo tradicional de expor arte.",
      "We look for spaces that break with the traditional model of showing art.",
      "Buscamos espacios que rompan con el modelo tradicional de exponer arte.",
    ),
  },
  {
    chave: "molduras.etiqueta",
    grupo: "molduras",
    nota: "Etiqueta da secção de molduras.",
    valor: L(
      "PARCERIA MOLDARTPÓVOA",
      "IN PARTNERSHIP WITH MOLDARTPÓVOA",
      "ALIANZA CON MOLDARTPÓVOA",
    ),
  },
  {
    chave: "molduras.texto",
    grupo: "molduras",
    nota: "Descrição do serviço de molduras.",
    valor: L(
      "A moldura certa transforma a presença de uma obra. Vidro museu Tru-Vue®, madeiras naturais selecionadas e alumínio de precisão, com orçamento imediato, recolha, entrega e instalação.",
      "The right frame transforms how a work occupies a room. Tru-Vue® museum glass, selected natural woods and precision aluminium, with an immediate quote, collection, delivery and installation.",
      "El marco adecuado transforma la presencia de una obra. Vidrio museo Tru-Vue®, maderas naturales seleccionadas y aluminio de precisión, con presupuesto inmediato, recogida, entrega e instalación.",
    ),
  },
  {
    chave: "newsletter.titulo",
    grupo: "newsletter",
    nota: "Título do bloco de subscrição.",
    valor: L(
      "SAIBA PRIMEIRO O QUE VAMOS EXPOR.",
      "BE THE FIRST TO KNOW WHAT WE ARE SHOWING.",
      "SEPA PRIMERO QUÉ VAMOS A EXPONER.",
    ),
  },
  {
    chave: "newsletter.texto",
    grupo: "newsletter",
    nota: "Texto do bloco de subscrição.",
    valor: L(
      "Novas exposições, obras que entram na galeria e convites para inaugurações. Uma mensagem por mês, sem mais.",
      "New exhibitions, works arriving at the gallery and invitations to openings. One message a month, no more.",
      "Nuevas exposiciones, obras que llegan a la galería e invitaciones a inauguraciones. Un mensaje al mes, nada más.",
    ),
  },
  {
    chave: "arquivo.nota",
    grupo: "arquivo",
    nota: "Aviso no fim da lista de arquivo.",
    valor: L(
      "Datas e títulos das edições anteriores por confirmar.",
      "Dates and titles of previous editions to be confirmed.",
      "Fechas y títulos de las ediciones anteriores por confirmar.",
    ),
  },
  {
    chave: "privacidade.conteudo",
    grupo: "legal",
    nota: "Rascunho da política de privacidade. CARECE DE REVISÃO JURÍDICA. Aceita {email} e {telefone} como marcadores.",
    valor: PRIVACIDADE,
  },
  {
    chave: "artistas.nota",
    grupo: "artistas",
    nota: "Aviso no fim da lista de artistas.",
    valor: L(
      "A lista cresce sozinha: cada artista novo é uma linha nova.",
      "The list grows on its own: each new artist is a new row.",
      "La lista crece sola: cada nuevo artista es una nueva línea.",
    ),
  },
];

async function semearTextos() {
  for (const t of TEXTOS) {
    await db.insert(textos).values(t).onConflictDoNothing();
  }
  console.log(`· ${TEXTOS.length} textos`);
}

const ARTISTAS = [
  {
    slug: "mario-ferreira",
    nome: "MÁRIO FERREIRA",
    disciplina: "tecnica_mista",
    nota: L(
      "Técnica mista. Ícones populares revisitados.",
      "Mixed media. Popular icons revisited.",
      "Técnica mixta. Iconos populares revisitados.",
    ),
    ordem: 1,
  },
  {
    slug: "ana-betania",
    nome: "ANA+BETÂNIA",
    disciplina: "escultura",
    nota: L(
      "Grés, cerâmica e gesso. Obra construída em camadas.",
      "Stoneware, ceramics and plaster. Work built up in layers.",
      "Gres, cerámica y yeso. Obra construida en capas.",
    ),
    ordem: 2,
  },
  {
    slug: "vanessa-teodoro",
    nome: "VANESSA TEODORO",
    disciplina: "escultura",
    nota: L(
      "Matéria e volume, entre pintura e escultura.",
      "Matter and volume, between painting and sculpture.",
      "Materia y volumen, entre pintura y escultura.",
    ),
    ordem: 3,
  },
  {
    slug: "pant",
    nome: "PANT.",
    disciplina: "colagem",
    nota: L(
      "Camadas, rasgões, ruído e salpicos.",
      "Layers, tears, noise and splatter.",
      "Capas, desgarros, ruido y salpicaduras.",
    ),
    ordem: 4,
  },
];

async function semearArtistas() {
  for (const a of ARTISTAS) {
    await db
      .insert(artistas)
      .values({ ...a, estado: "publicado" })
      .onConflictDoNothing();
  }
  console.log(`· ${ARTISTAS.length} artistas`);
}

const LUGARES = [
  {
    slug: "quanta-terra",
    nome: "QUANTA TERRA",
    localidade: L("Favaios, Alijó"),
    tipo: L("adega e enoturismo", "winery and wine tourism", "bodega y enoturismo"),
    site: "https://www.quantaterra.pt",
    ordem: 1,
  },
  {
    slug: "forte-de-gaia",
    nome: "FORTE DE GAIA",
    localidade: L("Vila Nova de Gaia"),
    tipo: L(
      "Marriott · Autograph Collection",
      "Marriott · Autograph Collection",
      "Marriott · Autograph Collection",
    ),
    site: null,
    ordem: 2,
  },
  {
    slug: "off-padel",
    nome: "OFF PADEL",
    localidade: L("Leça da Palmeira"),
    tipo: L(
      "seis campos e lounge",
      "six courts and lounge",
      "seis pistas y lounge",
    ),
    site: null,
    ordem: 3,
  },
  {
    slug: "cafe-da-praca",
    nome: "CAFÉ DA PRAÇA",
    localidade: L("Matosinhos"),
    tipo: L("centro cultural", "cultural centre", "centro cultural"),
    site: null,
    ordem: 4,
  },
];

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

  const lista = [
    {
      slug: "a-pele-da-terra",
      titulo: L(
        "A PELE DA TERRA",
        "THE SKIN OF THE EARTH",
        "LA PIEL DE LA TIERRA",
      ),
      lugarSlug: "quanta-terra",
      dataInicio: "2026-05-01",
      dataFim: "2026-12-31",
      destaque: true,
      curadoria: "Galeria Contagiarte",
      texto: L(
        "O território como superfície viva, moldada pelo tempo, pela natureza e pela ação humana. Quatro artistas, obras distribuídas entre salas de barricas, cubas centenárias e salas de prova.",
        "The land as a living surface, shaped by time, by nature and by human action. Four artists, with works spread across barrel rooms, century-old tiled vats and tasting rooms.",
        "El territorio como superficie viva, moldeada por el tiempo, la naturaleza y la acción humana. Cuatro artistas, con obras repartidas entre salas de barricas, cubas centenarias y salas de cata.",
      ),
      horario: L(
        "Todos os dias, mediante marcação.",
        "Every day, by appointment.",
        "Todos los días, con cita previa.",
      ),
      reservas: L(
        "Reservas pela Quanta Terra ou directamente connosco.",
        "Book through Quanta Terra or directly with us.",
        "Reservas a través de Quanta Terra o directamente con nosotros.",
      ),
      artistasSlugs: ["vanessa-teodoro", "ana-betania", "mario-ferreira", "pant"],
      ordem: 1,
    },
    {
      slug: "ciclo-arte-e-vinho-4",
      titulo: L(
        "Ciclo Arte e Vinho, 4.ª edição",
        "Art and Wine Cycle, 4th edition",
        "Ciclo Arte y Vino, 4.ª edición",
      ),
      lugarSlug: "quanta-terra",
      dataInicio: "2025-05-01",
      dataFim: "2025-12-31",
      destaque: false,
      curadoria: "Galeria Contagiarte",
      texto: L(
        "Quarta edição do ciclo que junta arte contemporânea e vinho do Douro. Datas e lista de obras por confirmar.",
        "Fourth edition of the cycle bringing together contemporary art and Douro wine. Dates and list of works to be confirmed.",
        "Cuarta edición del ciclo que reúne arte contemporáneo y vino del Duero. Fechas y lista de obras por confirmar.",
      ),
      artistasSlugs: [],
      ordem: 2,
    },
    {
      slug: "mario-ferreira-permanente",
      titulo: L(
        "Mário Ferreira, exposição permanente",
        "Mário Ferreira, permanent exhibition",
        "Mário Ferreira, exposición permanente",
      ),
      lugarSlug: "forte-de-gaia",
      dataInicio: "2024-01-01",
      dataFim: null,
      permanente: true,
      destaque: false,
      curadoria: "Galeria Contagiarte",
      texto: L(
        "Obra de Mário Ferreira instalada em permanência no Hotel Forte de Gaia, da Autograph Collection.",
        "Work by Mário Ferreira permanently installed at Hotel Forte de Gaia, Autograph Collection.",
        "Obra de Mário Ferreira instalada de forma permanente en el Hotel Forte de Gaia, Autograph Collection.",
      ),
      artistasSlugs: ["mario-ferreira"],
      ordem: 3,
    },
    {
      slug: "arte-do-confinamento",
      titulo: L(
        "Arte do Confinamento",
        "Art of the Lockdown",
        "Arte del Confinamiento",
      ),
      lugarSlug: null,
      dataInicio: "2020-04-01",
      dataFim: "2020-12-31",
      destaque: false,
      curadoria: "Projeto Contagiarte",
      texto: L(
        "Projeto nascido em 2020, quando expor deixou de ser possível da forma habitual. Registo em arquivo.",
        "A project born in 2020, when exhibiting in the usual way was no longer possible. Archive record.",
        "Proyecto nacido en 2020, cuando exponer de la forma habitual dejó de ser posible. Registro de archivo.",
      ),
      artistasSlugs: [],
      ordem: 4,
    },
  ];

  for (const e of lista) {
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
  console.log(`· ${lista.length} exposições`);
}

async function semearObras() {
  const mapaArtistas = new Map(
    (await db.select().from(artistas)).map((a) => [a.slug, a.id]),
  );
  const [expo] = await db
    .select()
    .from(exposicoes)
    .where(eq(exposicoes.slug, "a-pele-da-terra"))
    .limit(1);

  // Inventário do catálogo. Dimensões e anos ficam por preencher: os
  // valores do protótipo eram fictícios e não devem entrar em produção.
  const lista = [
    {
      slug: "reminiscencia",
      titulo: L("Reminiscência", "Reminiscence", "Reminiscencia"),
      artista: "ana-betania",
      tecnica: L(
        "grés e pigmentos",
        "stoneware and pigments",
        "gres y pigmentos",
      ),
      destaque: true,
      ordem: 1,
    },
    {
      slug: "wonder-frida",
      titulo: L("Wonder Frida"),
      artista: "mario-ferreira",
      tecnica: L("técnica mista", "mixed media", "técnica mixta"),
      destaque: true,
      ordem: 2,
    },
    {
      slug: "honey-gold",
      titulo: L("Honey Gold"),
      artista: "ana-betania",
      tecnica: L(
        "cerâmica e gesso",
        "ceramics and plaster",
        "cerámica y yeso",
      ),
      destaque: true,
      ordem: 3,
    },
    {
      slug: "censored-hero",
      titulo: L("Censored Hero"),
      artista: "mario-ferreira",
      tecnica: L("técnica mista", "mixed media", "técnica mixta"),
      destaque: true,
      ordem: 4,
    },
    {
      slug: "sem-titulo-pant",
      titulo: L("Sem título", "Untitled", "Sin título"),
      artista: "pant",
      tecnica: L("colagem e spray", "collage and spray", "collage y spray"),
      destaque: true,
      ordem: 5,
    },
  ];

  for (const o of lista) {
    const { artista, ...resto } = o;
    await db
      .insert(obras)
      .values({
        ...resto,
        artistaId: mapaArtistas.get(artista) ?? null,
        exposicaoId: expo?.id ?? null,
        preco: L("Sob consulta", "Price on request", "Precio a consultar"),
        estado: "publicado",
      })
      .onConflictDoNothing();
  }
  console.log(`· ${lista.length} obras`);
}

async function semearSalas() {
  const [expo] = await db
    .select()
    .from(exposicoes)
    .where(eq(exposicoes.slug, "a-pele-da-terra"))
    .limit(1);
  if (!expo) return;

  const lista = [
    {
      slug: "sala-das-barricas",
      nome: L("Sala das barricas", "Barrel room", "Sala de barricas"),
      texto: L(
        "Fotografia da sala por carregar.",
        "Photograph of the room pending.",
        "Fotografía de la sala pendiente.",
      ),
      ordem: 1,
    },
    {
      slug: "cubas-centenarias",
      nome: L("Cubas centenárias", "Century-old vats", "Cubas centenarias"),
      texto: L(
        "Fotografia da sala por carregar.",
        "Photograph of the room pending.",
        "Fotografía de la sala pendiente.",
      ),
      ordem: 2,
    },
    {
      slug: "sala-de-prova",
      nome: L("Sala de prova", "Tasting room", "Sala de cata"),
      texto: L(
        "Fotografia da sala por carregar.",
        "Photograph of the room pending.",
        "Fotografía de la sala pendiente.",
      ),
      ordem: 3,
    },
    {
      slug: "adega-alta",
      nome: L("Adega alta", "Upper winery", "Bodega alta"),
      texto: L(
        "Fotografia da sala por carregar.",
        "Photograph of the room pending.",
        "Fotografía de la sala pendiente.",
      ),
      ordem: 4,
    },
  ];

  for (const s of lista) {
    await db
      .insert(salas)
      .values({ ...s, exposicaoId: expo.id })
      .onConflictDoNothing();
  }
  console.log(`· ${lista.length} salas do percurso`);
}

async function semearMolduras() {
  const lista = [
    {
      slug: "sem-moldura",
      nome: L("Sem moldura", "No frame", "Sin marco"),
      cor: "transparent",
      espessuraMm: 0,
      ordem: 0,
    },
    {
      slug: "madeira-natural",
      nome: L("Madeira natural", "Natural wood", "Madera natural"),
      cor: "#B8935F",
      espessuraMm: 25,
      ordem: 1,
    },
    {
      slug: "preto-fino",
      nome: L("Preto fino", "Slim black", "Negro fino"),
      cor: "#141210",
      espessuraMm: 14,
      ordem: 2,
    },
    {
      slug: "aluminio",
      nome: L("Alumínio", "Aluminium", "Aluminio"),
      cor: "#9EA0A2",
      espessuraMm: 12,
      ordem: 3,
    },
  ];

  for (const m of lista) {
    await db.insert(molduras).values(m).onConflictDoNothing();
  }
  console.log(`· ${lista.length} molduras`);
}

async function semearDescarregaveis() {
  // Os PDFs entram pelo backoffice; aqui ficam só as fichas.
  const lista = [
    {
      slug: "catalogo-25-26",
      etiqueta: L("CATÁLOGO · VOL. 05", "CATALOGUE · VOL. 05", "CATÁLOGO · VOL. 05"),
      nome: L(
        "Catálogo de Arte 25 | 26",
        "Art Catalogue 25 | 26",
        "Catálogo de Arte 25 | 26",
      ),
      descricao: L(
        "PT | EN · 96 páginas · PDF",
        "PT | EN · 96 pages · PDF",
        "PT | EN · 96 páginas · PDF",
      ),
      ordem: 1,
    },
    {
      slug: "dossier-a-pele-da-terra",
      etiqueta: L("EXPOSIÇÃO · 2026", "EXHIBITION · 2026", "EXPOSICIÓN · 2026"),
      nome: L(
        "A Pele da Terra: dossier",
        "The Skin of the Earth: press kit",
        "La Piel de la Tierra: dosier",
      ),
      descricao: L(
        "Texto curatorial, artistas e obras · PDF",
        "Curatorial text, artists and works · PDF",
        "Texto curatorial, artistas y obras · PDF",
      ),
      ordem: 2,
    },
    {
      slug: "flyer-a-pele-da-terra",
      etiqueta: L("VISITAS", "VISITS", "VISITAS"),
      nome: L(
        "Flyer da exposição",
        "Exhibition flyer",
        "Folleto de la exposición",
      ),
      descricao: L(
        "Horários, morada e informação de visita · PDF",
        "Opening hours, address and visitor information · PDF",
        "Horarios, dirección e información de visita · PDF",
      ),
      ordem: 3,
    },
  ];

  for (const d of lista) {
    // Fica em rascunho até o PDF estar carregado, para não haver
    // cartões de descarga que não descarregam nada.
    await db
      .insert(descarregaveis)
      .values({ ...d, estado: "rascunho" })
      .onConflictDoNothing();
  }
  console.log(`· ${lista.length} descarregáveis (em rascunho, faltam os PDFs)`);
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

  const palavraPasse =
    process.env.ADMIN_PASSWORD ?? gerarPalavraPasse();

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
