import type { MetadataRoute } from "next";

/**
 * Para quem guarda o site no ecrã inicial. Numa galeria é um gesto
 * plausível: quem colecciona volta a ver a mesma obra várias vezes
 * antes de decidir.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Galeria Contagiarte",
    short_name: "Contagiarte",
    description:
      "Arte contemporânea de artistas nacionais e internacionais, molduras à medida e exposições em lugares que rompem com o modelo tradicional.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0c0b",
    theme_color: "#0e0c0b",
    lang: "pt-PT",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
