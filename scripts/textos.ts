import type { Localizado } from "../src/lib/db/schema";
import { L } from "./conteudo";
import { PRIVACIDADE } from "./textos-legais";

/**
 * Textos fixos do site, editáveis no backoffice sem passar por deploy.
 * Todos vêm do handoff de design; os que o design marcava como
 * provisórios estão assinalados na `nota`.
 */
export const TEXTOS: Array<{
  chave: string;
  grupo: string;
  nota: string;
  valor: Localizado;
}> = [
  // --- Homepage ----------------------------------------------------
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
    nota: "Linha curta no fundo do herói.",
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
    nota: "PROVISÓRIO: texto escrito durante o design, à espera do documento do cliente.",
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
    nota: "PROVISÓRIO.",
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
    nota: "PROVISÓRIO. Liga à página A obra como ativo.",
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
    valor: L(
      "ARTE FORA DO NICHO",
      "ART BEYOND THE NICHE",
      "ARTE FUERA DEL NICHO",
    ),
  },
  {
    chave: "home.porque.3.texto",
    grupo: "homepage",
    nota: "PROVISÓRIO.",
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
    valor: L(
      "MAIS DO QUE UM ESPAÇO",
      "MORE THAN A SPACE",
      "MÁS QUE UN ESPACIO",
    ),
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

  // --- Lugares, molduras, newsletter, listas -----------------------
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
    chave: "molduras.descricao",
    grupo: "molduras",
    nota: "Descrição da página nos motores de busca e nos cartões de partilha.",
    valor: L(
      "Molduras à medida com a MOLDARTPÓVOA: vidro museu Tru-Vue®, madeiras naturais e alumínio de precisão, com recolha, entrega e instalação.",
      "Bespoke framing with MOLDARTPÓVOA: Tru-Vue® museum glass, natural woods and precision aluminium, with collection, delivery and installation.",
      "Marcos a medida con MOLDARTPÓVOA: vidrio museo Tru-Vue®, maderas naturales y aluminio de precisión, con recogida, entrega e instalación.",
    ),
  },
  {
    chave: "molduras.imagem.alt",
    grupo: "molduras",
    nota: "Alternativa da fotografia, para quem não a vê. Descrever o que lá está.",
    valor: L(
      "Moldura produzida em parceria com a MOLDARTPÓVOA",
      "Frame made in partnership with MOLDARTPÓVOA",
      "Marco producido en alianza con MOLDARTPÓVOA",
    ),
  },
  {
    chave: "molduras.imagem.legenda",
    grupo: "molduras",
    nota: "Texto do marcador enquanto não houver fotografia carregada.",
    valor: L("Molduras MOLDARTPÓVOA"),
  },
  {
    chave: "molduras.whatsapp",
    grupo: "molduras",
    nota: "Mensagem já escrita quando o visitante abre o WhatsApp daqui.",
    valor: L(
      "Olá, queria um orçamento de moldura.",
      "Hello, I would like a quote for framing.",
      "Hola, quería un presupuesto de marco.",
    ),
  },
  {
    chave: "molduras.passo1.titulo",
    grupo: "molduras",
    nota: "Passo 1 do processo. O número vem à frente no desenho.",
    valor: L("01 · MEDIR", "01 · MEASURE", "01 · MEDIR"),
  },
  {
    chave: "molduras.passo1.texto",
    grupo: "molduras",
    nota: "O que acontece no passo 1.",
    valor: L(
      "Diz-nos as medidas da obra, ou levantamo-la em sua casa.",
      "Tell us the dimensions, or we collect the work from you.",
      "Díganos las medidas, o recogemos la obra en su casa.",
    ),
  },
  {
    chave: "molduras.passo2.titulo",
    grupo: "molduras",
    nota: "Passo 2 do processo. O número vem à frente no desenho.",
    valor: L("02 · ESCOLHER", "02 · CHOOSE", "02 · ELEGIR"),
  },
  {
    chave: "molduras.passo2.texto",
    grupo: "molduras",
    nota: "O que acontece no passo 2.",
    valor: L(
      "Vê madeiras, alumínios e vidros, com orçamento na hora.",
      "See woods, aluminium and glass, with a quote on the spot.",
      "Vea maderas, aluminios y vidrios, con presupuesto al momento.",
    ),
  },
  {
    chave: "molduras.passo3.titulo",
    grupo: "molduras",
    nota: "Passo 3 do processo. O número vem à frente no desenho.",
    valor: L("03 · PRODUZIR", "03 · MAKE", "03 · PRODUCIR"),
  },
  {
    chave: "molduras.passo3.texto",
    grupo: "molduras",
    nota: "O que acontece no passo 3.",
    valor: L(
      "A MOLDARTPÓVOA produz a moldura à medida na fábrica.",
      "MOLDARTPÓVOA makes the frame to measure at the factory.",
      "MOLDARTPÓVOA produce el marco a medida en fábrica.",
    ),
  },
  {
    chave: "molduras.passo4.titulo",
    grupo: "molduras",
    nota: "Passo 4 do processo. O número vem à frente no desenho.",
    valor: L("04 · INSTALAR", "04 · INSTALL", "04 · INSTALAR"),
  },
  {
    chave: "molduras.passo4.texto",
    grupo: "molduras",
    nota: "O que acontece no passo 4.",
    valor: L(
      "Entregamos e deixamos a obra pendurada no sítio certo.",
      "We deliver and hang the work in the right place.",
      "Entregamos y dejamos la obra colgada en el sitio adecuado.",
    ),
  },
  {
    chave: "contactos.descricao",
    grupo: "contactos",
    nota: "Descrição da página nos motores de busca e nos cartões de partilha.",
    valor: L(
      "Fale com a Galeria Contagiarte por WhatsApp, email ou telefone.",
      "Reach Galeria Contagiarte on WhatsApp, by email or by phone.",
      "Contacte con la Galería Contagiarte por WhatsApp, email o teléfono.",
    ),
  },
  {
    chave: "contactos.intro",
    grupo: "contactos",
    nota: "Frase de abertura, ao lado dos contactos.",
    valor: L(
      "O WhatsApp é o caminho mais rápido. Respondemos todos os dias.",
      "WhatsApp is the fastest route. We answer every day.",
      "WhatsApp es la vía más rápida. Respondemos todos los días.",
    ),
  },
  {
    chave: "contactos.whatsapp.visita",
    grupo: "contactos",
    nota: "Mensagem já escrita no botão de marcar visita.",
    valor: L(
      "Olá, queria marcar uma visita à galeria.",
      "Hello, I would like to book a visit to the gallery.",
      "Hola, quería concertar una visita a la galería.",
    ),
  },
  {
    chave: "whatsapp.site",
    grupo: "geral",
    nota: "Mensagem já escrita nos botões de WhatsApp que não são de um assunto em particular: o botão flutuante, o rodapé e a página de contactos.",
    valor: L(
      "Olá, venho do site da Galeria Contagiarte.",
      "Hello, I came from the Galeria Contagiarte website.",
      "Hola, vengo del sitio de la Galería Contagiarte.",
    ),
  },
  {
    chave: "newsletter.etiqueta",
    grupo: "newsletter",
    nota: "Etiqueta por cima do bloco de subscrição, na entrada e nos contactos.",
    valor: L("NEWSLETTER"),
  },
  {
    chave: "home.destaque.alt",
    grupo: "homepage",
    nota: "Alternativa da fotografia do herói quando há exposição em curso. Aceita {obra} como marcador, que é substituído pelo título da exposição.",
    valor: L(
      "{obra}, exposição em curso",
      "{obra}, exhibition on show",
      "{obra}, exposición en curso",
    ),
  },
  {
    chave: "home.destaque.alt.sem",
    grupo: "homepage",
    nota: "Alternativa da fotografia do herói quando não há exposição em curso.",
    valor: L(
      "Obra em destaque da Galeria Contagiarte",
      "Featured work at Galeria Contagiarte",
      "Obra destacada de la Galería Contagiarte",
    ),
  },
  {
    chave: "home.destaque.legenda",
    grupo: "homepage",
    nota: "Texto do marcador do herói enquanto não houver fotografia carregada.",
    valor: L("Obra em destaque", "Featured work", "Obra destacada"),
  },
  {
    chave: "home.galeria.imagem.alt",
    grupo: "homepage",
    nota: "Alternativa do retrato na secção A galeria.",
    valor: L(
      "Rui Pedro e Maria João, art dealers da Galeria Contagiarte",
      "Rui Pedro and Maria João, art dealers at Galeria Contagiarte",
      "Rui Pedro y Maria João, art dealers de la Galería Contagiarte",
    ),
  },
  {
    chave: "home.galeria.imagem.legenda",
    grupo: "homepage",
    nota: "Texto do marcador da secção A galeria enquanto não houver retrato.",
    valor: L("Rui Pedro & Maria João, art dealers"),
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
    chave: "artistas.nota",
    grupo: "artistas",
    nota: "Aviso no fim da lista de artistas.",
    valor: L(
      "A lista cresce sozinha: cada artista novo é uma linha nova.",
      "The list grows on its own: each new artist is a new row.",
      "La lista crece sola: cada nuevo artista es una nueva línea.",
    ),
  },

  // --- Percurso da adega -------------------------------------------
  {
    chave: "percurso.titulo",
    grupo: "percurso",
    nota: "Título da página do percurso.",
    valor: L(
      "O PERCURSO DA ADEGA",
      "THE WINERY ROUTE",
      "EL RECORRIDO DE LA BODEGA",
    ),
  },
  {
    chave: "percurso.intro",
    grupo: "percurso",
    nota: "Texto de abertura, antes do percurso começar.",
    valor: L(
      "As obras distribuem-se pelos vários espaços da adega, criando um percurso sensorial em que arte e vinho partilham o mesmo tempo de contemplação. Desça para atravessar.",
      "The works are spread across the winery, creating a sensory route in which art and wine share the same time of contemplation. Scroll down to walk through.",
      "Las obras se distribuyen por los distintos espacios de la bodega, creando un recorrido sensorial en el que arte y vino comparten el mismo tiempo de contemplación. Baje para recorrerlo.",
    ),
  },
  {
    chave: "percurso.fim.titulo",
    grupo: "percurso",
    nota: "Bloco final do percurso.",
    valor: L("VENHA VER AO VIVO", "COME AND SEE IT", "VENGA A VERLO EN VIVO"),
  },
  {
    chave: "percurso.fim.texto",
    grupo: "percurso",
    nota: "Bloco final do percurso.",
    valor: L(
      "A visita inclui acesso à adega, às obras da exposição e uma prova de vinhos. De quarta a domingo, das 9h30 às 18h00; nos restantes dias, mediante pedido.",
      "The visit includes access to the winery, to the works on show and a wine tasting. Wednesday to Sunday, 9.30am to 6pm; on other days, by request.",
      "La visita incluye acceso a la bodega, a las obras de la exposición y una cata de vinos. De miércoles a domingo, de 9:30 a 18:00; el resto de días, previa solicitud.",
    ),
  },

  // --- A obra como ativo -------------------------------------------
  {
    chave: "ativo.etiqueta",
    grupo: "ativo",
    nota: "Etiqueta do herói.",
    valor: L(
      "COMPRAR ARTE COM A CABEÇA",
      "BUYING ART WITH YOUR HEAD",
      "COMPRAR ARTE CON LA CABEZA",
    ),
  },
  {
    chave: "ativo.intro",
    grupo: "ativo",
    nota: "Parágrafo de abertura.",
    valor: L(
      "Compramos uma obra porque nos prende. Mas quando escolhemos os artistas que representamos, olhamos também para o que sustenta o valor de uma peça ao longo do tempo. Esta página explica o que avaliamos, e o que não podemos prometer.",
      "We buy a work because it holds us. But when we choose the artists we represent, we also look at what sustains the value of a piece over time. This page explains what we assess, and what we cannot promise.",
      "Compramos una obra porque nos atrapa. Pero cuando elegimos a los artistas que representamos, miramos también lo que sostiene el valor de una pieza a lo largo del tiempo. Esta página explica lo que evaluamos, y lo que no podemos prometer.",
    ),
  },
  {
    chave: "ativo.criterios.titulo",
    grupo: "ativo",
    nota: "Título da secção dos critérios.",
    valor: L(
      "O QUE SUSTENTA O VALOR",
      "WHAT SUSTAINS VALUE",
      "LO QUE SOSTIENE EL VALOR",
    ),
  },
  {
    chave: "ativo.criterio.1.titulo",
    grupo: "ativo",
    nota: "Critério 01.",
    valor: L(
      "Percurso do artista",
      "The artist's track record",
      "Trayectoria del artista",
    ),
  },
  {
    chave: "ativo.criterio.1.texto",
    grupo: "ativo",
    nota: "Critério 01.",
    valor: L(
      "Exposições individuais, presença em colectivas com nomes consolidados, continuidade de produção. Um artista que expõe todos os anos constrói mercado; um que desaparece cinco anos, não.",
      "Solo exhibitions, presence in group shows alongside established names, continuity of output. An artist who exhibits every year builds a market; one who disappears for five years does not.",
      "Exposiciones individuales, presencia en colectivas con nombres consolidados, continuidad de producción. Un artista que expone todos los años construye mercado; uno que desaparece cinco años, no.",
    ),
  },
  {
    chave: "ativo.criterio.2.titulo",
    grupo: "ativo",
    nota: "Critério 02.",
    valor: L(
      "Onde a obra já esteve",
      "Where the work has been",
      "Dónde ha estado la obra",
    ),
  },
  {
    chave: "ativo.criterio.2.texto",
    grupo: "ativo",
    nota: "Critério 02.",
    valor: L(
      "Colecções privadas reconhecidas, instituições, espaços com público. Cada lugar por onde uma obra passa fica no seu historial e conta na avaliação seguinte.",
      "Recognised private collections, institutions, spaces with an audience. Every place a work passes through stays in its history and counts in the next valuation.",
      "Colecciones privadas reconocidas, instituciones, espacios con público. Cada lugar por donde pasa una obra queda en su historial y cuenta en la siguiente valoración.",
    ),
  },
  {
    chave: "ativo.criterio.3.titulo",
    grupo: "ativo",
    nota: "Critério 03.",
    valor: L(
      "Escassez e coerência",
      "Scarcity and coherence",
      "Escasez y coherencia",
    ),
  },
  {
    chave: "ativo.criterio.3.texto",
    grupo: "ativo",
    nota: "Critério 03.",
    valor: L(
      "Obra única ou série curta, dentro de um corpo de trabalho reconhecível. Produção sem limite dilui o valor de tudo o que já foi vendido.",
      "A unique work or short series, within a recognisable body of work. Unlimited output dilutes the value of everything already sold.",
      "Obra única o serie corta, dentro de un cuerpo de trabajo reconocible. La producción sin límite diluye el valor de todo lo ya vendido.",
    ),
  },
  {
    chave: "ativo.criterio.4.titulo",
    grupo: "ativo",
    nota: "Critério 04.",
    valor: L(
      "Estado e conservação",
      "Condition and conservation",
      "Estado y conservación",
    ),
  },
  {
    chave: "ativo.criterio.4.texto",
    grupo: "ativo",
    nota: "Critério 04.",
    valor: L(
      "Suporte estável, montagem correcta, vidro que filtra ultravioletas. A moldura certa não é acabamento: é o que mantém a peça vendável daqui a vinte anos.",
      "A stable support, correct mounting, glass that filters ultraviolet. The right frame is not a finishing touch: it is what keeps the piece sellable twenty years from now.",
      "Soporte estable, montaje correcto, vidrio que filtra ultravioletas. El marco adecuado no es acabado: es lo que mantiene la pieza vendible dentro de veinte años.",
    ),
  },
  {
    chave: "ativo.grafico.titulo",
    grupo: "ativo",
    nota: "Título da secção do gráfico.",
    valor: L(
      "O PERCURSO DE UM ARTISTA",
      "AN ARTIST'S TRAJECTORY",
      "LA TRAYECTORIA DE UN ARTISTA",
    ),
  },
  {
    chave: "ativo.grafico.aviso",
    grupo: "ativo",
    nota: "IMPORTANTE: o gráfico é ilustrativo. Não retirar este aviso enquanto não houver dados reais.",
    valor: L(
      "O gráfico abaixo mostra a forma típica de uma carreira que se consolida: subidas ligadas a acontecimentos concretos, não a passagem do tempo. Os valores são ilustrativos e serão substituídos por dados reais dos artistas que representamos.",
      "The chart below shows the typical shape of a career that consolidates: rises tied to concrete events, not to the passing of time. The values are illustrative and will be replaced by real data from the artists we represent.",
      "El gráfico siguiente muestra la forma típica de una carrera que se consolida: subidas ligadas a acontecimientos concretos, no al paso del tiempo. Los valores son ilustrativos y serán sustituidos por datos reales de los artistas que representamos.",
    ),
  },
  {
    chave: "ativo.marco.1",
    grupo: "ativo",
    nota: "Marco de 2019 no gráfico.",
    valor: L(
      "Primeira individual numa galeria com programa regular. O preço deixa de ser negociado peça a peça.",
      "First solo show at a gallery with a regular programme. The price stops being negotiated piece by piece.",
      "Primera individual en una galería con programa regular. El precio deja de negociarse pieza a pieza.",
    ),
  },
  {
    chave: "ativo.marco.2",
    grupo: "ativo",
    nota: "Marco de 2022 no gráfico.",
    valor: L(
      "Entrada em colecção institucional e presença numa colectiva com nomes consolidados.",
      "Entry into an institutional collection and presence in a group show with established names.",
      "Entrada en colección institucional y presencia en una colectiva con nombres consolidados.",
    ),
  },
  {
    chave: "ativo.marco.3",
    grupo: "ativo",
    nota: "Marco de 2026 no gráfico.",
    valor: L(
      "Obra integrada em circuito com público permanente: hotelaria, enoturismo, espaços culturais.",
      "Work integrated into a circuit with a permanent audience: hotels, wine tourism, cultural spaces.",
      "Obra integrada en circuito con público permanente: hostelería, enoturismo, espacios culturales.",
    ),
  },
  {
    chave: "ativo.promessas.titulo",
    grupo: "ativo",
    nota: "Título do bloco claro.",
    valor: L(
      "O QUE NÃO LHE VAMOS PROMETER",
      "WHAT WE WILL NOT PROMISE YOU",
      "LO QUE NO LE VAMOS A PROMETER",
    ),
  },
  {
    chave: "ativo.promessa.1",
    grupo: "ativo",
    nota: "Primeira coluna do bloco claro.",
    valor: L(
      "Que uma obra vai valorizar. Ninguém sabe. O mercado da arte não tem cotação diária nem garantia, e quem lhe disser o contrário está a vender-lhe outra coisa.",
      "That a work will appreciate. Nobody knows. The art market has no daily quotation and no guarantee, and anyone who tells you otherwise is selling you something else.",
      "Que una obra se revalorizará. Nadie lo sabe. El mercado del arte no tiene cotización diaria ni garantía, y quien le diga lo contrario le está vendiendo otra cosa.",
    ),
  },
  {
    chave: "ativo.promessa.2",
    grupo: "ativo",
    nota: "Segunda coluna do bloco claro.",
    valor: L(
      "Que pode vender quando quiser. A liquidez é baixa: uma peça pode demorar meses a encontrar o comprador certo. Compre com dinheiro que não lhe faz falta amanhã.",
      "That you can sell whenever you want. Liquidity is low: a piece may take months to find the right buyer. Buy with money you will not need tomorrow.",
      "Que puede vender cuando quiera. La liquidez es baja: una pieza puede tardar meses en encontrar al comprador adecuado. Compre con dinero que no le hará falta mañana.",
    ),
  },
  {
    chave: "ativo.promessa.3",
    grupo: "ativo",
    nota: "Terceira coluna do bloco claro.",
    valor: L(
      "Que serve de investimento isolado. Uma obra é um bem de fruição que pode vir a valer mais. Se não gostar dela na parede, nenhum retorno futuro compensa os anos a olhar para ela.",
      "That it works as a standalone investment. A work is something to enjoy that may come to be worth more. If you do not like it on the wall, no future return makes up for the years spent looking at it.",
      "Que sirve como inversión aislada. Una obra es un bien de disfrute que puede llegar a valer más. Si no le gusta en la pared, ningún rendimiento futuro compensa los años mirándola.",
    ),
  },
  {
    chave: "ativo.final.titulo",
    grupo: "ativo",
    nota: "Bloco final da página.",
    valor: L(
      "COMEÇAR PELA OBRA CERTA",
      "STARTING WITH THE RIGHT WORK",
      "EMPEZAR POR LA OBRA ADECUADA",
    ),
  },
  {
    chave: "ativo.final.texto",
    grupo: "ativo",
    nota: "Bloco final da página.",
    valor: L(
      "Diga-nos o que lhe chamou a atenção e o espaço onde a obra vai ficar. Respondemos com o historial do artista, o preço, a moldura adequada e o que sabemos sobre o percurso dele.",
      "Tell us what caught your eye and the space where the work will hang. We reply with the artist's history, the price, the right frame and what we know about their trajectory.",
      "Díganos qué le llamó la atención y el espacio donde irá la obra. Respondemos con el historial del artista, el precio, el marco adecuado y lo que sabemos sobre su trayectoria.",
    ),
  },

  // --- Obra: bloco de serviço --------------------------------------
  {
    chave: "obra.servico.1.titulo",
    grupo: "obra",
    nota: "Bloco claro da ficha de obra.",
    valor: L("MOLDURA À MEDIDA", "BESPOKE FRAMING", "MARCO A MEDIDA"),
  },
  {
    chave: "obra.servico.1.texto",
    grupo: "obra",
    nota: "Bloco claro da ficha de obra.",
    valor: L(
      "Produzida com a MOLDARTPÓVOA: vidro museu Tru-Vue®, madeiras naturais ou alumínio de precisão, escolhidos para esta obra.",
      "Made with MOLDARTPÓVOA: Tru-Vue® museum glass, natural woods or precision aluminium, chosen for this work.",
      "Producido con MOLDARTPÓVOA: vidrio museo Tru-Vue®, maderas naturales o aluminio de precisión, elegidos para esta obra.",
    ),
  },
  {
    chave: "obra.servico.2.titulo",
    grupo: "obra",
    nota: "Bloco claro da ficha de obra.",
    valor: L(
      "ENTREGA E INSTALAÇÃO",
      "DELIVERY AND INSTALLATION",
      "ENTREGA E INSTALACIÓN",
    ),
  },
  {
    chave: "obra.servico.2.texto",
    grupo: "obra",
    nota: "Bloco claro da ficha de obra.",
    valor: L(
      "Recolha e entrega ao domicílio e colocação profissional na parede, em qualquer ponto do país.",
      "Collection and home delivery, with professional hanging, anywhere in the country.",
      "Recogida y entrega a domicilio y colocación profesional en la pared, en cualquier punto del país.",
    ),
  },
  {
    chave: "obra.servico.3.titulo",
    grupo: "obra",
    nota: "Bloco claro da ficha de obra.",
    valor: L("VER AO VIVO", "SEE IT IN PERSON", "VER EN VIVO"),
  },
  {
    chave: "obra.servico.3.texto",
    grupo: "obra",
    nota: "Bloco claro da ficha de obra.",
    valor: L(
      "A obra pode ser vista na exposição, no showroom ou levada a sua casa para experiência antes da decisão.",
      "The work can be seen at the exhibition, in the showroom, or taken to your home to try before you decide.",
      "La obra puede verse en la exposición, en el showroom o llevarse a su casa para probarla antes de decidir.",
    ),
  },
  {
    chave: "obra.nota.servico",
    grupo: "obra",
    nota: "Linha por baixo dos botões de contacto da obra.",
    valor: L(
      "Inclui aconselhamento de moldura, entrega e instalação.",
      "Includes framing advice, delivery and installation.",
      "Incluye asesoramiento de marco, entrega e instalación.",
    ),
  },

  // --- 404 ----------------------------------------------------------
  {
    chave: "404.titulo",
    grupo: "sistema",
    nota: "Título da página de erro 404.",
    valor: L(
      "ESTA OBRA JÁ NÃO ESTÁ AQUI.",
      "THIS WORK IS NO LONGER HERE.",
      "ESTA OBRA YA NO ESTÁ AQUÍ.",
    ),
  },
  {
    chave: "404.texto",
    grupo: "sistema",
    nota: "Texto da página de erro 404.",
    valor: L(
      "A página que procurava foi movida ou nunca existiu. Aconteceu-nos o mesmo com uma peça que vendemos numa quinta-feira à tarde.",
      "The page you were looking for has moved or never existed. The same happened to us with a piece we sold on a Thursday afternoon.",
      "La página que buscaba fue movida o nunca existió. Nos pasó lo mismo con una pieza que vendimos un jueves por la tarde.",
    ),
  },

  // --- Legal --------------------------------------------------------
  {
    chave: "privacidade.conteudo",
    grupo: "legal",
    nota: "Rascunho da política de privacidade. CARECE DE REVISÃO JURÍDICA. Aceita {email} e {telefone} como marcadores.",
    valor: PRIVACIDADE,
  },
];

// --------------------------------------------------------------------
// Descarregáveis
// --------------------------------------------------------------------

export const DESCARREGAVEIS = [
  {
    slug: "catalogo-25-26",
    etiqueta: L(
      "CATÁLOGO · VOL. 05",
      "CATALOGUE · VOL. 05",
      "CATÁLOGO · VOL. 05",
    ),
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
