import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioPedido } from "@/components/FormularioPedido";
import { CartaoObra } from "@/components/CartaoObra";
import { FichaObra } from "@/components/FichaObra";
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
import { colunas, resumir } from "@/lib/utils";
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
        <FichaObra
          obra={obra}
          idioma={idioma}
          whatsapp={def.whatsapp}
          email={def.email}
          nota={T("obra.nota.servico")}
          transicao
        />
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
