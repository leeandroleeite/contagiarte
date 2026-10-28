import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Botao } from "@/components/Botao";
import { BotoesCatalogo } from "@/components/BotoesCatalogo";
import { CartaoObra } from "@/components/CartaoObra";
import {
  ArtistasExposicao,
  CabecalhoExposicao,
  CitacaoExposicao,
  etiquetaExposicao,
  linhaLugar,
  rotulosVisita,
  TextoExposicao,
} from "@/components/PecasExposicao";
import { Seccao } from "@/components/Seccao";
import {
  catalogosDaExposicao,
  descarregavelPorSlug,
  exposicaoPorSlug,
  listarObras,
  obterDefinicoes,
} from "@/lib/dados";
import { env } from "@/lib/env";
import { t, texto, type Idioma } from "@/lib/i18n";
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

  const [def, obras, dossier, ligados] = await Promise.all([
    obterDefinicoes(),
    listarObras({ exposicaoId: expo.id }),
    descarregavelPorSlug(`dossier-${slug}`),
    catalogosDaExposicao(expo.id),
  ]);

  // O dossier encontrado pelo slug pode ser também o documento ligado
  // no backoffice: nesse caso fica só o botão do dossier.
  const catalogos = ligados.filter((c) => c.id !== dossier?.id);

  const titulo = texto(expo.titulo, idioma);
  const rotulos = rotulosVisita(idioma);

  const ficha: Array<[string, string]> = [
    [rotulos.local, linhaLugar(expo.lugar, idioma)],
    [rotulos.visitas, texto(expo.horario, idioma)],
    [rotulos.inclui, texto(expo.inclui, idioma)],
    [rotulos.reservas, texto(expo.reservas, idioma)],
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
      <CabecalhoExposicao
        imagem={expo.imagem}
        titulo={titulo}
        etiqueta={etiquetaExposicao(expo, idioma)}
        prioridade
        style={{ height: "74dvh" }}
      />

      {/* Texto curatorial e ficha de visita. */}
      <Seccao className="px-margem py-[88px]">
        <TextoExposicao
          texto={texto(expo.texto, idioma)}
          curadoria={expo.curadoria}
          ficha={ficha}
          botoes={
            <>
              <Botao
                externo
                className="px-6 py-[15px]"
                href={linkWhatsApp(
                  def.whatsapp,
                  t("whatsapp.exposicao", idioma, { titulo }),
                )}
              >
                {t("acao.perguntar_whatsapp", idioma)}
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

              <BotoesCatalogo
                catalogos={catalogos}
                idioma={idioma}
                className="px-6 py-[15px]"
              />
            </>
          }
        />
      </Seccao>

      {/* Citação do anfitrião, em bloco claro. */}
      {texto(expo.citacao, idioma) && (
        <Seccao claro semFio className="px-margem py-[88px]">
          <CitacaoExposicao
            citacao={texto(expo.citacao, idioma)}
            autor={expo.citacaoAutor}
          />
        </Seccao>
      )}

      {/* Artistas em exposição. */}
      {expo.artistas.length > 0 && (
        <Seccao className="px-margem py-[88px]">
          <ArtistasExposicao
            idioma={idioma}
            artistas={expo.artistas.map((ea) => ea.artista)}
          />
        </Seccao>
      )}

      {/* Obras em exposição. */}
      {obras.length > 0 && (
        <Seccao semFio className="px-margem py-[88px]">
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
