import type { Metadata } from "next";
import { env } from "@/lib/env";
import { caminho, HREFLANG, IDIOMAS, type Idioma } from "@/lib/i18n/config";
import { urlMedia } from "@/lib/media/url";

type Entrada = {
  idioma: Idioma;
  /** Caminho sem prefixo de idioma, ex. "/obras/wonder-frida". */
  path: string;
  titulo: string;
  descricao?: string;
  imagemChave?: string | null;
  tipo?: "website" | "article";
  /** Impede a indexação (rascunhos, staging, páginas de sistema). */
  semIndice?: boolean;
};

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
  imagemChave,
  tipo = "website",
  semIndice = false,
}: Entrada): Metadata {
  const base = env.urlPublico;
  const canonico = `${base}${caminho(idioma, path)}`;
  const imagem = urlMedia(imagemChave ?? null);
  const absoluta = imagem?.startsWith("http") ? imagem : imagem ? `${base}${imagem}` : `${base}/og.png`;

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
