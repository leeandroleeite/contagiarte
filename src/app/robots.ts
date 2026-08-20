import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // Staging nunca deve ser indexado, mesmo que a password caia.
  if (env.ambiente !== "producao") {
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
