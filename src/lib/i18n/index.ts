import type { Localizado } from "@/lib/db/schema";
import { IDIOMA_BASE, type Idioma } from "./config";
import { DICIONARIO, type ChaveTexto } from "./dicionario";

export * from "./config";
export { DICIONARIO } from "./dicionario";
export type { ChaveTexto } from "./dicionario";

/**
 * Resolve um campo traduzível vindo da base de dados. Quando a tradução
 * pedida está vazia, cai para o português, que é sempre obrigatório.
 */
export function texto(
  valor: Localizado | null | undefined,
  idioma: Idioma,
): string {
  if (!valor) return "";
  const escolhido = valor[idioma];
  if (typeof escolhido === "string" && escolhido.trim()) return escolhido;
  return valor[IDIOMA_BASE] ?? "";
}

/** Diz se um campo já tem tradução própria neste idioma. */
export function temTraducao(
  valor: Localizado | null | undefined,
  idioma: Idioma,
): boolean {
  if (!valor) return false;
  if (idioma === IDIOMA_BASE) return Boolean(valor.pt?.trim());
  return Boolean(valor[idioma]?.trim());
}

/** Traduz uma chave do dicionário de interface. */
export function t(chave: ChaveTexto, idioma: Idioma): string {
  const entrada = DICIONARIO[chave] as Record<Idioma, string> | undefined;
  if (!entrada) return chave;
  return entrada[idioma] ?? entrada[IDIOMA_BASE];
}

/** Devolve um tradutor já preso a um idioma, para não repetir o argumento. */
export function tradutor(idioma: Idioma) {
  const fn = (chave: ChaveTexto) => t(chave, idioma);
  fn.idioma = idioma;
  fn.campo = (valor: Localizado | null | undefined) => texto(valor, idioma);
  return fn;
}

export type Tradutor = ReturnType<typeof tradutor>;

/** Rótulo traduzido de uma disciplina, com recurso à própria chave. */
export function rotuloDisciplina(chave: string, idioma: Idioma): string {
  const k = `disciplina.${chave.replace(/-/g, "_")}` as ChaveTexto;
  if (k in DICIONARIO) return t(k, idioma);
  return chave.charAt(0).toUpperCase() + chave.slice(1).replace(/[-_]/g, " ");
}

const LOCALE: Record<Idioma, string> = {
  pt: "pt-PT",
  en: "en-GB",
  es: "es-ES",
};

/** Intervalo de datas de uma exposição, escrito por extenso. */
export function periodo(
  inicio: string | null | undefined,
  fim: string | null | undefined,
  idioma: Idioma,
  permanente = false,
): string {
  const fmt = (d: string) =>
    new Intl.DateTimeFormat(LOCALE[idioma], {
      month: "long",
      year: "numeric",
    }).format(new Date(d));

  if (permanente) {
    return inicio
      ? `${fmt(inicio)} · ${t("estado.permanente", idioma)}`
      : t("estado.permanente", idioma);
  }
  if (inicio && fim) {
    const a = fmt(inicio);
    const b = fmt(fim);
    return a === b ? a : `${a} a ${b}`;
  }
  return inicio ? fmt(inicio) : "";
}

/** Ano ou intervalo de anos, para listagens de arquivo. */
export function anos(
  inicio: string | null | undefined,
  fim: string | null | undefined,
): string {
  const a = inicio ? new Date(inicio).getFullYear() : null;
  const b = fim ? new Date(fim).getFullYear() : null;
  if (a && b && a !== b) return `${a}/${String(b).slice(2)}`;
  return String(a ?? b ?? "");
}
