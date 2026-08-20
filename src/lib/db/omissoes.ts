import { CONTACTOS_OMISSAO } from "@/lib/env";
import type { Definicoes } from "./schema";

/**
 * Valores de arranque das definições do site. São os contactos reais
 * usados no design; o backoffice sobrepõe-se a estes assim que a
 * galeria os editar.
 */
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
  avisoTopo: null,
};
