import type { Metadata } from "next";
import Link from "next/link";
import { Imagem } from "@/components/Imagem";
import { Seccao, TituloSeccao } from "@/components/Seccao";
import { listarExposicoes, situacao, obterTextos } from "@/lib/dados";
import { periodo, t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas } from "@/lib/utils";

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
    path: "/exposicoes",
    titulo: comMarca(t("nav.exposicoes", lang)),
    descricao: texto(txt["exposicoes.descricao"], lang),
  });
}

export default async function PaginaExposicoes({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const exposicoes = await listarExposicoes();

  const activas = exposicoes.filter((e) =>
    ["em_curso", "permanente", "proxima"].includes(situacao(e)),
  );
  const passadas = exposicoes.filter((e) => situacao(e) === "arquivo");

  return (
    <>
      <Seccao className="pt-[160px]" semFio={passadas.length === 0}>
        <TituloSeccao>{t("nav.exposicoes", idioma).toUpperCase()}</TituloSeccao>

        {activas.length === 0 ? (
          <p className="text-[16px] text-claro-55">
            {t("msg.sem_resultados", idioma)}
          </p>
        ) : (
          <ul className="flex flex-col gap-20">
            {activas.map((e) => (
              <li key={e.id}>
                <Link
                  href={caminho(idioma, `/exposicoes/${e.slug}`)}
                  className="group grid items-center gap-12 text-papel"
                  style={colunas(320)}
                >
                  <Imagem
                    media={e.imagem}
                    alt={`Vista da exposição ${texto(e.titulo, idioma)}`}
                    proporcao="4/3"
                    legenda={texto(e.titulo, idioma)}
                    sizes="(max-width: 900px) 100vw, 50vw"
                  />
                  <div className="flex flex-col gap-5">
                    <span className="etiqueta">
                      {[
                        t(`estado.${situacao(e)}`, idioma),
                        periodo(e.dataInicio, e.dataFim, idioma, e.permanente),
                        e.lugar?.nome,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <h2 className="titulo d-3 transition-colors group-hover:text-ouro">
                      {texto(e.titulo, idioma)}
                    </h2>
                    <p className="max-w-[46ch] text-[17px] leading-[1.6] text-[rgba(242,237,228,0.75)]">
                      {texto(e.texto, idioma)}
                    </p>
                    <span className="text-[12px] tracking-[0.18em] text-ouro uppercase">
                      {t("acao.ver_exposicao", idioma)} →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Seccao>

      {passadas.length > 0 && (
        <Seccao semFio>
          <h2 className="titulo d-2 mb-12">
            {t("estado.arquivo", idioma).toUpperCase()}
          </h2>
          <div className="flex flex-col">
            {passadas.map((e) => (
              <Link
                key={e.id}
                href={caminho(idioma, `/exposicoes/${e.slug}`)}
                className="grid grid-cols-[54px_minmax(0,1fr)] items-baseline gap-4 border-t border-[rgba(242,237,228,0.16)] py-6 text-papel transition-colors hover:text-ouro sm:grid-cols-[90px_minmax(0,2fr)_minmax(0,1fr)] sm:gap-7 sm:py-7"
              >
                <span className="text-[13px] tracking-[0.1em] text-[rgba(242,237,228,0.55)]">
                  {e.dataInicio ? new Date(e.dataInicio).getFullYear() : ""}
                </span>
                <span className="titulo-med text-[clamp(18px,2vw,28px)]">
                  {texto(e.titulo, idioma)}
                </span>
                <span className="hidden text-[14px] text-claro-55 sm:block">
                  {e.lugar?.nome ?? ""}
                </span>
              </Link>
            ))}
          </div>
        </Seccao>
      )}
    </>
  );
}
