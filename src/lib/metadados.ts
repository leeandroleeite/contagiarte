import type { Metadata } from "next";
import { env } from "@/lib/env";
import type { ChaveTexto } from "@/lib/i18n/dicionario";
import { caminho, HREFLANG, IDIOMAS, type Idioma } from "@/lib/i18n/config";

type Entrada = {
  idioma: Idioma;
  /** Caminho sem prefixo de idioma, ex. "/obras/wonder-frida". */
  path: string;
  titulo: string;
  descricao?: string;
  tipo?: "website" | "article";
  /** Impede a indexação (rascunhos, staging, páginas de sistema). */
  semIndice?: boolean;
};

/**
 * As páginas fixas que têm cartão de partilha próprio, e a chave do
 * dicionário de onde sai o título.
 *
 * O `/og` não aceita texto livre: quem o pede dá um identificador, e é
 * esta tabela, mais a base de dados, que decidem o que o cartão pode
 * dizer. Sem isto, qualquer pessoa punha a palavra que quisesse debaixo
 * da marca da galeria e partilhava o resultado como se fosse nosso.
 *
 * O início é o único sem chave: o título vem das definições da galeria.
 */
export const PAGINAS_COM_CARTAO = {
  inicio: null,
  obras: "nav.obras",
  artistas: "nav.artistas",
  exposicoes: "nav.exposicoes",
  arquivo: "nav.arquivo",
  lugares: "nav.lugares",
  molduras: "faixa.molduras",
  "a-galeria": "nav.galeria",
  descarregar: "nav.descarregar",
  contactos: "nav.contactos",
  "ver-na-parede": "parede.titulo",
  "a-obra-como-ativo": "nav.ativo",
  privacidade: "privacidade.titulo",
} as const satisfies Record<string, ChaveTexto | null>;

export type PaginaComCartao = keyof typeof PAGINAS_COM_CARTAO;

export function ePaginaComCartao(valor: string): valor is PaginaComCartao {
  return Object.hasOwn(PAGINAS_COM_CARTAO, valor);
}

/**
 * Traduz um caminho canónico no identificador que o `/og` entende,
 * ex. "/obras/wonder-frida" em ["obra", "wonder-frida"]. Um caminho
 * que não esteja previsto não tem cartão composto: devolve nulo, e a
 * página fica com o cartão fixo da galeria.
 */
function identificador(path: string): [string, string] | null {
  if (path === "/") return ["pagina", "inicio"];

  const partes = path.replace(/^\//, "").split("/");
  if (partes.length === 1) {
    return ePaginaComCartao(partes[0]) ? ["pagina", partes[0]] : null;
  }
  if (partes.length > 3) return null;

  const [seccao, slug, resto] = partes;
  if (!slug) return null;
  if (resto && !(seccao === "exposicoes" && resto === "percurso")) return null;

  if (seccao === "obras") return ["obra", slug];
  if (seccao === "artistas") return ["artista", slug];
  if (seccao === "exposicoes") return [resto ? "percurso" : "exposicao", slug];
  return null;
}

/**
 * Metadados de uma página: canónico, alternativos por idioma e cartão
 * de partilha. Todas as páginas públicas passam por aqui, para o
 * Open Graph nunca ficar esquecido numa rota nova.
 */
export function metadados({
  idioma,
  path,
  titulo,
  descricao,
  tipo = "website",
  semIndice = false,
}: Entrada): Metadata {
  const base = env.urlPublico;
  const canonico = `${base}${caminho(idioma, path)}`;

  // O cartão de partilha é composto, não é a fotografia em cru: as
  // imagens do catálogo têm 442px de largura e saíam num recorte
  // desfocado onde devia estar 1200 por 630. O endereço leva só o
  // identificador da página; o texto e a fotografia vão à base de
  // dados do lado de lá.
  const identidade = identificador(path);
  let absoluta = `${base}/og.png`;
  if (identidade) {
    const cartao = new URL("/og", base);
    cartao.searchParams.set(identidade[0], identidade[1]);
    cartao.searchParams.set("lang", idioma);
    absoluta = cartao.toString();
  }

  const alternativos: Record<string, string> = {};
  for (const id of IDIOMAS) {
    alternativos[HREFLANG[id]] = `${base}${caminho(id, path)}`;
  }
  alternativos["x-default"] = `${base}${caminho("pt", path)}`;

  return {
    metadataBase: new URL(base),
    title: titulo,
    description: descricao,
    alternates: { canonical: canonico, languages: alternativos },
    robots:
      semIndice || env.ambiente === "staging"
        ? { index: false, follow: false }
        : { index: true, follow: true },
    openGraph: {
      type: tipo,
      title: titulo,
      description: descricao,
      url: canonico,
      siteName: "Galeria Contagiarte",
      locale: HREFLANG[idioma],
      images: [{ url: absoluta, width: 1200, height: 630, alt: titulo }],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descricao,
      images: [absoluta],
    },
  };
}

/** Sufixo de título comum a todas as páginas interiores. */
export function comMarca(titulo: string): string {
  return `${titulo} · Galeria Contagiarte`;
}
