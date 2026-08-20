import type { Localizado } from "../src/lib/db/schema";

/**
 * Conteúdo vindo do handoff de design, transcrito para a base de dados.
 *
 * O português é o original. As traduções EN e ES existem onde o
 * `traducoes.js` do protótipo já as trazia; o resto fica por traduzir
 * no backoffice, e entretanto o site mostra o português.
 *
 * Os travessões do original foram substituídos por vírgulas ou dois
 * pontos, por convenção do projecto.
 */

export const L = (pt: string, en?: string, es?: string): Localizado => ({
  pt,
  en: en ?? null,
  es: es ?? null,
});

// --------------------------------------------------------------------
// Artistas
// --------------------------------------------------------------------

export const ARTISTAS = [
  {
    slug: "mario-ferreira",
    nome: "Mário Ferreira",
    disciplina: "tecnica_mista",
    naturalidade: "Porto",
    ordem: 1,
    etiqueta: L("ARTISTA · PORTO", "ARTIST · PORTO", "ARTISTA · OPORTO"),
    nota: L(
      "Técnica mista. Ícones populares revisitados.",
      "Mixed media. Popular icons revisited.",
      "Técnica mixta. Iconos populares revisitados.",
    ),
    biografia: L(
      "Artista plástico portuense. Trabalha ícones populares em técnica mista, entre a pintura e a colagem. Tem exposição permanente no Hotel Forte de Gaia e integra A Pele da Terra, no Douro.",
      "Visual artist from Porto. He works popular icons in mixed media, between painting and collage. He has a permanent exhibition at Hotel Forte de Gaia and takes part in The Skin of the Earth, in the Douro.",
      "Artista plástico de Oporto. Trabaja iconos populares en técnica mixta, entre la pintura y el collage. Tiene exposición permanente en el Hotel Forte de Gaia e integra La Piel de la Tierra, en el Duero.",
    ),
    citacao: L(
      "“Há neste território uma força silenciosa, feita de memória, trabalho e beleza natural, que inevitavelmente dialoga com quem aqui cria e apresenta a sua obra.”",
      "“There is a silent force in this land, made of memory, labour and natural beauty, that inevitably speaks to anyone who creates and shows work here.”",
      "“Hay en este territorio una fuerza silenciosa, hecha de memoria, trabajo y belleza natural, que inevitablemente dialoga con quien aquí crea y presenta su obra.”",
    ),
    citacaoFonte: "MÁRIO FERREIRA, SOBRE EXPOR NO DOURO",
  },
  {
    slug: "ana-betania",
    nome: "Ana+Betânia",
    disciplina: "escultura",
    naturalidade: null,
    ordem: 2,
    etiqueta: L("ARTISTAS · DUPLA", "ARTISTS · DUO", "ARTISTAS · DÚO"),
    nota: L(
      "Grés, cerâmica e gesso. Obra construída em camadas.",
      "Stoneware, ceramics and plaster. Work built up in layers.",
      "Gres, cerámica y yeso. Obra construida en capas.",
    ),
    biografia: L(
      "Trabalham grés, cerâmica, gesso e pigmentos. A obra afirma-se como matéria viva, construída em camadas, volumes e gestos tridimensionais, no espaço entre a pintura, a escultura e a instalação.",
      "They work with stoneware, ceramics, plaster and pigments. The work asserts itself as living matter, built up in layers, volumes and three-dimensional gestures, in the space between painting, sculpture and installation.",
      "Trabajan gres, cerámica, yeso y pigmentos. La obra se afirma como materia viva, construida en capas, volúmenes y gestos tridimensionales, en el espacio entre la pintura, la escultura y la instalación.",
    ),
    citacao: L(
      "“Em vez das paredes brancas e assépticas de um espaço expositivo convencional, as nossas obras irão dialogar com cubas, tonéis, cheiros, temperaturas e silêncios.”",
      "“Instead of the white, aseptic walls of a conventional exhibition space, our works will speak with vats, casks, smells, temperatures and silences.”",
      "“En lugar de las paredes blancas y asépticas de un espacio expositivo convencional, nuestras obras dialogarán con cubas, toneles, olores, temperaturas y silencios.”",
    ),
    citacaoFonte: "ANA+BETÂNIA, SOBRE EXPOR NA QUANTA TERRA",
  },
  {
    slug: "vanessa-teodoro",
    nome: "Vanessa Teodoro",
    disciplina: "escultura",
    naturalidade: null,
    ordem: 3,
    etiqueta: L("ARTISTA · CONVIDADA", "ARTIST · GUEST", "ARTISTA · INVITADA"),
    nota: L(
      "Matéria e volume, entre pintura e escultura.",
      "Matter and volume, between painting and sculpture.",
      "Materia y volumen, entre pintura y escultura.",
    ),
    biografia: L(
      "Prática assente na matéria e no volume, no espaço entre a pintura e a escultura. Integra A Pele da Terra, na Quanta Terra, a convite da Galeria Contagiarte.",
      "A practice grounded in matter and volume, in the space between painting and sculpture. She takes part in The Skin of the Earth, at Quanta Terra, at the invitation of Galeria Contagiarte.",
      "Práctica asentada en la materia y el volumen, en el espacio entre la pintura y la escultura. Integra La Piel de la Tierra, en Quanta Terra, por invitación de la Galería Contagiarte.",
    ),
    citacao: L(
      "“Barro, cerâmica, grés, madeira, gesso, pigmentos e técnicas mistas afirmam-se como matéria primordial.”",
      "“Clay, ceramics, stoneware, wood, plaster, pigments and mixed media assert themselves as primordial matter.”",
      "“Barro, cerámica, gres, madera, yeso, pigmentos y técnicas mixtas se afirman como materia primordial.”",
    ),
    citacaoFonte: "TEXTO CURATORIAL · A PELE DA TERRA",
  },
  {
    slug: "pant",
    nome: "Pant.",
    disciplina: "colagem",
    naturalidade: null,
    ordem: 4,
    etiqueta: L(
      "ARTISTA · LINGUAGEM URBANA",
      "ARTIST · URBAN LANGUAGE",
      "ARTISTA · LENGUAJE URBANO",
    ),
    nota: L(
      "Camadas, rasgões, ruído e salpicos.",
      "Layers, tears, noise and splatter.",
      "Capas, desgarros, ruido y salpicaduras.",
    ),
    biografia: L(
      "Linguagem assumida e orgulhosamente urbana, feita de camadas, rasgões, ruído e salpicos. O resultado final chega por sobreposição, num processo onde se cruzam gesto espontâneo, intenção e tempo.",
      "A proudly, openly urban language, made of layers, tears, noise and splatter. The final result arrives by overlay, in a process where spontaneous gesture, intention and time cross paths.",
      "Lenguaje asumido y orgullosamente urbano, hecho de capas, desgarros, ruido y salpicaduras. El resultado final llega por superposición, en un proceso donde se cruzan gesto espontáneo, intención y tiempo.",
    ),
    citacao: L(
      "“Participar nesta exposição é também aceitar um deslocamento: retirar a obra do seu habitat mais previsível e colocá-la num espaço onde o público não a procura necessariamente.”",
      "“Taking part in this exhibition also means accepting a displacement: taking the work out of its most predictable habitat and placing it somewhere the public is not necessarily looking for it.”",
      "“Participar en esta exposición es también aceptar un desplazamiento: sacar la obra de su hábitat más previsible y colocarla en un espacio donde el público no la busca necesariamente.”",
    ),
    citacaoFonte: "PANT., SOBRE EXPOR NUMA ADEGA",
  },
];

