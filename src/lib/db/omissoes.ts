import { CONTACTOS_OMISSAO } from "@/lib/env";
import type { Definicoes } from "./schema";

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
