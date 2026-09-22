import { headers } from "next/headers";
import type { Definicoes } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { caminho, type Idioma } from "@/lib/i18n/config";
import { CABECALHO_NONCE } from "@/lib/politica-seguranca";

/**
 * O que o site declara a quem o lê por máquina.
 *
 * As fichas de obra, artista e exposição já se identificavam. As
 * páginas principais não diziam nada: nem que isto é uma galeria, nem
 * onde fica, nem como se fala com ela. É informação que existe e que
 * estava a ser guardada só para olhos humanos.
 */

/**
 * Desenha o bloco. Um só sítio a saber a etiqueta e o formato.
 *
 * O `<` vai escapado, e não é zelo a mais: o `JSON.stringify` não
 * escapa `</script>`, por isso um título escrito no backoffice com
 * essa sequência lá dentro fechava a etiqueta e o que viesse a seguir
 * corria como código na página. O backoffice pede sessão, mas quem
 * escreve os títulos não tem de ser quem manda no servidor.
 *
 * O nonce vem do `proxy.ts`, que o gerou para este pedido. Sem ele o
 * browser recusa o bloco: para a política de segurança um `<script>`
 * é um `<script>`, mesmo quando lá dentro só há dados, e o que os
 * motores de busca recebiam era uma página sem ficha nenhuma.
 */
export async function DadosEstruturados({ dados }: { dados: object }) {
  const nonce = (await headers()).get(CABECALHO_NONCE) ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: comoJson(dados) }}
    />
  );
}

/** JSON seguro para ir dentro de um `<script>`. */
export function comoJson(dados: object): string {
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}

/** A galeria em si: quem é, onde está, como se fala com ela. */
export function galeria(def: Definicoes, idioma: Idioma) {
  const base = env.urlPublico;
  const redes = [
    def.instagram ? `https://instagram.com/${def.instagram}` : null,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "ArtGallery",
    "@id": `${base}/#galeria`,
    name: "Galeria Contagiarte",
    url: `${base}${caminho(idioma, "/")}`,
    email: def.email,
    telephone: def.telefone,
    address: {
      "@type": "PostalAddress",
      addressLocality: def.morada,
      addressCountry: "PT",
    },
    ...(redes.length ? { sameAs: redes } : {}),
    ...(def.responsavel
      ? { employee: { "@type": "Person", name: def.responsavel } }
      : {}),
  };
}

/** O site, para a caixa de pesquisa e o nome nos resultados. */
export function sitio(idioma: Idioma) {
  const base = env.urlPublico;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#sitio`,
    name: "Galeria Contagiarte",
    url: `${base}${caminho(idioma, "/")}`,
    inLanguage: idioma,
  };
}

/** Migalhas, para os resultados mostrarem o caminho e não o endereço. */
export function migalhas(
  idioma: Idioma,
  degraus: Array<{ nome: string; path: string }>,
) {
  const base = env.urlPublico;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: degraus.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: d.nome,
      item: `${base}${caminho(idioma, d.path)}`,
    })),
  };
}

/** Uma lista de páginas, para a ordem em que a galeria as mostra contar. */
export function lista(
  idioma: Idioma,
  nome: string,
  itens: Array<{ nome: string; path: string }>,
) {
  const base = env.urlPublico;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: nome,
    numberOfItems: itens.length,
    itemListElement: itens.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.nome,
      url: `${base}${caminho(idioma, it.path)}`,
    })),
  };
}