// --------------------------------------------------------------------
// Lugares
// --------------------------------------------------------------------

export const LUGARES = [
  {
    slug: "quanta-terra",
    nome: "Quanta Terra",
    localidade: L("Favaios, Alijó"),
    tipo: L(
      "adega e enoturismo",
      "winery and wine tourism",
      "bodega y enoturismo",
    ),
    morada: "Rua da Casa do Douro S/N, Favaios, Alijó",
    site: "https://www.quantaterra.pt",
    descricao: L(
      "A antiga destilaria da Casa do Douro, recuperada em 2022. Salas de barricas, cubas centenárias revestidas a azulejo e sala de provas.",
      "The old Casa do Douro distillery, restored in 2022. Barrel rooms, century-old tiled vats and a tasting room.",
      "La antigua destilería de la Casa do Douro, recuperada en 2022. Salas de barricas, cubas centenarias revestidas de azulejo y sala de cata.",
    ),
    ordem: 1,
  },
  {
    slug: "forte-de-gaia",
    nome: "Forte de Gaia",
    localidade: L("Vila Nova de Gaia"),
    tipo: L("Marriott · Autograph Collection"),
    morada: null,
    site: null,
    descricao: L(
      "Hotel da Autograph Collection, com exposição permanente de Mário Ferreira.",
      "Autograph Collection hotel, with a permanent exhibition by Mário Ferreira.",
      "Hotel de Autograph Collection, con exposición permanente de Mário Ferreira.",
    ),
    ordem: 2,
  },
  {
    slug: "off-padel",
    nome: "Off Padel",
    localidade: L("Leça da Palmeira"),
    tipo: L(
      "seis campos e lounge",
      "six courts and lounge",
      "seis pistas y lounge",
    ),
    morada: null,
    site: null,
    descricao: null,
    ordem: 3,
  },
  {
    slug: "cafe-da-praca",
    nome: "Café da Praça",
    localidade: L("Matosinhos"),
    tipo: L("centro cultural", "cultural centre", "centro cultural"),
    morada: null,
    site: null,
    descricao: null,
    ordem: 4,
  },
];

