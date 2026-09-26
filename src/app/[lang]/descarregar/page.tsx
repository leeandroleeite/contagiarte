import type { Metadata } from "next";
import { Seccao, TituloSeccao } from "@/components/Seccao";
import { listarDescarregaveis, obterTextos } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
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
    path: "/descarregar",
    titulo: comMarca(t("nav.descarregar", lang)),
    descricao: texto(txt["descarregar.descricao"], lang),
  });
}

export default async function PaginaDescarregar({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const [ficheiros, txt] = await Promise.all([
    listarDescarregaveis(),
    obterTextos(),
  ]);

  return (
    <Seccao className="pt-[160px]" semFio>
      <TituloSeccao>{t("nav.descarregar", idioma).toUpperCase()}</TituloSeccao>

      {ficheiros.length === 0 ? (
        <p className="max-w-[52ch] text-[16px] text-claro-55">
          {texto(txt["descarregar.vazio"], idioma)}
        </p>
      ) : (
        <ul className="grid gap-6" style={colunas(280)}>
          {ficheiros.map((f) => (
            <li key={f.id} className="contents">
              <a
                href={`/api/descarregar/${f.slug}`}
                className="flex flex-col gap-4 border border-[rgba(242,237,228,0.2)] p-8 text-papel transition-colors hover:border-ouro hover:bg-[rgba(180,136,74,0.08)]"
              >
                <span className="text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.55)] uppercase">
                  {texto(f.etiqueta, idioma)}
                </span>
                <span className="titulo-med text-[24px]">
                  {texto(f.nome, idioma)}
                </span>
                <span className="text-[14px] text-claro-55">
                  {texto(f.descricao, idioma)}
                </span>
                <span className="mt-auto pt-5 text-[12px] tracking-[0.18em] text-ouro uppercase">
                  {t("acao.descarregar", idioma)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Seccao>
  );
}
