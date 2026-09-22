import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Botao } from "@/components/Botao";
import { FormularioPedido } from "@/components/FormularioPedido";
import { Imagem } from "@/components/Imagem";
import { Seccao } from "@/components/Seccao";
import {
  obraPorSlug,
  obrasRelacionadas,
  obterDefinicoes,
  obterTextos,
} from "@/lib/dados";
import { env } from "@/lib/env";
import { t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, linkEmail, linkWhatsApp, resumir } from "@/lib/utils";
import { DadosEstruturados, migalhas } from "@/lib/dados-estruturados";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const obra = await obraPorSlug(slug);
  if (!obra) return { title: "Obra não encontrada" };

  const titulo = texto(obra.titulo, lang) || t("obra.sem_titulo", lang);
  const autor = obra.artista?.nome ?? "";

  return metadados({
    idioma: lang,
    path: `/obras/${slug}`,
    tipo: "article",
    titulo: comMarca(autor ? `${titulo}, ${autor}` : titulo),
    descricao: resumir(
      texto(obra.descricao, lang) ||
        [texto(obra.tecnica, lang), obra.dimensoes, obra.ano]
          .filter(Boolean)
          .join(", "),
    ),
  });
}

export default async function PaginaObra({
  params,
}: {
  params: Promise<{ lang: Idioma; slug: string }>;
}) {
  const { lang: idioma, slug } = await params;
  const obra = await obraPorSlug(slug);
  if (!obra) notFound();

  const [def, txt, relacionadas] = await Promise.all([
    obterDefinicoes(),
    obterTextos(),
    obrasRelacionadas(obra),
  ]);

  const T = (chave: string) => texto(txt[chave], idioma);
  const titulo = texto(obra.titulo, idioma) || t("obra.sem_titulo", idioma);
  const autor = obra.artista?.nome ?? "";
  const vendida = obra.disponibilidade === "vendida";

  const preco = vendida
    ? t("estado.vendida", idioma)
    : obra.disponibilidade === "reservada"
      ? t("estado.reservada", idioma)
      : texto(obra.preco, idioma) || t("obra.sob_consulta", idioma);

  const mensagem = `Olá, tenho interesse na obra “${titulo}”${autor ? ` de ${autor}` : ""}. Podem dizer-me o preço?`;

  // Proporção real da obra, quando conhecida: uma peça alta não deve
  // ser mostrada dentro de um quadrado.
  const proporcao =
    obra.larguraCm && obra.alturaCm
      ? `${obra.larguraCm}/${obra.alturaCm}`
      : "1/1";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: titulo,
    ...(autor ? { creator: { "@type": "Person", name: autor } } : {}),
    ...(texto(obra.tecnica, idioma)
      ? { artMedium: texto(obra.tecnica, idioma) }
      : {}),
    ...(obra.dimensoes ? { size: obra.dimensoes } : {}),
    ...(obra.ano ? { dateCreated: String(obra.ano) } : {}),
    url: `${env.urlPublico}${caminho(idioma, `/obras/${slug}`)}`,
  };

  const ficha: Array<[string, React.ReactNode]> = (
    [
      [t("obra.tecnica", idioma), texto(obra.tecnica, idioma)],
      [t("obra.dimensoes", idioma), obra.dimensoes ?? ""],
      [t("obra.ano", idioma), obra.ano ? String(obra.ano) : ""],
      [
        t("obra.exposicao", idioma),
        obra.exposicao ? (
          <Link
            key="expo"
            href={caminho(idioma, `/exposicoes/${obra.exposicao.slug}`)}
          >
            {texto(obra.exposicao.titulo, idioma)}
          </Link>
        ) : (
          ""
        ),
      ],
      [
        t("obra.preco", idioma),
        <span key="preco" className="text-ouro">
          {preco}
        </span>,
      ],
    ] as Array<[string, React.ReactNode]>
  ).filter(([, v]) => v);

  return (
    <>
      <DadosEstruturados dados={jsonLd} />

      <DadosEstruturados
        dados={migalhas(idioma, [
          { nome: t("nav.obras", idioma), path: "/obras" },
          { nome: titulo, path: `/obras/${slug}` },
        ])}
      />

      <Seccao semFio className="px-7 pt-[120px] pb-20 sm:px-10">
        <div className="grid gap-14" style={colunas(340)}>
          {/* A obra inteira, sem cortes, sobre o fundo mais escuro. */}
          <div className="bg-tinta-obra">
            <Imagem
              media={obra.fotografia}
              alt={`${titulo}${autor ? `, de ${autor}` : ""}`}
              proporcao={proporcao}
              ajuste="contain"
              legenda={`${titulo}, alta resolução`}
              prioridade
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>

          <div className="flex flex-col gap-6 self-center">
            {autor && (
              <Link
                href={caminho(idioma, `/artistas/${obra.artista!.slug}`)}
                className="inline-flex min-h-11 items-center text-[11px] tracking-[0.28em] uppercase"
              >
                {autor} →
              </Link>
            )}

            <h1 className="titulo text-[clamp(38px,5vw,86px)] leading-[0.9] tracking-[-0.02em]">
              {titulo}
            </h1>

            <dl className="grid">
              {ficha.map(([rotulo, valor], i) => (
                <div
                  key={rotulo}
                  className={`flex justify-between gap-4 border-t border-[rgba(242,237,228,0.16)] py-3.5 text-[15px] ${
                    i === ficha.length - 1
                      ? "border-b border-b-[rgba(242,237,228,0.16)]"
                      : ""
                  }`}
                >
                  <dt className="text-[rgba(242,237,228,0.55)]">{rotulo}</dt>
                  <dd className="m-0 text-right">{valor}</dd>
                </div>
              ))}
            </dl>

            {texto(obra.descricao, idioma) && (
              <p className="max-w-[48ch] text-[16px] leading-[1.65] text-[rgba(242,237,228,0.75)]">
                {texto(obra.descricao, idioma)}
              </p>
            )}

            {!vendida && (
              <div className="flex flex-col gap-3">
                <Botao externo href={linkWhatsApp(def.whatsapp, mensagem)}>
                  {idioma === "pt"
                    ? "Pedir preço por WhatsApp"
                    : idioma === "en"
                      ? "Ask the price on WhatsApp"
                      : "Pedir precio por WhatsApp"}
                </Botao>
                <Botao
                  variante="linha"
                  href={linkEmail(
                    def.email,
                    `Interesse na obra: ${titulo}`,
                    mensagem,
                  )}
                >
                  {idioma === "pt"
                    ? "Pedir por email"
                    : idioma === "en"
                      ? "Ask by email"
                      : "Pedir por email"}
                </Botao>
                <span className="text-center text-[13px] text-[rgba(242,237,228,0.55)]">
                  {T("obra.nota.servico")}
                </span>
              </div>
            )}

            <Link
              href={caminho(idioma, `/ver-na-parede?obra=${obra.slug}`)}
              className="inline-flex min-h-11 items-center text-[12px] tracking-[0.18em] uppercase"
            >
              {t("acao.parede", idioma)}
            </Link>
          </div>
        </div>
      </Seccao>

      {/* Imagens adicionais da obra. */}
      {obra.galeria.length > 0 && (
        <Seccao className="px-7 sm:px-10">
          <ul className="grid gap-6" style={colunas(280)}>
            {obra.galeria.map((g) => (
              <li key={g.mediaId}>
                <Imagem
                  media={g.media}
                  alt={texto(g.media.alt, idioma) || `Detalhe de ${titulo}`}
                  proporcao="4/3"
                  sizes="(max-width: 900px) 100vw, 33vw"
                />
              </li>
            ))}
          </ul>
        </Seccao>
      )}

      {/* O que a galeria trata depois da compra. */}
      <Seccao claro semFio className="px-7 py-[72px] sm:px-10">
        <div className="grid gap-8" style={colunas(280)}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-col gap-3">
              <span className="titulo-med text-[13px] tracking-[0.12em]">
                {T(`obra.servico.${n}.titulo`)}
              </span>
              <p className="text-[16px] leading-[1.6] text-[rgba(14,12,11,0.75)]">
                {T(`obra.servico.${n}.texto`)}
              </p>
            </div>
          ))}
        </div>
      </Seccao>

      {/* Pedido escrito, para quem não usa WhatsApp. */}
      <Seccao className="px-7 sm:px-10">
        <div className="max-w-[680px]">
          <h2 className="titulo mb-6 text-[clamp(24px,2.6vw,38px)]">
            {t("obra.interesse", idioma)}
          </h2>
          <FormularioPedido
            idioma={idioma}
            tipo="obra"
            obraSlug={obra.slug}
            origem={`obra/${obra.slug}`}
          />
        </div>
      </Seccao>

      {/* Do mesmo artista, ou da mesma exposição quando não há mais. */}
      {relacionadas.lista.length > 0 && (
        <Seccao semFio className="px-7 py-20 sm:px-10">
          <h2 className="titulo mb-8 text-[clamp(26px,3vw,44px)] leading-[0.92] tracking-[-0.02em]">
            {relacionadas.mesmoArtista
              ? idioma === "pt"
                ? "DO MESMO ARTISTA"
                : idioma === "en"
                  ? "BY THE SAME ARTIST"
                  : "DEL MISMO ARTISTA"
              : t("obra.relacionadas", idioma).toUpperCase()}
          </h2>
          <ul className="grid gap-6" style={colunas(220)}>
            {relacionadas.lista.map((o) => (
              <li key={o.id}>
                <Link
                  href={caminho(idioma, `/obras/${o.slug}`)}
                  className="group flex flex-col gap-3 text-papel"
                >
                  <Imagem
                    media={o.fotografia}
                    alt={texto(o.titulo, idioma)}
                    proporcao="1/1"
                    legenda={texto(o.titulo, idioma)}
                    sizes="(max-width: 700px) 50vw, 22vw"
                  />
                  <span className="text-[15px] transition-colors group-hover:text-ouro">
                    {texto(o.titulo, idioma) || t("obra.sem_titulo", idioma)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Seccao>
      )}
    </>
  );
}
