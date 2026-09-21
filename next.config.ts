import type { NextConfig } from "next";

/** Domínio público do bucket R2, quando existe um configurado. */
const media = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
const anfitriaoMedia = media ? new URL(media).hostname : null;

const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  experimental: {
    serverActions: {
      // O backoffice promete 25 MB e valida-os, mas o Next corta o
      // corpo de uma server action nos 1 MB por omissão. Qualquer
      // fotografia de máquina ou catálogo em PDF morria com um erro de
      // servidor sem explicação. A margem é para o envelope multipart.
      bodySizeLimit: "30mb",
    },
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // As obras são vistas em grande; vale a pena ter larguras altas.
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920, 2560],
    remotePatterns: anfitriaoMedia
      ? [{ protocol: "https", hostname: anfitriaoMedia }]
      : [],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Endereços antigos e atalhos que a galeria já divulgou.
      { source: "/exposicao", destination: "/exposicoes", permanent: true },
      { source: "/catalogo", destination: "/descarregar", permanent: false },
      { source: "/contacto", destination: "/contactos", permanent: true },
    ];
  },
};

export default config;
