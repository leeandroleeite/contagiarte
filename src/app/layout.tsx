import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Spline_Sans } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" className={`${titulo.variable} ${texto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
