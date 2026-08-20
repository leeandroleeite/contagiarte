import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Botao } from "@/components/Botao";
import { Imagem } from "@/components/Imagem";
import { Seccao } from "@/components/Seccao";
import {
  artistaPorSlug,
  descarregavelPorSlug,
  exposicoesDoArtista,
  listarObras,
  obterDefinicoes,
} from "@/lib/dados";
import { db } from "@/lib/db";
import { artistas as tArtistas } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { anos, rotuloDisciplina, t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, linkWhatsApp, resumir } from "@/lib/utils";

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

  const [obras, exposicoes, def, catalogo] = await Promise.all([
    listarObras({ artistaId: artista.id }),
    exposicoesDoArtista(artista.id),
    obterDefinicoes(),
    descarregavelPorSlug("catalogo-25-26"),
  ]);

  const etiqueta =
    texto(artista.etiqueta, idioma) ||
    [
      rotuloDisciplina(artista.disciplina, idioma).toUpperCase(),
      artista.naturalidade?.toUpperCase(),
    ]
      .filter(Boolean)
      .join(" · ");

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

      {/* Herói: nome gigante à esquerda, retrato à direita. */}
      <Seccao className="px-7 pt-[130px] pb-[72px] sm:px-10">
        <div className="grid items-end gap-14" style={colunas(320)}>
          <div className="flex flex-col gap-[22px]">
            <span className="text-[11px] tracking-[0.28em] text-[rgba(242,237,228,0.5)] uppercase">
              {etiqueta}
            </span>

            <h1 className="titulo text-[clamp(40px,6vw,104px)] leading-[0.88] tracking-[-0.02em]">
              {artista.nome}
            </h1>

            {texto(artista.biografia, idioma) && (
              <p className="max-w-[46ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.8)]">
                {texto(artista.biografia, idioma)}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Botao
                externo
                className="px-6 py-[15px]"
                href={linkWhatsApp(
                  def.whatsapp,
                  `Olá, queria saber mais sobre as obras de ${artista.nome}.`,
                )}
              >
                {idioma === "pt"
                  ? "Obras disponíveis"
                  : idioma === "en"
                    ? "Available works"
                    : "Obras disponibles"}
              </Botao>

              {catalogo?.ficheiro && (
                <Botao
                  variante="linha"
                  className="px-6 py-[15px]"
                  href={`/api/descarregar/${catalogo.slug}`}
                >
                  {idioma === "pt"
                    ? "Catálogo ↓"
                    : idioma === "en"
                      ? "Catalogue ↓"
                      : "Catálogo ↓"}
                </Botao>
              )}
            </div>

            {artista.instagram && (
              <a
                href={`https://instagram.com/${artista.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-[12px] tracking-[0.18em] uppercase"
              >
                @{artista.instagram} →
              </a>
            )}
          </div>

          <Imagem
            media={artista.retrato}
            alt={`Retrato de ${artista.nome}`}
            proporcao="4/5"
            legenda={`Retrato de ${artista.nome}`}
            prioridade
            sizes="(max-width: 900px) 100vw, 45vw"
          />
        </div>
      </Seccao>

      {/* Citação em bloco claro, alinhada à esquerda como no design. */}
      {texto(artista.citacao, idioma) && (
        <Seccao claro semFio className="px-7 py-20 sm:px-10">
          <blockquote className="titulo-med max-w-[34ch] text-[clamp(22px,2.6vw,40px)] leading-[1.12]">
            {texto(artista.citacao, idioma)}
          </blockquote>
          {artista.citacaoFonte && (
            <p className="mt-6 text-[12px] tracking-[0.2em] text-[rgba(14,12,11,0.55)]">
              {artista.citacaoFonte}
            </p>
          )}
        </Seccao>
      )}

      {/* Obras do artista. */}
      {obras.length > 0 && (
        <Seccao className="px-7 py-20 sm:px-10">
          <div className="mb-10 flex flex-wrap items-baseline justify-between gap-6">
            <h2 className="titulo text-[clamp(30px,3.6vw,56px)] leading-[0.92] tracking-[-0.02em]">
              {t("nav.obras", idioma).toUpperCase()}
            </h2>
            <span className="text-[12px] tracking-[0.18em] text-[rgba(242,237,228,0.5)] uppercase">
              {t("obra.sob_consulta", idioma)}
            </span>
          </div>

          <ul className="grid gap-7" style={colunas(240)}>
            {obras.map((o) => (
              <li key={o.id}>
                <Link
                  href={caminho(idioma, `/obras/${o.slug}`)}
                  className="group flex flex-col gap-3 text-papel"
                >
                  <Imagem
                    media={o.fotografia}
                    alt={`${texto(o.titulo, idioma)}, de ${artista.nome}`}
                    proporcao="1/1"
                    legenda={texto(o.titulo, idioma)}
                    sizes="(max-width: 700px) 100vw, 24vw"
                  />
                  <div className="flex justify-between gap-3 text-[15px]">
                    <span className="transition-colors group-hover:text-ouro">
                      {texto(o.titulo, idioma) || t("obra.sem_titulo", idioma)}
                    </span>
                    <span className="shrink-0 text-[rgba(242,237,228,0.5)]">
                      {o.ano ?? ""}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Seccao>
      )}

      {/* Exposições em que participou. */}
      {exposicoes.length > 0 && (
        <Seccao semFio className="px-7 py-20 sm:px-10">
          <h2 className="titulo mb-8 text-[clamp(28px,3.2vw,48px)] leading-[0.92] tracking-[-0.02em]">
            {t("nav.exposicoes", idioma).toUpperCase()}
          </h2>
          <div className="flex flex-col">
            {exposicoes.map((e) => (
              <Link
                key={e.id}
                href={caminho(idioma, `/exposicoes/${e.slug}`)}
                className="grid grid-cols-[54px_minmax(0,1fr)] items-baseline gap-4 border-t border-[rgba(242,237,228,0.16)] py-6 text-papel transition-colors last:border-b last:border-b-[rgba(242,237,228,0.16)] hover:text-ouro sm:grid-cols-[90px_minmax(0,1.6fr)_minmax(0,1fr)] sm:gap-6"
              >
                <span className="text-[13px] text-[rgba(242,237,228,0.5)]">
                  {anos(e.dataInicio, e.dataFim)}
                </span>
                <span className="titulo-med text-[clamp(18px,2vw,26px)]">
                  {texto(e.titulo, idioma)}
                </span>
                <span className="hidden text-[14px] text-[rgba(242,237,228,0.6)] sm:block">
                  {e.lugar
                    ? `${e.lugar.nome} · ${texto(e.lugar.localidade, idioma)}`
                    : ""}
                </span>
              </Link>
            ))}
          </div>
        </Seccao>
      )}
    </>
  );
}