// --------------------------------------------------------------------
// Exposições
// --------------------------------------------------------------------

const TEXTO_PELE_DA_TERRA_PT = [
  "No coração do Douro Vinhateiro, onde a paisagem se desenha em socalcos e camadas moldadas por séculos de trabalho humano e de diálogo com a natureza, nasce A Pele da Terra, uma exposição que procura estabelecer uma relação íntima entre arte contemporânea, território e matéria.",
  "Integrada na Quanta Terra, em Favaios, esta mostra reúne, pela primeira vez, quatro artistas portugueses, Vanessa Teodoro, Ana+Betânia, Mário Ferreira e Pant., convidados pela Galeria Contagiarte, cujas práticas artísticas partilham uma abordagem comum: a exploração da arte enquanto matéria viva, construída em camadas, volumes e gestos tridimensionais.",
  "Mais do que uma exposição convencional, esta proposta assume-se como uma experiência imersiva. As obras distribuem-se pelos vários espaços da adega, entre salas de barricas onde o vinho envelhece lentamente, cubas centenárias revestidas a azulejo e salas de prova, criando um percurso sensorial em que arte e vinho partilham o mesmo tempo de contemplação.",
].join("\n\n");

const TEXTO_PELE_DA_TERRA_EN = [
  "In the heart of the Douro wine region, where the landscape is drawn in terraces and layers shaped by centuries of human work and dialogue with nature, The Skin of the Earth is born, an exhibition that seeks an intimate relationship between contemporary art, territory and matter.",
  "Held at Quanta Terra, in Favaios, this show brings together, for the first time, four Portuguese artists, Vanessa Teodoro, Ana+Betânia, Mário Ferreira and Pant., invited by Galeria Contagiarte, whose practices share a common approach: the exploration of art as living matter, built up in layers, volumes and three-dimensional gestures.",
  "More than a conventional exhibition, this is an immersive experience. The works are spread across the winery: barrel rooms where wine ages slowly, century-old tiled vats and tasting rooms, creating a sensory route in which art and wine share the same time of contemplation.",
].join("\n\n");

const TEXTO_PELE_DA_TERRA_ES = [
  "En el corazón del Duero vitícola, donde el paisaje se dibuja en bancales y capas moldeadas por siglos de trabajo humano y de diálogo con la naturaleza, nace La Piel de la Tierra, una exposición que busca establecer una relación íntima entre arte contemporáneo, territorio y materia.",
  "Integrada en Quanta Terra, en Favaios, esta muestra reúne, por primera vez, a cuatro artistas portugueses, Vanessa Teodoro, Ana+Betânia, Mário Ferreira y Pant., invitados por la Galería Contagiarte, cuyas prácticas artísticas comparten un enfoque común: la exploración del arte como materia viva, construida en capas, volúmenes y gestos tridimensionales.",
  "Más que una exposición convencional, esta propuesta se asume como una experiencia inmersiva. Las obras se distribuyen por los distintos espacios de la bodega, entre salas de barricas donde el vino envejece lentamente, cubas centenarias revestidas de azulejo y salas de cata, creando un recorrido sensorial en el que arte y vino comparten el mismo tiempo de contemplación.",
].join("\n\n");

