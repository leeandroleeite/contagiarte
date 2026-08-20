/**
 * Constrói o endereço público de um ficheiro guardado no R2.
 *
 * Com domínio próprio configurado (`NEXT_PUBLIC_R2_PUBLIC_URL`), serve
 * directamente da CDN da Cloudflare. Sem ele, cai para uma rota da
 * própria aplicação que faz de intermediária, para o site funcionar
 * antes de o domínio de media estar apontado.
 */
const BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

export function urlMedia(chave: string | null | undefined): string | null {
  if (!chave) return null;
  if (/^https?:\/\//.test(chave)) return chave;
  const limpa = chave.replace(/^\//, "");
  if (BASE) return `${BASE}/${limpa}`;
  return `/api/media/${limpa.split("/").map(encodeURIComponent).join("/")}`;
}

export type Imagem = {
  chave: string;
  alt: string;
  largura: number | null;
  altura: number | null;
  blur: string | null;
  corDominante: string | null;
};
