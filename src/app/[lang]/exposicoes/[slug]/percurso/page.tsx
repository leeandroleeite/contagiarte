import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Percurso } from "@/components/Percurso";
import { exposicaoPorSlug } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { resumir } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const expo = await exposicaoPorSlug(slug);
  if (!expo) return { title: "Percurso não encontrado" };

  return metadados({
    idioma: lang,
    path: `/exposicoes/${slug}/percurso`,
    titulo: comMarca(
      `${t("acao.atravessar", lang).replace(" →", "")}: ${texto(expo.titulo, lang)}`,
    ),
    descricao: resumir(texto(expo.texto, lang)),
    imagemChave: expo.imagem?.chave ?? null,
  });
}

export default async function PaginaPercurso({
  params,
}: {
  params: Promise<{ lang: Idioma; slug: string }>;
}) {
  const { lang: idioma, slug } = await params;
  const expo = await exposicaoPorSlug(slug);
  if (!expo || expo.salas.length === 0) notFound();

  return (
    <>
      <div className="px-7 pt-[150px] pb-14">
        <span className="etiqueta">{texto(expo.titulo, idioma)}</span>
        <h1 className="titulo d-2 mt-4">
          {t("acao.atravessar", idioma).replace(" →", "")}
        </h1>
        <p className="mt-5 max-w-[52ch] text-[17px] leading-[1.6] text-claro-75">
          {idioma === "pt"
            ? "Desça para atravessar as salas, uma a uma."
            : idioma === "en"
              ? "Scroll to walk through the rooms, one by one."
              : "Baje para recorrer las salas, una a una."}
        </p>
      </div>

      <Percurso
        salas={expo.salas.map((s) => ({
          id: s.id,
          nome: texto(s.nome, idioma),
          texto: texto(s.texto, idioma),
          fotografia: s.fotografia,
          obras: s.obras.map((o) => texto(o.obra.titulo, idioma)).filter(Boolean),
        }))}
      />

      <div className="px-7 py-20">
        <Link
          href={caminho(idioma, `/exposicoes/${slug}`)}
          className="text-[12px] tracking-[0.18em] uppercase"
        >
          ← {texto(expo.titulo, idioma)}
        </Link>
      </div>
    </>
  );
}
