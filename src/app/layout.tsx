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
  weight: ["300", "400", "500", "600"],
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
  icons: { icon: [{ url: "/icone.svg", type: "image/svg+xml" }] },
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