export const EXPOSICOES = [
  {
    slug: "a-pele-da-terra",
    titulo: L("A Pele da Terra", "The Skin of the Earth", "La Piel de la Tierra"),
    lugarSlug: "quanta-terra",
    dataInicio: "2026-05-01",
    dataFim: "2026-12-31",
    permanente: false,
    destaque: true,
    curadoria: "Rui Pedro e Maria João · Curadores da Galeria Contagiarte",
    texto: L(
      TEXTO_PELE_DA_TERRA_PT,
      TEXTO_PELE_DA_TERRA_EN,
      TEXTO_PELE_DA_TERRA_ES,
    ),
    horario: L(
      "Quarta a domingo, 9h30 às 18h00. Nos restantes dias, mediante pedido.",
      "Wednesday to Sunday, 9.30am to 6pm. On other days, by request.",
      "De miércoles a domingo, de 9:30 a 18:00. El resto de días, previa solicitud.",
    ),
    inclui: L(
      "Acesso à adega, às obras da exposição e prova de vinhos.",
      "Access to the winery, to the works on show and a wine tasting.",
      "Acceso a la bodega, a las obras de la exposición y cata de vinos.",
    ),
    reservas: L("+351 93 590 75 57 · info@quantaterradouro.com"),
    citacao: L(
      "“Vinho e arte partilham a mesma essência: transformar a matéria-prima em algo único e memorável.”",
      "“Wine and art share the same essence: turning raw material into something unique and memorable.”",
      "“El vino y el arte comparten la misma esencia: transformar la materia prima en algo único y memorable.”",
    ),
    citacaoAutor:
      "CELSO PEREIRA & JORGE ALVES · ENÓLOGOS E FUNDADORES DA QUANTA TERRA",
    artistasSlugs: [
      "mario-ferreira",
      "ana-betania",
      "vanessa-teodoro",
      "pant",
    ],
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
    permanente: false,
    destaque: false,
    curadoria: "Galeria Contagiarte",
    texto: L(
      "Quarta edição do ciclo que junta arte contemporânea e vinho do Douro. Datas e lista de obras por confirmar.",
      "Fourth edition of the cycle bringing together contemporary art and Douro wine. Dates and list of works to be confirmed.",
      "Cuarta edición del ciclo que reúne arte contemporáneo y vino del Duero. Fechas y lista de obras por confirmar.",
    ),
    horario: null,
    inclui: null,
    reservas: null,
    citacao: null,
    citacaoAutor: null,
    artistasSlugs: [] as string[],
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
    horario: null,
    inclui: null,
    reservas: null,
    citacao: null,
    citacaoAutor: null,
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
    permanente: false,
    destaque: false,
    curadoria: "Projeto Contagiarte",
    texto: L(
      "Projeto nascido em 2020, quando expor deixou de ser possível da forma habitual. Registo em arquivo.",
      "A project born in 2020, when exhibiting in the usual way was no longer possible. Archive record.",
      "Proyecto nacido en 2020, cuando exponer de la forma habitual dejó de ser posible. Registro de archivo.",
    ),
    horario: null,
    inclui: null,
    reservas: null,
    citacao: null,
    citacaoAutor: null,
    artistasSlugs: [] as string[],
    ordem: 4,
  },
];

// --------------------------------------------------------------------
// Obras
//
// Só entram as obras que o design nomeia. As que o protótipo mostrava
// como "obra por catalogar" ficam de fora: é preferível uma grelha mais
// curta do que registos vazios no site.
// --------------------------------------------------------------------

