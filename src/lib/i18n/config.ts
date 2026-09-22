export const IDIOMAS = ["pt", "en", "es"] as const;
export type Idioma = (typeof IDIOMAS)[number];

/** O português é a língua de origem e vive na raiz, sem prefixo. */
export const IDIOMA_BASE: Idioma = "pt";

export const NOME_IDIOMA: Record<Idioma, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};

/** Etiqueta hreflang completa, para os metadados alternativos. */
export const HREFLANG: Record<Idioma, string> = {
  pt: "pt-PT",
  en: "en",
  es: "es",
};

/**
 * Cabeçalho por onde o idioma viaja do proxy até ao layout de raiz.
 *
 * O `<html lang>` vive acima da rota `[lang]`, num layout que não vê o
 * parâmetro do caminho. Sem isto dizia `pt-PT` em todas as páginas,
 * incluindo as inglesas e as espanholas: o conteúdo estava traduzido e
 * o documento declarava-se português, que é o que os motores de busca
 * lêem e o que decide a fonética de um leitor de ecrã.
 */
export const CABECALHO_IDIOMA = "x-idioma";

export function eIdioma(valor: string): valor is Idioma {
  return (IDIOMAS as readonly string[]).includes(valor);
}

/**
 * Constrói um href já com o prefixo de idioma certo. O caminho entra
 * sempre sem prefixo ("/obras/wonder-frida") e sai com ele quando o
 * idioma não é o de base.
 */
export function caminho(idioma: Idioma, path: string): string {
  const limpo = path.startsWith("/") ? path : `/${path}`;
  if (idioma === IDIOMA_BASE) return limpo;
  return limpo === "/" ? `/${idioma}` : `/${idioma}${limpo}`;
}

/** Remove o prefixo de idioma de um caminho, se existir. */
export function semPrefixo(path: string): string {
  const partes = path.split("/");
  if (partes.length > 1 && eIdioma(partes[1])) {
    const resto = "/" + partes.slice(2).join("/");
    return resto === "/" ? "/" : resto.replace(/\/$/, "");
  }
  return path;
}
