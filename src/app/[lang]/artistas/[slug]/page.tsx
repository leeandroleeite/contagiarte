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
import { env } from "@/lib/env";
import { anos, rotuloDisciplina, t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, linkWhatsApp, resumir } from "@/lib/utils";
import { DadosEstruturados, migalhas } from "@/lib/dados-estruturados";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

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
      rotuloDisciplina(artista.disciplina, idioma),
      artista.naturalidade,
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
      <DadosEstruturados dados={jsonLd} />

      <DadosEstruturados
        dados={migalhas(idioma, [
          { nome: t("nav.artistas", idioma), path: "/artistas" },
          { nome: artista.nome, path: `/artistas/${slug}` },
        ])}
      />

      {/* Herói: nome gigante à esquerda, retrato à direita. */}
      <Seccao className="px-7 pt-[130px] pb-[72px] sm:px-10">
        <div className="grid items-end gap-14" style={colunas(320)}>
          <div className="flex flex-col gap-[22px]">
            <span className="etiqueta text-claro-55">
              {etiqueta}
            </span>

            <h1 className="titulo d-ficha tracking-[-0.02em] uppercase">
              {artista.nome}
            </h1>

            {texto(artista.biografia, idioma) && (
              <p className="lead max-w-[46ch] text-claro-80">
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
                className="etiqueta inline-flex min-h-11 items-center"
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
          <blockquote className="titulo-med max-w-[34ch] d-citacao-med">
            {texto(artista.citacao, idioma)}
          </blockquote>
          {artista.citacaoFonte && (
            <p className="mt-6 text-[12px] tracking-[0.2em] text-escuro-62">
              {artista.citacaoFonte}
            </p>
          )}
        </Seccao>
      )}

      {/* Obras do artista. */}
      {obras.length > 0 && (
        <Seccao className="px-7 py-20 sm:px-10">
          <div className="mb-10 flex flex-wrap items-baseline justify-between gap-6">
            <h2 className="titulo d-apoio tracking-[-0.02em]">
              {t("nav.obras", idioma)}
            </h2>
            <span className="etiqueta text-claro-55">
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
                    <span className="shrink-0 text-claro-55">
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
          <h2 className="titulo mb-8 d-apoio tracking-[-0.02em]">
            {t("nav.exposicoes", idioma)}
          </h2>
          <div className="flex flex-col">
            {exposicoes.map((e) => (
              <Link
                key={e.id}
                href={caminho(idioma, `/exposicoes/${e.slug}`)}
                className="grid grid-cols-[54px_minmax(0,1fr)] items-baseline gap-4 border-t border-fio py-6 text-papel transition-colors last:border-b last:border-b-fio hover:text-ouro sm:grid-cols-[90px_minmax(0,1.6fr)_minmax(0,1fr)] sm:gap-6"
              >
                <span className="meta text-claro-55">
                  {anos(e.dataInicio, e.dataFim)}
                </span>
                <span className="titulo-med d-linha">
                  {texto(e.titulo, idioma)}
                </span>
                <span className="meta hidden text-claro-65 sm:block">
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
