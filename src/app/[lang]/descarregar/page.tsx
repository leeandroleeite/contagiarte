import type { Metadata } from "next";
import Link from "next/link";
import { Seccao, TituloSeccao } from "@/components/Seccao";
import {
  listarDescarregaveis,
  obterDefinicoes,
  obterTextos,
} from "@/lib/dados";
import { caminho, t, texto, type Idioma } from "@/lib/i18n";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, linkWhatsApp } from "@/lib/utils";

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
  const [ficheiros, txt, def] = await Promise.all([
    listarDescarregaveis(),
    obterTextos(),
    obterDefinicoes(),
  ]);

  return (
    <Seccao className="pt-[160px]" semFio>
      <TituloSeccao>{t("nav.descarregar", idioma)}</TituloSeccao>

      {ficheiros.length === 0 ? (
        // Sem documentos a página não pode ser só um título: está no
        // menu principal, e sem saída parecia um site partido.
        <div className="flex flex-col items-start gap-8">
          <p className="corpo max-w-[52ch] text-claro-80">
            {texto(txt["descarregar.vazio"], idioma) ||
              t("descarregar.vazio", idioma)}
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href={linkWhatsApp(def.whatsapp, t("whatsapp.catalogo", idioma))}
              target="_blank"
              rel="noopener noreferrer"
              className="etiqueta inline-flex min-h-12 items-center bg-ouro px-8 text-tinta transition-colors hover:bg-papel hover:text-tinta"
            >
              {t("acao.pedir_catalogo", idioma)}
            </a>
            <Link
              href={caminho(idioma, "/obras")}
              className="etiqueta inline-flex min-h-11 items-center"
            >
              {t("acao.ver_obras", idioma)}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="grid gap-6" style={colunas(280)}>
          {ficheiros.map((f) => (
            <li key={f.id} className="contents">
              <a
                href={`/api/descarregar/${f.slug}`}
                className="flex flex-col gap-4 border border-fio p-8 text-papel transition-colors hover:border-ouro hover:bg-ouro-lavado"
              >
                <span className="etiqueta text-claro-55">
                  {texto(f.etiqueta, idioma)}
                </span>
                <span className="titulo-med text-[24px]">
                  {texto(f.nome, idioma)}
                </span>
                <span className="meta text-claro-55">
                  {texto(f.descricao, idioma)}
                </span>
                <span className="etiqueta mt-auto pt-5 text-ouro">
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
