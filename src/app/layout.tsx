import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Spline_Sans } from "next/font/google";
import { headers } from "next/headers";
import {
  CABECALHO_IDIOMA,
  eIdioma,
  HREFLANG,
  IDIOMA_BASE,
} from "@/lib/i18n/config";
import "./globals.css";

const titulo = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
  variable: "--fonte-titulo",
});

const texto = Spline_Sans({
  subsets: ["latin"],
  // 300 saiu: era o peso do corpo e desfazia-se no texto pequeno.
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--fonte-texto",
});

export const viewport: Viewport = {
  themeColor: "#0E0C0B",
  width: "device-width",
  initialScale: 1,
  // A escala não é travada: quem precisa de ampliar tem de conseguir.
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Galeria Contagiarte",
  // O SVG primeiro, para quem o entende; os PNG de src/app entram
  // sozinhos pela convenção do Next e cobrem o resto, incluindo o
  // ícone de quem guarda o site no ecrã inicial do telemóvel.
  icons: {
    icon: [
      { url: "/icone.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

/**
 * O idioma vem do `proxy.ts`, que é quem sabe por que caminho o pedido
 * entrou. Este layout está acima da rota `[lang]` e não vê o parâmetro,
 * e por isso declarava `pt-PT` em todas as páginas: o conteúdo em
 * inglês existia, e o documento dizia que era português. É o que os
 * motores de busca lêem, e é com isso que um leitor de ecrã escolhe a
 * fonética com que pronuncia a página.
 *
 * Cai no português quando o cabeçalho não vem, que é o caso do
 * backoffice e de qualquer coisa que não passe pelo proxy.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pedido = (await headers()).get(CABECALHO_IDIOMA) ?? "";
  const idioma = eIdioma(pedido) ? pedido : IDIOMA_BASE;

  return (
    <html
      lang={HREFLANG[idioma]}
      className={`${titulo.variable} ${texto.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
