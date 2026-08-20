import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { artistas, exposicoes, obras } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { caminho, HREFLANG, IDIOMAS } from "@/lib/i18n/config";

export const revalidate = 3600;

const ESTATICAS = [
  { path: "/", prioridade: 1, frequencia: "weekly" as const },
  { path: "/exposicoes", prioridade: 0.9, frequencia: "weekly" as const },
  { path: "/obras", prioridade: 0.9, frequencia: "weekly" as const },
  { path: "/artistas", prioridade: 0.8, frequencia: "monthly" as const },
  { path: "/arquivo", prioridade: 0.5, frequencia: "monthly" as const },
  { path: "/molduras", prioridade: 0.7, frequencia: "monthly" as const },
  { path: "/lugares", prioridade: 0.5, frequencia: "monthly" as const },
  { path: "/a-galeria", prioridade: 0.6, frequencia: "monthly" as const },
  { path: "/ver-na-parede", prioridade: 0.6, frequencia: "monthly" as const },
  { path: "/a-obra-como-ativo", prioridade: 0.5, frequencia: "yearly" as const },
  { path: "/descarregar", prioridade: 0.6, frequencia: "monthly" as const },
  { path: "/contactos", prioridade: 0.7, frequencia: "yearly" as const },
];

/** Uma entrada por caminho, com os três idiomas em `alternates`. */
function entrada(
  path: string,
  prioridade: number,
  frequencia: "weekly" | "monthly" | "yearly",
  actualizado?: Date,
): MetadataRoute.Sitemap[number] {
  const base = env.urlPublico;
  const languages: Record<string, string> = {};
  for (const id of IDIOMAS) languages[HREFLANG[id]] = `${base}${caminho(id, path)}`;

  return {
    url: `${base}${caminho("pt", path)}`,
    lastModified: actualizado,
    changeFrequency: frequencia,
    priority: prioridade,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listaObras, listaArtistas, listaExpo] = await Promise.all([
    db
      .select({ slug: obras.slug, em: obras.actualizadoEm })
      .from(obras)
      .where(eq(obras.estado, "publicado")),
    db
      .select({ slug: artistas.slug, em: artistas.actualizadoEm })
      .from(artistas)
      .where(eq(artistas.estado, "publicado")),
    db
      .select({ slug: exposicoes.slug, em: exposicoes.actualizadoEm })
      .from(exposicoes)
      .where(eq(exposicoes.estado, "publicado")),
  ]);

  return [
    ...ESTATICAS.map((e) => entrada(e.path, e.prioridade, e.frequencia)),
    ...listaExpo.map((e) =>
      entrada(`/exposicoes/${e.slug}`, 0.8, "monthly", e.em),
    ),
    ...listaObras.map((o) => entrada(`/obras/${o.slug}`, 0.7, "monthly", o.em)),
    ...listaArtistas.map((a) =>
      entrada(`/artistas/${a.slug}`, 0.7, "monthly", a.em),
    ),
  ];
}
