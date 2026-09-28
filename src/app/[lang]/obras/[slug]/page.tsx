import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { Botao } from "@/components/Botao";
import { FormularioPedido } from "@/components/FormularioPedido";
import { CartaoObra } from "@/components/CartaoObra";
import { Imagem } from "@/components/Imagem";
import { Seccao } from "@/components/Seccao";
import {
  listarObras,
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

  const [def, txt, relacionadas, todas] = await Promise.all([
    obterDefinicoes(),
    obterTextos(),
    obrasRelacionadas(obra),
    listarObras({}),
  ]);

  // Anterior e seguinte na ordem da lista, em volta: a ficha deixava de
  // ser um beco, e percorrer obras passa a ser como andar numa sala.
  const posicao = todas.findIndex((o) => o.id === obra.id);
  const vizinha = (passo: number) =>
    todas.length > 1 && posicao >= 0
      ? todas[(posicao + passo + todas.length) % todas.length]
      : null;
  const anterior = vizinha(-1);
  const seguinte = vizinha(1);

  const T = (chave: string) => texto(txt[chave], idioma);
  const titulo = texto(obra.titulo, idioma) || t("obra.sem_titulo", idioma);
  const autor = obra.artista?.nome ?? "";
  const vendida = obra.disponibilidade === "vendida";

  const preco = vendida
    ? t("estado.vendida", idioma)
    : obra.disponibilidade === "reservada"
      ? t("estado.reservada", idioma)
      : texto(obra.preco, idioma) || t("obra.sob_consulta", idioma);

  const mensagem = t("whatsapp.obra", idioma, {
    titulo,
    autor: autor ? t("whatsapp.obra_autor", idioma, { autor }) : "",
  });

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

      <Seccao semFio className="px-margem pt-[120px] pb-20">
        <div className="grid gap-14" style={colunas(340)}>
          {/* A obra inteira, sem cortes, sobre o fundo mais escuro. */}
          <ViewTransition
            name={`obra-${slug}`}
            share="obra-voo"
            default="none"
          >
            <div className="bg-tinta-obra">
              <Imagem
                media={obra.fotografia}
                alt={
                  autor
                    ? t("obra.alt", idioma, { titulo, autor })
                    : titulo
                }
                proporcao={proporcao}
                ajuste="contain"
                legenda={`${titulo}, alta resolução`}
                prioridade
                revelar={false}
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </div>
          </ViewTransition>

          <div className="flex flex-col gap-6 self-center">
            {autor && (
              <Link
                href={caminho(idioma, `/artistas/${obra.artista!.slug}`)}
                className="etiqueta inline-flex min-h-11 items-center"
              >
                {autor} →
              </Link>
            )}

            <h1 className="titulo d-ficha tracking-[-0.02em]">
              {titulo}
            </h1>

            <dl className="grid">
              {ficha.map(([rotulo, valor], i) => (
                <div
                  key={rotulo}
                  className={`flex justify-between gap-4 border-t border-fio py-3.5 text-[15px] ${
                    i === ficha.length - 1
                      ? "border-b border-b-fio"
                      : ""
                  }`}
                >
                  <dt className="text-claro-55">{rotulo}</dt>
                  <dd className="m-0 text-right">{valor}</dd>
                </div>
              ))}
            </dl>

            {texto(obra.descricao, idioma) && (
              <p className="corpo max-w-[48ch] text-claro-80">
                {texto(obra.descricao, idioma)}
              </p>
            )}

            {!vendida && (
              <div className="flex flex-col gap-3">
                <Botao externo href={linkWhatsApp(def.whatsapp, mensagem)}>
                  {t("acao.preco_whatsapp", idioma)}
                </Botao>
                <Botao
                  variante="linha"
                  href={linkEmail(
                    def.email,
                    t("whatsapp.obra_assunto", idioma, { titulo }),
                    mensagem,
                  )}
                >
                  {t("acao.preco_email", idioma)}
                </Botao>
                <span className="meta text-center text-claro-55">
                  {T("obra.nota.servico")}
                </span>
              </div>
            )}

            <Link
              href={caminho(idioma, `/ver-na-parede?obra=${obra.slug}`)}
              className="etiqueta inline-flex min-h-11 items-center"
            >
              {t("acao.parede", idioma)}
            </Link>
          </div>
        </div>
      </Seccao>

      {/* Imagens adicionais da obra. */}
      {obra.galeria.length > 0 && (
        <Seccao className="px-margem">
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
      <Seccao claro semFio className="px-margem py-[72px]">
        <div className="grid gap-8" style={colunas(280)}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-col gap-3">
              <span className="titulo-med text-[13px] tracking-[0.12em]">
                {T(`obra.servico.${n}.titulo`)}
              </span>
              <p className="corpo text-escuro-78">
                {T(`obra.servico.${n}.texto`)}
              </p>
            </div>
          ))}
        </div>
      </Seccao>

      {/* Pedido escrito, para quem não usa WhatsApp. */}
      <Seccao className="px-margem">
        <div className="max-w-[680px]">
          <h2 className="titulo mb-6 d-apoio">
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
        <Seccao semFio className="px-margem py-20">
          <h2 className="titulo mb-8 d-apoio tracking-[-0.02em]">
            {relacionadas.mesmoArtista
              ? t("obra.relacionadas_artista", idioma)
              : t("obra.relacionadas", idioma)}
          </h2>
          <ul className="grid gap-6" style={colunas(220)}>
            {relacionadas.lista.map((o) => (
              <li key={o.id}>
                <CartaoObra
                  obra={o}
                  idioma={idioma}
                  tamanho="compacto"
                  meta={["ano"]}
                  sizes="(max-width: 700px) 50vw, 22vw"
                  voa={false}
                />
              </li>
            ))}
          </ul>
        </Seccao>
      )}

      {anterior && seguinte && (
        <nav
          aria-label={t("nav.obras", idioma)}
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 border-t border-fio px-margem py-12"
        >
          <Link
            href={caminho(idioma, `/obras/${anterior.slug}`)}
            className="group flex flex-col gap-2 text-papel"
          >
            <span className="etiqueta text-claro-55">
              ← {t("acao.anterior", idioma)}
            </span>
            <span className="d-linha titulo-med transition-colors group-hover:text-ouro">
              {texto(anterior.titulo, idioma) || t("obra.sem_titulo", idioma)}
            </span>
          </Link>
          <Link
            href={caminho(idioma, "/obras")}
            className="etiqueta inline-flex min-h-11 items-center"
          >
            {t("filtro.todas", idioma)}
          </Link>
          <Link
            href={caminho(idioma, `/obras/${seguinte.slug}`)}
            className="group flex flex-col items-end gap-2 text-right text-papel"
          >
            <span className="etiqueta text-claro-55">
              {t("acao.seguinte", idioma)} →
            </span>
            <span className="d-linha titulo-med transition-colors group-hover:text-ouro">
              {texto(seguinte.titulo, idioma) || t("obra.sem_titulo", idioma)}
            </span>
          </Link>
        </nav>
      )}
    </>
  );
}