export const OBRAS = [
  {
    slug: "wonder-frida",
    titulo: L("Wonder Frida"),
    artista: "mario-ferreira",
    tecnica: L(
      "Técnica mista sobre tela",
      "Mixed media on canvas",
      "Técnica mixta sobre lienzo",
    ),
    dimensoes: "100 × 100 cm",
    larguraCm: 100,
    alturaCm: 100,
    ano: 2024,
    exposicao: "a-pele-da-terra",
    destaque: true,
    ordem: 1,
    descricao: L(
      "Da série de ícones populares revisitados pelo artista. Camadas de recorte, tinta e ruído gráfico que se resolvem à distância numa figura reconhecível.",
      "From the artist's series of popular icons revisited. Layers of cut-out, paint and graphic noise that resolve, at a distance, into a recognisable figure.",
      "De la serie de iconos populares revisitados por el artista. Capas de recorte, pintura y ruido gráfico que se resuelven a distancia en una figura reconocible.",
    ),
  },
  {
    slug: "reminiscencia",
    titulo: L("Reminiscência", "Reminiscence", "Reminiscencia"),
    artista: "ana-betania",
    tecnica: L("Grés e pigmentos", "Stoneware and pigments", "Gres y pigmentos"),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: 2025,
    exposicao: "a-pele-da-terra",
    destaque: true,
    ordem: 2,
    descricao: null,
  },
  {
    slug: "honey-gold",
    titulo: L("Honey Gold"),
    artista: "ana-betania",
    tecnica: L(
      "Cerâmica e gesso",
      "Ceramics and plaster",
      "Cerámica y yeso",
    ),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: 2025,
    exposicao: "a-pele-da-terra",
    destaque: true,
    ordem: 3,
    descricao: null,
  },
  {
    slug: "censored-hero",
    titulo: L("Censored Hero"),
    artista: "mario-ferreira",
    tecnica: L("Técnica mista", "Mixed media", "Técnica mixta"),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: 2024,
    exposicao: "a-pele-da-terra",
    destaque: true,
    ordem: 4,
    descricao: null,
  },
  {
    slug: "sem-titulo-pant",
    titulo: L("Sem título", "Untitled", "Sin título"),
    artista: "pant",
    tecnica: L("Colagem e spray", "Collage and spray", "Collage y spray"),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: 2026,
    exposicao: "a-pele-da-terra",
    destaque: true,
    ordem: 5,
    descricao: null,
  },
  {
    slug: "they-put-a-man-on-the-moon",
    titulo: L("They put a man on the moon"),
    artista: "mario-ferreira",
    tecnica: L("Técnica mista", "Mixed media", "Técnica mixta"),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: null,
    exposicao: null,
    destaque: false,
    ordem: 6,
    descricao: null,
  },
  {
    slug: "tonup",
    titulo: L("TonUp"),
    artista: "mario-ferreira",
    tecnica: L("Técnica mista", "Mixed media", "Técnica mixta"),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: null,
    exposicao: null,
    destaque: false,
    ordem: 7,
    descricao: null,
  },
  {
    slug: "spider-li",
    titulo: L("Spider-Li"),
    artista: "mario-ferreira",
    tecnica: L("Técnica mista", "Mixed media", "Técnica mixta"),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: null,
    exposicao: null,
    destaque: false,
    ordem: 8,
    descricao: null,
  },
  {
    slug: "its-a-mens-job",
    titulo: L("It’s a men’s job"),
    artista: "mario-ferreira",
    tecnica: L("Técnica mista", "Mixed media", "Técnica mixta"),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: null,
    exposicao: null,
    destaque: false,
    ordem: 9,
    descricao: null,
  },
  {
    slug: "paraiso-perdido",
    titulo: L("Paraíso Perdido", "Paradise Lost", "Paraíso Perdido"),
    artista: "ana-betania",
    tecnica: L(
      "Cerâmica e gesso",
      "Ceramics and plaster",
      "Cerámica y yeso",
    ),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: null,
    exposicao: null,
    destaque: false,
    ordem: 10,
    descricao: null,
  },
  {
    slug: "egg",
    titulo: L("Egg"),
    artista: "ana-betania",
    tecnica: L(
      "Cerâmica e gesso",
      "Ceramics and plaster",
      "Cerámica y yeso",
    ),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: null,
    exposicao: null,
    destaque: false,
    ordem: 11,
    descricao: null,
  },
  {
    slug: "forever",
    titulo: L("Forever"),
    artista: "ana-betania",
    tecnica: L(
      "Cerâmica e gesso",
      "Ceramics and plaster",
      "Cerámica y yeso",
    ),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: null,
    exposicao: null,
    destaque: false,
    ordem: 12,
    descricao: null,
  },
  {
    slug: "sonhos-molhados",
    titulo: L("Sonhos Molhados", "Wet Dreams", "Sueños Mojados"),
    artista: "ana-betania",
    tecnica: L(
      "Cerâmica e gesso",
      "Ceramics and plaster",
      "Cerámica y yeso",
    ),
    dimensoes: null,
    larguraCm: null,
    alturaCm: null,
    ano: null,
    exposicao: null,
    destaque: false,
    ordem: 13,
    descricao: null,
  },
];

