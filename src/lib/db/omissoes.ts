import { CONTACTOS_OMISSAO } from "@/lib/env";
import type { Definicoes, Localizado } from "./schema";

/**
 * Valores de arranque das definições do site. São os contactos reais
 * usados no design; o backoffice sobrepõe-se a estes assim que a
 * galeria os editar.
 */
/**
 * A mensagem que os botões de WhatsApp abrem já escrita, antes de a
 * galeria a editar. Vive aqui para o 404 global, que é a única página
 * que não lê a base: todas as outras usam a chave `whatsapp.site`.
 */
export const MENSAGEM_WHATSAPP_OMISSAO =
  "Olá, venho do site da Galeria Contagiarte.";

export const DEFINICOES_OMISSAO: Definicoes = {
  email: CONTACTOS_OMISSAO.email,
  telefone: CONTACTOS_OMISSAO.telefoneFormatado,
  whatsapp: CONTACTOS_OMISSAO.whatsapp,
  instagram: CONTACTOS_OMISSAO.instagram,
  morada: CONTACTOS_OMISSAO.morada,
  responsavel: CONTACTOS_OMISSAO.responsavel,
  parceiros: [...CONTACTOS_OMISSAO.parceiros],
  ogTitulo: {
    pt: "Galeria Contagiarte, For the Next Generation of Art Lovers",
    en: "Galeria Contagiarte, For the Next Generation of Art Lovers",
    es: "Galeria Contagiarte, For the Next Generation of Art Lovers",
  },
  ogDescricao: {
    pt: "Arte contemporânea de artistas nacionais e internacionais, molduras à medida e exposições em lugares que rompem com o modelo tradicional.",
    en: "Contemporary art by Portuguese and international artists, bespoke framing and exhibitions in places that break with the traditional model.",
    es: "Arte contemporáneo de artistas nacionales e internacionales, marcos a medida y exposiciones en lugares que rompen con el modelo tradicional.",
  },
  ogImagemId: null,
  molduraImagemId: null,
  galeriaImagemId: null,
  avisoTopo: null,
  // Zero é o desenho original: as letras fundem-se com a fotografia.
  inversaoHeroi: 0,
};

/**
 * Textos da página da newsletter, enquanto não tiverem linha na tabela
 * `textos`. A semente (`scripts/textos.ts`) lê-os daqui, para a frase
 * só estar escrita num sítio; numa base que já existia, a página usa
 * estes até a linha ser criada, e daí em diante manda o backoffice.
 *
 * Vêm nas três línguas, e não só em português como as omissões soltas
 * da homepage: são páginas inteiras, e uma página inglesa toda escrita
 * em português até alguém semear a base não servia a ninguém.
 */
export const TEXTOS_OMISSAO: Record<string, Localizado> = {
  "newsletter.descricao": {
    pt: "Subscreva a newsletter da Galeria Contagiarte e saiba primeiro das exposições, das obras novas e das inaugurações.",
    en: "Subscribe to the Galeria Contagiarte newsletter and be the first to hear about exhibitions, new works and openings.",
    es: "Suscríbase a la newsletter de la Galería Contagiarte y sepa primero de las exposiciones, las obras nuevas y las inauguraciones.",
  },
  "newsletter.pagina.titulo": {
    pt: "SAIBA ANTES DE TODOS.",
    en: "HEAR IT BEFORE ANYONE.",
    es: "SÉPALO ANTES QUE NADIE.",
  },
  "newsletter.pagina.intro": {
    pt: "As novidades da galeria chegam primeiro a quem subscreve, por email: o que vamos expor, as obras que entram e os convites para as inaugurações.",
    en: "Gallery news reaches subscribers first, by email: what we are about to show, the works coming in and the invitations to openings.",
    es: "Las novedades de la galería llegan primero a quien se suscribe, por email: lo que vamos a exponer, las obras que entran y las invitaciones a las inauguraciones.",
  },
  "newsletter.vantagem.1.titulo": {
    pt: "Exposições novas",
    en: "New exhibitions",
    es: "Exposiciones nuevas",
  },
  "newsletter.vantagem.1.texto": {
    pt: "A data, o lugar e os artistas, antes de a exposição abrir.",
    en: "The date, the place and the artists, before the exhibition opens.",
    es: "La fecha, el lugar y los artistas, antes de que abra la exposición.",
  },
  "newsletter.vantagem.2.titulo": {
    pt: "Obras que entram",
    en: "Works coming in",
    es: "Obras que entran",
  },
  "newsletter.vantagem.2.texto": {
    pt: "As obras que chegam à galeria, com imagem e medidas, assim que chegam.",
    en: "The works arriving at the gallery, with image and dimensions, as soon as they arrive.",
    es: "Las obras que llegan a la galería, con imagen y medidas, en cuanto llegan.",
  },
  "newsletter.vantagem.3.titulo": {
    pt: "Inaugurações",
    en: "Openings",
    es: "Inauguraciones",
  },
  "newsletter.vantagem.3.texto": {
    pt: "O convite para cada inauguração, com tempo para a pôr na agenda.",
    en: "An invitation to each opening, with time to put it in the diary.",
    es: "La invitación a cada inauguración, con tiempo para apuntarla en la agenda.",
  },
  "newsletter.vantagem.4.titulo": {
    pt: "Condições reservadas",
    en: "Subscriber terms",
    es: "Condiciones reservadas",
  },
  "newsletter.vantagem.4.texto": {
    pt: "Campanhas e condições só para subscritores, quando as houver.",
    en: "Campaigns and terms just for subscribers, whenever there are any.",
    es: "Campañas y condiciones solo para suscriptores, cuando las haya.",
  },
  "newsletter.pagina.subscrever": {
    pt: "DEIXE O SEU EMAIL.",
    en: "LEAVE YOUR EMAIL.",
    es: "DEJE SU EMAIL.",
  },
  "newsletter.pagina.nota": {
    pt: "Só pedimos o email, e serve só para a newsletter. Cada mensagem traz no fim um link para cancelar a subscrição.",
    en: "We only ask for your email, and it is used only for the newsletter. Every message ends with a link to unsubscribe.",
    es: "Solo pedimos el email, y sirve solo para la newsletter. Cada mensaje lleva al final un enlace para cancelar la suscripción.",
  },
};
