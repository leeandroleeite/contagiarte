import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartaoObra } from "@/components/CartaoObra";
import { Imagem } from "@/components/Imagem";
import { Seccao } from "@/components/Seccao";
import {
  artistaPorSlug,
  exposicoesDoArtista,
  listarObras,
} from "@/lib/dados";
import { db } from "@/lib/db";
import { artistas as tArtistas } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { anos, rotuloDisciplina, t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { resumir } from "@/lib/utils";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const linhas = await db
    .select({ slug: tArtistas.slug })
    .from(tArtistas)
    .where(eq(tArtistas.estado, "publicado"));
  return linhas.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const artista = await artistaPorSlug(slug);
  if (!artista) return { title: "Artista não encontrado" };

  return metadados({
    idioma: lang,
    path: `/artistas/${slug}`,
    tipo: "article",
    titulo: comMarca(artista.nome),
    descricao: resumir(
      texto(artista.biografia, lang) || texto(artista.nota, lang),
    ),
    imagemChave: artista.retrato?.chave ?? null,
  });
}

export default async function PaginaArtista({
  params,
}: {
  params: Promise<{ lang: Idioma; slug: string }>;
}) {
  const { lang: idioma, slug } = await params;
  const artista = await artistaPorSlug(slug);
  if (!artista) notFound();

  const [obras, exposicoes] = await Promise.all([
    listarObras({ artistaId: artista.id }),
    exposicoesDoArtista(artista.id),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artista.nome,
    ...(artista.naturalidade ? { birthPlace: artista.naturalidade } : {}),
    ...(artista.instagram
      ? { sameAs: [`https://instagram.com/${artista.instagram}`] }
      : {}),
    url: `${env.urlPublico}${caminho(idioma, `/artistas/${slug}`)}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Seccao className="pt-[150px]">
        <div
          className="grid items-end gap-16"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}
        >
          <div className="flex flex-col gap-6">
            <span className="etiqueta">
              {rotuloDisciplina(artista.disciplina, idioma)}
              {artista.naturalidade ? ` · ${artista.naturalidade}` : ""}
            </span>
            <h1 className="titulo d-1">{artista.nome}</h1>
            {texto(artista.nota, idioma) && (
              <p className="max-w-[44ch] text-[19px] leading-[1.55] text-[rgba(242,237,228,0.82)]">
                {texto(artista.nota, idioma)}
              </p>
            )}
            {artista.instagram && (
              <a
                href={`https://instagram.com/${artista.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] tracking-[0.18em] uppercase"
              >
                @{artista.instagram} →
              </a>
            )}
          </div>

          <Imagem
            media={artista.retrato}
            alt={`Retrato de ${artista.nome}`}
            proporcao="4/5"
            legenda={artista.nome}
            prioridade
            sizes="(max-width: 900px) 100vw, 45vw"
          />
        </div>
      </Seccao>

      {texto(artista.citacao, idioma) && (
        <Seccao claro className="px-7 py-[120px]">
          <blockquote className="titulo mx-auto max-w-[24ch] text-center text-[clamp(28px,4.5vw,68px)] leading-[1.05]">
            {texto(artista.citacao, idioma)}
          </blockquote>
          <p className="mt-8 text-center text-[11px] tracking-[0.24em] text-[rgba(14,12,11,0.5)]">
            {artista.nome}
          </p>
        </Seccao>
      )}

      {texto(artista.biografia, idioma) && (
        <Seccao>
          <div className="max-w-[68ch] text-[18px] leading-[1.7] text-[rgba(242,237,228,0.8)]">
            {texto(artista.biografia, idioma)
              .split(/\n\s*\n/)
              .map((paragrafo, i) => (
                <p key={i} className="mb-6">
                  {paragrafo}
                </p>
              ))}
          </div>
        </Seccao>
      )}

      {obras.length > 0 && (
        <Seccao>
          <h2 className="titulo d-2 mb-12">
            {t("nav.obras", idioma).toUpperCase()}
          </h2>
          <ul
            className="grid gap-x-8 gap-y-14"
            style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}
          >
            {obras.map((o, i) => (
              <li key={o.id}>
                <CartaoObra
                  obra={o}
                  idioma={idioma}
                  numero={i + 1}
                  sizes="(max-width: 700px) 100vw, 30vw"
                />
              </li>
            ))}
          </ul>
        </Seccao>
      )}

      {exposicoes.length > 0 && (
        <Seccao semFio>
          <h2 className="titulo d-2 mb-12">
            {t("nav.exposicoes", idioma).toUpperCase()}
          </h2>
          <div className="flex flex-col">
            {exposicoes.map((e) => (
              <Link
                key={e.id}
                href={caminho(idioma, `/exposicoes/${e.slug}`)}
                className="grid items-baseline gap-7 border-t border-[rgba(242,237,228,0.16)] py-7 text-papel transition-colors hover:text-ouro"
                style={{ gridTemplateColumns: "90px minmax(0,2fr) minmax(0,1fr)" }}
              >
                <span className="text-[13px] tracking-[0.1em] text-[rgba(242,237,228,0.45)]">
                  {anos(e.dataInicio, e.dataFim)}
                </span>
                <span className="titulo-med text-[clamp(18px,2vw,28px)]">
                  {texto(e.titulo, idioma)}
                </span>
                <span className="hidden text-[14px] text-claro-55 sm:block">
                  {e.lugar?.nome ?? ""}
                </span>
              </Link>
            ))}
          </div>
        </Seccao>
      )}
    </>
  );
}
