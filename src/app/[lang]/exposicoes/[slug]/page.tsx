import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Botao } from "@/components/Botao";
import { CartaoObra } from "@/components/CartaoObra";
import { Imagem } from "@/components/Imagem";
import { Seccao } from "@/components/Seccao";
import {
  exposicaoPorSlug,
  listarObras,
  obterDefinicoes,
  situacao,
} from "@/lib/dados";
import { db } from "@/lib/db";
import { exposicoes as tExposicoes } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { periodo, t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { linkWhatsApp, resumir } from "@/lib/utils";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const linhas = await db
    .select({ slug: tExposicoes.slug })
    .from(tExposicoes)
    .where(eq(tExposicoes.estado, "publicado"));
  return linhas.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const expo = await exposicaoPorSlug(slug);
  if (!expo) return { title: "Exposição não encontrada" };

  return metadados({
    idioma: lang,
    path: `/exposicoes/${slug}`,
    tipo: "article",
    titulo: comMarca(texto(expo.titulo, lang)),
    descricao: resumir(texto(expo.texto, lang)),
    imagemChave: expo.imagem?.chave ?? null,
  });
}

export default async function PaginaExposicao({
  params,
}: {
  params: Promise<{ lang: Idioma; slug: string }>;
}) {
  const { lang: idioma, slug } = await params;
  const expo = await exposicaoPorSlug(slug);
  if (!expo) notFound();

  const [def, obras] = await Promise.all([
    obterDefinicoes(),
    listarObras({ exposicaoId: expo.id }),
  ]);

  const titulo = texto(expo.titulo, idioma);
  const estado = situacao(expo);

  const ficha: Array<[string, string]> = [
    [
      idioma === "pt" ? "Local" : idioma === "en" ? "Venue" : "Lugar",
      expo.lugar
        ? [expo.lugar.nome, texto(expo.lugar.localidade, idioma)]
            .filter(Boolean)
            .join(", ")
        : "",
    ],
    [
      idioma === "pt" ? "Datas" : idioma === "en" ? "Dates" : "Fechas",
      periodo(expo.dataInicio, expo.dataFim, idioma, expo.permanente),
    ],
    [
      idioma === "pt" ? "Visitas" : idioma === "en" ? "Visits" : "Visitas",
      texto(expo.horario, idioma),
    ],
    [
      idioma === "pt" ? "Inclui" : idioma === "en" ? "Includes" : "Incluye",
      texto(expo.inclui, idioma),
    ],
    [
      idioma === "pt" ? "Reservas" : idioma === "en" ? "Booking" : "Reservas",
      texto(expo.reservas, idioma),
    ],
    [
      idioma === "pt" ? "Curadoria" : idioma === "en" ? "Curation" : "Curaduría",
      expo.curadoria ?? "",
    ],
  ].filter((par): par is [string, string] => Boolean(par[1]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ExhibitionEvent",
    name: titulo,
    ...(expo.dataInicio ? { startDate: expo.dataInicio } : {}),
    ...(expo.dataFim ? { endDate: expo.dataFim } : {}),
    ...(expo.lugar
      ? {
          location: {
            "@type": "Place",
            name: expo.lugar.nome,
            ...(expo.lugar.morada
              ? { address: expo.lugar.morada }
              : {}),
          },
        }
      : {}),
    organizer: { "@type": "Organization", name: "Galeria Contagiarte" },
    url: `${env.urlPublico}${caminho(idioma, `/exposicoes/${slug}`)}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Imagem de topo com o título sobreposto */}
      <section
        className="relative overflow-hidden"
        style={{ height: "74vh", minHeight: "460px" }}
      >
        <Imagem
          media={expo.imagem}
          alt={`Vista da exposição ${titulo}`}
          legenda={titulo}
          prioridade
          revelar={false}
          sizes="100vw"
          className="h-full"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(14,12,11,0.6), rgba(14,12,11,0.2) 45%, rgba(14,12,11,0.92))",
          }}
        />
        <div className="absolute inset-x-7 bottom-12 flex flex-col gap-4">
          <span className="etiqueta">
            {[
              t(`estado.${estado}`, idioma),
              periodo(expo.dataInicio, expo.dataFim, idioma, expo.permanente),
              expo.lugar?.nome,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <h1 className="titulo d-1">{titulo}</h1>
        </div>
      </section>

      {/* Texto curatorial e ficha lateral */}
      <Seccao>
        <div
          className="grid gap-16"
          style={{ gridTemplateColumns: "minmax(0,1.7fr) minmax(260px,1fr)" }}
        >
          <div className="max-w-[64ch] text-[19px] leading-[1.7] text-[rgba(242,237,228,0.82)]">
            {texto(expo.texto, idioma)
              .split(/\n\s*\n/)
              .map((p, i) => (
                <p key={i} className="mb-6">
                  {p}
                </p>
              ))}
          </div>

          <aside className="flex flex-col">
            <dl className="flex flex-col">
              {ficha.map(([rotulo, valor]) => (
                <div
                  key={rotulo}
                  className="flex flex-col gap-1.5 border-t border-[rgba(242,237,228,0.16)] py-4"
                >
                  <dt className="text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.45)] uppercase">
                    {rotulo}
                  </dt>
                  <dd className="m-0 text-[16px]">{valor}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-col gap-3">
              <Botao
                externo
                href={linkWhatsApp(
                  def.whatsapp,
                  `Olá, queria marcar uma visita à exposição "${titulo}".`,
                )}
              >
                {t("acao.visita", idioma)}
              </Botao>
              {expo.salas.length > 0 && (
                <Botao
                  variante="linha"
                  href={caminho(idioma, `/exposicoes/${slug}/percurso`)}
                >
                  {t("acao.atravessar", idioma)}
                </Botao>
              )}
            </div>
          </aside>
        </div>
      </Seccao>

      {/* Citação */}
      {texto(expo.citacao, idioma) && (
        <Seccao claro className="px-7 py-[120px]">
          <blockquote className="titulo mx-auto max-w-[24ch] text-center text-[clamp(28px,4.5vw,68px)] leading-[1.05]">
            {texto(expo.citacao, idioma)}
          </blockquote>
          {expo.citacaoAutor && (
            <p className="mt-8 text-center text-[11px] tracking-[0.24em] text-[rgba(14,12,11,0.5)]">
              {expo.citacaoAutor}
            </p>
          )}
        </Seccao>
      )}

      {/* Artistas */}
      {expo.artistas.length > 0 && (
        <Seccao>
          <h2 className="titulo d-2 mb-12">
            {t("nav.artistas", idioma).toUpperCase()}
          </h2>
          <ul
            className="grid gap-x-6 gap-y-12"
            style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}
          >
            {expo.artistas.map((ea) => (
              <li key={ea.artista.id}>
                <Link
                  href={caminho(idioma, `/artistas/${ea.artista.slug}`)}
                  className="group flex flex-col gap-3.5 text-papel"
                >
                  <Imagem
                    media={ea.artista.retrato}
                    alt={`Retrato de ${ea.artista.nome}`}
                    proporcao="3/4"
                    legenda={ea.artista.nome}
                    sizes="(max-width: 700px) 50vw, 22vw"
                  />
                  <span className="titulo-med text-[16px] transition-colors group-hover:text-ouro">
                    {ea.artista.nome}
                  </span>
                  <span className="text-[14px] text-claro-55">
                    {texto(ea.artista.nota, idioma)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Seccao>
      )}

      {/* Obras */}
      {obras.length > 0 && (
        <Seccao semFio>
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
    </>
  );
}
