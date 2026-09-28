import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Botao } from "@/components/Botao";
import { CartaoObra } from "@/components/CartaoObra";
import { Imagem } from "@/components/Imagem";
import { Seccao } from "@/components/Seccao";
import {
  descarregavelPorSlug,
  exposicaoPorSlug,
  listarObras,
  obterDefinicoes,
  situacao,
} from "@/lib/dados";
import { env } from "@/lib/env";
import { periodo, t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, linkWhatsApp, resumir } from "@/lib/utils";
import { DadosEstruturados, migalhas } from "@/lib/dados-estruturados";
import { VEU_FICHA } from "@/lib/veu";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

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

  const [def, obras, dossier] = await Promise.all([
    obterDefinicoes(),
    listarObras({ exposicaoId: expo.id }),
    descarregavelPorSlug(`dossier-${slug}`),
  ]);

  const titulo = texto(expo.titulo, idioma);
  const estado = situacao(expo);

  const ficha: Array<[string, string]> = [
    [
      idioma === "pt" ? "LOCAL" : idioma === "en" ? "VENUE" : "LUGAR",
      expo.lugar
        ? [expo.lugar.nome, expo.lugar.morada ?? texto(expo.lugar.localidade, idioma)]
            .filter(Boolean)
            .join(" · ")
        : "",
    ],
    [
      idioma === "pt" ? "VISITAS" : idioma === "en" ? "VISITS" : "VISITAS",
      texto(expo.horario, idioma),
    ],
    [
      idioma === "pt"
        ? "A VISITA INCLUI"
        : idioma === "en"
          ? "THE VISIT INCLUDES"
          : "LA VISITA INCLUYE",
      texto(expo.inclui, idioma),
    ],
    [
      idioma === "pt" ? "RESERVAS" : idioma === "en" ? "BOOKING" : "RESERVAS",
      texto(expo.reservas, idioma),
    ],
  ].filter((par): par is [string, string] => Boolean(par[1]));

  const paragrafos = texto(expo.texto, idioma).split(/\n\s*\n/);

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
            ...(expo.lugar.morada ? { address: expo.lugar.morada } : {}),
          },
        }
      : {}),
    organizer: { "@type": "Organization", name: "Galeria Contagiarte" },
    url: `${env.urlPublico}${caminho(idioma, `/exposicoes/${slug}`)}`,
  };

  return (
    <>
      <DadosEstruturados dados={jsonLd} />

      <DadosEstruturados
        dados={migalhas(idioma, [
          { nome: t("nav.exposicoes", idioma), path: "/exposicoes" },
          { nome: titulo, path: `/exposicoes/${slug}` },
        ])}
      />

      {/* Herói: imagem a toda a largura, título por cima do degradê. */}
      <section
        className="relative min-h-[480px] overflow-hidden"
        style={{ height: "74dvh" }}
      >
        <Imagem
          media={expo.imagem}
          alt={`Vista da exposição ${titulo}`}
          legenda="Vista da exposição na adega"
          prioridade
          revelar={false}
          sizes="100vw"
          className="h-full"
        />
        {/* O véu apanha a capa toda e não uma faixa de altura fixa:
            um título de duas linhas saía fora dela e ficava por ler.
            Ver `src/lib/veu.ts`. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: VEU_FICHA }}
        />
        <div className="pointer-events-none absolute inset-x-7 bottom-10 sm:inset-x-10">
          <span className="etiqueta text-claro-55">
            {[
              t(`estado.${estado}`, idioma),
              periodo(expo.dataInicio, expo.dataFim, idioma, expo.permanente),
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <h1 className="titulo mt-3.5 d-ficha tracking-[-0.02em] uppercase">
            {titulo}
          </h1>
        </div>
      </section>

      {/* Texto curatorial e ficha de visita. */}
      <Seccao className="px-7 py-[88px] sm:px-10">
        <div className="grid gap-14" style={colunas(300)}>
          <div className="flex flex-col gap-[22px]">
            {paragrafos.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "text-[20px] leading-[1.55] text-papel"
                    : "text-[17px] leading-[1.65] text-claro-80"
                }
              >
                {p}
              </p>
            ))}
            {expo.curadoria && (
              <p className="meta tracking-[0.06em] text-claro-55">
                {expo.curadoria}
              </p>
            )}
          </div>

          <aside className="flex flex-col self-start">
            <dl className="flex flex-col">
              {ficha.map(([rotulo, valor], i) => (
                <div
                  key={rotulo}
                  className={`flex flex-col gap-1.5 border-t border-fio py-[18px] ${
                    i === ficha.length - 1
                      ? "border-b border-b-fio"
                      : ""
                  }`}
                >
                  <dt className="text-[10px] tracking-[0.22em] text-claro-55">
                    {rotulo}
                  </dt>
                  <dd className="corpo m-0">{valor}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap gap-3 pt-6">
              <Botao
                externo
                className="px-6 py-[15px]"
                href={linkWhatsApp(
                  def.whatsapp,
                  `Olá, queria saber mais sobre a exposição ${titulo}.`,
                )}
              >
                {idioma === "pt"
                  ? "Falar connosco"
                  : idioma === "en"
                    ? "Talk to us"
                    : "Hablar con nosotros"}
              </Botao>

              {expo.salas.length > 0 && (
                <Botao
                  variante="linha"
                  className="px-6 py-[15px]"
                  href={caminho(idioma, `/exposicoes/${slug}/percurso`)}
                >
                  {t("acao.atravessar", idioma)}
                </Botao>
              )}

              {dossier?.ficheiro && (
                <Botao
                  variante="linha"
                  className="px-6 py-[15px]"
                  href={`/api/descarregar/${dossier.slug}`}
                >
                  {idioma === "pt"
                    ? "Dossier ↓"
                    : idioma === "en"
                      ? "Press kit ↓"
                      : "Dosier ↓"}
                </Botao>
              )}
            </div>
          </aside>
        </div>
      </Seccao>

      {/* Citação do anfitrião, em bloco claro. */}
      {texto(expo.citacao, idioma) && (
        <Seccao claro semFio className="px-7 py-[88px] sm:px-10">
          <blockquote className="titulo-med mx-auto max-w-[26ch] text-center d-citacao-med">
            {texto(expo.citacao, idioma)}
          </blockquote>
          {expo.citacaoAutor && (
            <p className="mt-7 text-center text-[12px] tracking-[0.2em] text-escuro-62">
              {expo.citacaoAutor}
            </p>
          )}
        </Seccao>
      )}

      {/* Artistas em exposição. */}
      {expo.artistas.length > 0 && (
        <Seccao className="px-7 py-[88px] sm:px-10">
          <h2 className="titulo mb-10 d-apoio tracking-[-0.02em]">
            {idioma === "pt"
              ? "ARTISTAS EM EXPOSIÇÃO"
              : idioma === "en"
                ? "ARTISTS ON SHOW"
                : "ARTISTAS EN EXPOSICIÓN"}
          </h2>
          <ul className="grid gap-7" style={colunas(220)}>
            {expo.artistas.map((ea) => (
              <li key={ea.artista.id}>
                <Link
                  href={caminho(idioma, `/artistas/${ea.artista.slug}`)}
                  className="group flex flex-col gap-3.5 text-papel"
                >
                  <Imagem
                    media={ea.artista.retrato}
                    alt={`Retrato de ${ea.artista.nome}`}
                    proporcao="4/5"
                    legenda={ea.artista.nome}
                    sizes="(max-width: 700px) 50vw, 22vw"
                  />
                  <span className="titulo-med text-[17px] uppercase transition-colors group-hover:text-ouro">
                    {ea.artista.nome}
                  </span>
                  {texto(ea.artista.nota, idioma) && (
                    <span className="meta text-claro-65">
                      {texto(ea.artista.nota, idioma)}
                    </span>
                  )}
                  <span className="meta tracking-[0.14em] text-ouro">
                    {t("acao.ver_artista", idioma)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Seccao>
      )}

      {/* Obras em exposição. */}
      {obras.length > 0 && (
        <Seccao semFio className="px-7 py-[88px] sm:px-10">
          <div className="mb-10 flex flex-wrap items-baseline justify-between gap-6">
            <h2 className="titulo d-apoio tracking-[-0.02em]">
              {t("obra.em_exposicao", idioma)}
            </h2>
            <span className="etiqueta text-claro-55">
              {t("obra.sob_consulta", idioma)}
            </span>
          </div>

          <ul className="grid gap-7" style={colunas(240)}>
            {obras.map((o) => (
              <li key={o.id}>
                <CartaoObra
                  obra={o}
                  idioma={idioma}
                  tamanho="compacto"
                  meta={["artista"]}
                  sizes="(max-width: 700px) 100vw, 24vw"
                />
              </li>
            ))}
          </ul>
        </Seccao>
      )}
    </>
  );
}
