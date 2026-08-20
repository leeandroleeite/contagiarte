import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * Lido a pedido e não na compilação. As duas coisas que decidem o que
 * aqui sai, o muro à entrada e o endereço público, só existem quando a
 * aplicação está a correr. Gerado na compilação, este ficheiro dizia
 * "podem indexar tudo" a partir de um sítio fechado à chave.
 */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Staging nunca deve ser indexado, mesmo que a password caia. E uma
  // produção ainda com muro à entrada também não: os motores leriam o
  // robots e o sitemap, que passam o muro, e ficavam com uma lista de
  // endereços que só devolvem 401. O muro a cair é o que abre a porta.
  if (env.ambiente !== "producao" || env.muroDeEntrada) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/newsletter/"],
      },
    ],
    sitemap: `${env.urlPublico}/sitemap.xml`,
    host: env.urlPublico,
  };
}
