import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Botao } from "@/components/Botao";
import { CartaoObra } from "@/components/CartaoObra";
import { FormularioPedido } from "@/components/FormularioPedido";
import { Imagem } from "@/components/Imagem";
import { Seccao } from "@/components/Seccao";
import { db } from "@/lib/db";
import { obras as tObras } from "@/lib/db/schema";
import {
  obraPorSlug,
  obrasRelacionadas,
  obterDefinicoes,
} from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { env } from "@/lib/env";
import { linkEmail, linkWhatsApp, resumir } from "@/lib/utils";
import { eq } from "drizzle-orm";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const linhas = await db
    .select({ slug: tObras.slug })
    .from(tObras)
    .where(eq(tObras.estado, "publicado"));
  return linhas.map((l) => ({ slug: l.slug }));
}

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
        [autor, texto(obra.tecnica, lang), obra.dimensoes]
          .filter(Boolean)
          .join(" · "),
    ),
    imagemChave: obra.fotografia?.chave ?? null,
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

  const [def, relacionadas] = await Promise.all([
    obterDefinicoes(),
    obrasRelacionadas(obra),
  ]);

  const titulo = texto(obra.titulo, idioma) || t("obra.sem_titulo", idioma);
  const autor = obra.artista?.nome ?? "";
  const preco =
    obra.disponibilidade === "vendida"
      ? t("estado.vendida", idioma)
      : obra.disponibilidade === "reservada"
        ? t("estado.reservada", idioma)
        : texto(obra.preco, idioma) || t("obra.sob_consulta", idioma);

  const mensagem = `Olá, tenho interesse na obra "${titulo}"${autor ? `, de ${autor}` : ""}.`;

  const ficha: Array<[string, string]> = [
    [t("obra.artista", idioma), autor],
    [t("obra.tecnica", idioma), texto(obra.tecnica, idioma)],
    [t("obra.dimensoes", idioma), obra.dimensoes ?? ""],
    [t("obra.ano", idioma), obra.ano ? String(obra.ano) : ""],
    [
      t("obra.exposicao", idioma),
      obra.exposicao ? texto(obra.exposicao.titulo, idioma) : "",
    ],
    [t("obra.preco", idioma), preco],
  ].filter((par): par is [string, string] => Boolean(par[1]));

  // Dados estruturados: ajudam a obra a aparecer bem em pesquisa.
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Seccao className="pt-[140px]" semFio>
        <div
          className="grid gap-16"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))" }}
        >
          {/* A obra em fundo quase preto, inteira, sem cortes. */}
          <div className="bg-tinta-obra p-4 md:p-8">
            <Imagem
              media={obra.fotografia}
              alt={`${titulo}${autor ? `, de ${autor}` : ""}`}
              proporcao="3/4"
              ajuste="contain"
              legenda={titulo}
              prioridade
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>

          <div className="flex flex-col gap-7">
            {autor && (
              <Link
                href={caminho(idioma, `/artistas/${obra.artista!.slug}`)}
                className="text-[11px] tracking-[0.3em] uppercase"
              >
                {autor}
              </Link>
            )}

            <h1 className="titulo d-3">{titulo}</h1>

            {texto(obra.descricao, idioma) && (
              <p className="max-w-[52ch] text-[18px] leading-[1.65] text-[rgba(242,237,228,0.8)]">
                {texto(obra.descricao, idioma)}
              </p>
            )}

            <dl className="flex flex-col">
              {ficha.map(([rotulo, valor]) => (
                <div
                  key={rotulo}
                  className="flex items-baseline justify-between gap-6 border-t border-[rgba(242,237,228,0.16)] py-4"
                >
                  <dt className="text-[11px] tracking-[0.2em] text-[rgba(242,237,228,0.45)] uppercase">
                    {rotulo}
                  </dt>
                  <dd className="m-0 text-right text-[16px]">{valor}</dd>
                </div>
              ))}
            </dl>

            {obra.disponibilidade !== "vendida" && (
              <div className="flex flex-wrap gap-3.5">
                <Botao
                  externo
                  href={linkWhatsApp(def.whatsapp, mensagem)}
                >
                  {t("acao.whatsapp", idioma)}
                </Botao>
                <Botao
                  variante="linha"
                  href={linkEmail(
                    def.email,
                    `Interesse na obra: ${titulo}`,
                    mensagem,
                  )}
                >
                  {t("acao.email", idioma)}
                </Botao>
              </div>
            )}

            <div className="mt-2 flex flex-col gap-4 border border-[rgba(242,237,228,0.2)] p-7">
              <span className="text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.5)] uppercase">
                {t("obra.interesse", idioma)}
              </span>
              <FormularioPedido
                idioma={idioma}
                tipo="obra"
                obraSlug={obra.slug}
                origem={`obra/${obra.slug}`}
              />
            </div>

            <Link
              href={caminho(idioma, `/ver-na-parede?obra=${obra.slug}`)}
              className="text-[12px] tracking-[0.18em] uppercase"
            >
              {t("acao.parede", idioma)}
            </Link>
          </div>
        </div>
      </Seccao>

      {/* Galeria de imagens adicionais */}
      {obra.galeria.length > 0 && (
        <Seccao>
          <ul
            className="grid gap-6"
            style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}
          >
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

      {/* Serviço: o que a galeria trata depois da compra */}
      <Seccao claro semFio className="px-7 py-[120px]">
        <div
          className="grid gap-12"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}
        >
          {[
            {
              t: idioma === "pt" ? "MOLDURA À MEDIDA" : idioma === "en" ? "BESPOKE FRAMING" : "MARCO A MEDIDA",
              d:
                idioma === "pt"
                  ? "Produzida com a MOLDARTPÓVOA, com vidro museu Tru-Vue®."
                  : idioma === "en"
                    ? "Made with MOLDARTPÓVOA, with Tru-Vue® museum glass."
                    : "Producido con MOLDARTPÓVOA, con vidrio museo Tru-Vue®.",
            },
            {
              t: idioma === "pt" ? "ENTREGA E INSTALAÇÃO" : idioma === "en" ? "DELIVERY AND INSTALLATION" : "ENTREGA E INSTALACIÓN",
              d:
                idioma === "pt"
                  ? "Levamos a obra e deixamo-la pendurada no sítio certo."
                  : idioma === "en"
                    ? "We bring the work and hang it in the right place."
                    : "Llevamos la obra y la dejamos colgada en el sitio adecuado.",
            },
            {
              t: idioma === "pt" ? "CERTIFICADO" : idioma === "en" ? "CERTIFICATE" : "CERTIFICADO",
              d:
                idioma === "pt"
                  ? "Cada obra segue com certificado de autenticidade do artista."
                  : idioma === "en"
                    ? "Every work comes with the artist's certificate of authenticity."
                    : "Cada obra va acompañada del certificado de autenticidad del artista.",
            },
          ].map((c) => (
            <div key={c.t} className="flex flex-col gap-4 border-t-2 border-tinta pt-6">
              <span className="titulo text-[14px] tracking-[0.1em]">{c.t}</span>
              <p className="text-[17px] leading-[1.6] text-escuro-78">{c.d}</p>
            </div>
          ))}
        </div>
      </Seccao>

      {relacionadas.length > 0 && (
        <Seccao semFio>
          <h2 className="titulo d-3 mb-12">
            {t("obra.relacionadas", idioma).toUpperCase()}
          </h2>
          <ul
            className="grid gap-x-8 gap-y-12"
            style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}
          >
            {relacionadas.map((o) => (
              <li key={o.id}>
                <CartaoObra
                  obra={o}
                  idioma={idioma}
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
