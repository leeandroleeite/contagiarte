import type { Metadata } from "next";
import Link from "next/link";
import { Seccao, TituloSeccao } from "@/components/Seccao";
import { listarExposicoes, obterTextos, situacao } from "@/lib/dados";
import { anos, t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const txt = await obterTextos();
  return metadados({
    idioma: lang,
    path: "/arquivo",
    titulo: comMarca(t("nav.arquivo", lang)),
    descricao: texto(txt["arquivo.descricao"], lang),
  });
}

export default async function PaginaArquivo({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const [exposicoes, txt] = await Promise.all([
    listarExposicoes(),
    obterTextos(),
  ]);

  return (
    <Seccao className="pt-[160px]" semFio>
      <TituloSeccao
        nota={
          idioma === "pt"
            ? "EXPOSIÇÕES E CURADORIAS"
            : idioma === "en"
              ? "EXHIBITIONS AND CURATION"
              : "EXPOSICIONES Y CURADURÍAS"
        }
      >
        {t("nav.arquivo", idioma)}
      </TituloSeccao>

      <div className="flex flex-col">
        {exposicoes.map((e) => (
          <Link
            key={e.id}
            href={caminho(idioma, `/exposicoes/${e.slug}`)}
            className="grid grid-cols-[54px_minmax(0,1fr)_auto] items-baseline gap-4 border-t border-fio py-6 text-papel transition-colors hover:text-ouro sm:gap-7 sm:py-[30px] lg:grid-cols-[90px_minmax(0,1.7fr)_minmax(0,1fr)_auto]"
          >
            <span className="meta tracking-[0.1em] text-claro-80">
              {anos(e.dataInicio, e.dataFim)}
            </span>
            <span className="titulo-med d-linha leading-none">
              {texto(e.titulo, idioma)}
            </span>
            <span className="meta hidden text-claro-55 lg:block">
              {e.lugar
                ? `${e.lugar.nome} · ${texto(e.lugar.localidade, idioma)}`
                : ""}
            </span>
            <span className="etiqueta text-claro-55">
              {t(`estado.${situacao(e)}`, idioma)}
            </span>
          </Link>
        ))}
        <span className="meta border-t border-fio pt-6 text-claro-55">
          {texto(txt["arquivo.nota"], idioma)}
        </span>
      </div>
    </Seccao>
  );
}
