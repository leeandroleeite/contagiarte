import type { Localizado } from "@/lib/db/schema";
import { slugificar } from "@/lib/utils";

/** Lê um campo traduzível escrito como `nome.pt`, `nome.en`, `nome.es`. */
export function lerLocalizado(
  dados: FormData,
  nome: string,
): Localizado | null {
  const pt = String(dados.get(`${nome}.pt`) ?? "").trim();
  const en = String(dados.get(`${nome}.en`) ?? "").trim();
  const es = String(dados.get(`${nome}.es`) ?? "").trim();
  if (!pt && !en && !es) return null;
  return { pt, en: en || null, es: es || null };
}

/** Igual ao anterior, mas garante que o português não vem vazio. */
export function lerLocalizadoObrigatorio(
  dados: FormData,
  nome: string,
  omissao: string,
): Localizado {
  const valor = lerLocalizado(dados, nome);
  if (!valor || !valor.pt) {
    return { pt: omissao, en: valor?.en ?? null, es: valor?.es ?? null };
  }
  return valor;
}

export function lerTexto(dados: FormData, nome: string): string | null {
  const v = String(dados.get(nome) ?? "").trim();
  return v || null;
}

export function lerNumero(dados: FormData, nome: string): number | null {
  const v = String(dados.get(nome) ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function lerInteiro(dados: FormData, nome: string, omissao = 0): number {
  return lerNumero(dados, nome) ?? omissao;
}

export function lerBool(dados: FormData, nome: string): boolean {
  return dados.get(nome) === "1";
}

/** Data em ISO curto (yyyy-mm-dd), como o Postgres `date` espera. */
export function lerData(dados: FormData, nome: string): string | null {
  const v = String(dados.get(nome) ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** Campo de relação: devolve null quando vem vazio, em vez de "". */
export function lerRelacao(dados: FormData, nome: string): string | null {
  const v = String(dados.get(nome) ?? "").trim();
  return v || null;
}

export function lerEstado(
  dados: FormData,
  nome = "estado",
): "rascunho" | "publicado" | "arquivado" {
  const v = String(dados.get(nome) ?? "rascunho");
  return v === "publicado" || v === "arquivado" ? v : "rascunho";
}

/**
 * Slug do formulário, ou derivado do título quando fica em branco.
 * Nunca devolve vazio: sem slug não há endereço.
 */
export function lerSlug(
  dados: FormData,
  nome: string,
  alternativa: string,
): string {
  const bruto = String(dados.get(nome) ?? "").trim();
  return slugificar(bruto || alternativa) || `sem-nome-${Date.now()}`;
}
