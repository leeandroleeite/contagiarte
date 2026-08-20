import { twMerge } from "tailwind-merge";

/**
 * Junta classes ignorando valores falsos, e resolve conflitos do
 * Tailwind: a última classe do mesmo grupo ganha.
 *
 * Sem isto, um componente que aplica `py-[120px]` e recebe `py-[88px]`
 * por props fica com a que a folha de estilo tiver por acaso à frente,
 * e o espaçamento passa a depender da ordem de compilação.
 */
export function cx(
  ...partes: Array<string | false | null | undefined>
): string {
  return twMerge(partes.filter(Boolean).join(" "));
}

/** Transforma um título em slug de URL. */
export function slugificar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Mensagem de WhatsApp já codificada. */
export function linkWhatsApp(numero: string, mensagem: string): string {
  const limpo = numero.replace(/[^0-9]/g, "");
  return `https://wa.me/${limpo}?text=${encodeURIComponent(mensagem)}`;
}

export function linkEmail(
  endereco: string,
  assunto: string,
  corpo?: string,
): string {
  const q = new URLSearchParams({ subject: assunto });
  if (corpo) q.set("body", corpo);
  return `mailto:${endereco}?${q.toString().replace(/\+/g, "%20")}`;
}

/** Número de ordem com dois dígitos, como no design ("01", "02"). */
export function ordinal(n: number): string {
  return String(n).padStart(2, "0");
}

/** Corta um texto sem partir palavras, para descrições de partilha. */
export function resumir(texto: string, limite = 155): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;
  return limpo.slice(0, limpo.lastIndexOf(" ", limite - 1)) + "…";
}

export function eEmailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(valor.trim());
}

/**
 * Grelha que se adapta sozinha sem nunca pedir mais largura do que
 * aquela que tem disponível.
 *
 * O `min(Npx, 100%)` é o que impede uma coluna de 380px de rebentar um
 * ecrã de 360px: sem ele, o `auto-fit` obriga a coluna a ficar com o
 * mínimo pedido e a página ganha scroll lateral.
 */
export function colunas(
  minimo: number,
  modo: "auto-fit" | "auto-fill" = "auto-fit",
): import("react").CSSProperties {
  return {
    gridTemplateColumns: `repeat(${modo}, minmax(min(${minimo}px, 100%), 1fr))`,
  };
}