// --------------------------------------------------------------------
// Salas do percurso da adega
// --------------------------------------------------------------------

export const SALAS = [
  {
    slug: "a-chegada",
    nome: L("A chegada", "The arrival", "La llegada"),
    texto: L(
      "A antiga destilaria da Casa do Douro, recuperada em 2022. Antes de qualquer obra, o território: socalcos, xisto e a luz baixa do vale.",
      "The old Casa do Douro distillery, restored in 2022. Before any work of art, the land: terraces, schist and the low light of the valley.",
      "La antigua destilería de la Casa do Douro, recuperada en 2022. Antes de cualquier obra, el territorio: bancales, pizarra y la luz baja del valle.",
    ),
    notaObras: L("Percurso · entrada", "Route · entrance", "Recorrido · entrada"),
    ordem: 1,
  },
  {
    slug: "sala-das-barricas",
    nome: L("Sala das barricas", "Barrel room", "Sala de barricas"),
    texto: L(
      "Onde o vinho envelhece lentamente. As peças partilham o silêncio, a temperatura e o cheiro da madeira: a contemplação passa a ter o mesmo tempo do vinho.",
      "Where the wine ages slowly. The pieces share the silence, the temperature and the smell of the wood: contemplation takes on the same time as the wine.",
      "Donde el vino envejece lentamente. Las piezas comparten el silencio, la temperatura y el olor de la madera: la contemplación pasa a tener el mismo tiempo que el vino.",
    ),
    notaObras: L(
      "Obras de Ana+Betânia e Vanessa Teodoro",
      "Works by Ana+Betânia and Vanessa Teodoro",
      "Obras de Ana+Betânia y Vanessa Teodoro",
    ),
    ordem: 2,
  },
  {
    slug: "cubas-centenarias",
    nome: L("Cubas centenárias", "Century-old vats", "Cubas centenarias"),
    texto: L(
      "Cubas revestidas a azulejo, com um século de uso. A superfície fria e reflectora responde à matéria bruta das obras: barro, gesso, pigmento.",
      "Tiled vats, with a century of use. The cold, reflective surface answers the raw matter of the works: clay, plaster, pigment.",
      "Cubas revestidas de azulejo, con un siglo de uso. La superficie fría y reflectante responde a la materia bruta de las obras: barro, yeso, pigmento.",
    ),
    notaObras: L(
      "Obras concebidas para este espaço",
      "Works conceived for this space",
      "Obras concebidas para este espacio",
    ),
    ordem: 3,
  },
  {
    slug: "sala-de-provas",
    nome: L("Sala de provas", "Tasting room", "Sala de cata"),
    texto: L(
      "O fim do percurso, onde se prova o que a adega produz. Aqui a arte deixa de ser visita e passa a ser conversa.",
      "The end of the route, where you taste what the winery makes. Here art stops being a visit and becomes a conversation.",
      "El final del recorrido, donde se cata lo que la bodega produce. Aquí el arte deja de ser visita y pasa a ser conversación.",
    ),
    notaObras: L(
      "Obras de Mário Ferreira e Pant.",
      "Works by Mário Ferreira and Pant.",
      "Obras de Mário Ferreira y Pant.",
    ),
    ordem: 4,
  },
];

// --------------------------------------------------------------------
// Molduras do simulador
// --------------------------------------------------------------------

export const MOLDURAS = [
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
    cor: "#8A6A46",
    espessuraMm: 14,
    ordem: 1,
  },
  {
    slug: "preto-fino",
    nome: L("Preto fino", "Slim black", "Negro fino"),
    cor: "#141210",
    espessuraMm: 8,
    ordem: 2,
  },
  {
    slug: "aluminio",
    nome: L("Alumínio", "Aluminium", "Aluminio"),
    cor: "#B9BCC0",
    espessuraMm: 6,
    ordem: 3,
  },
];
