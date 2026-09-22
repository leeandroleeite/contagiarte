import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Botao } from "@/components/Botao";
import { Percurso } from "@/components/Percurso";
import { Seccao } from "@/components/Seccao";
import {
  exposicaoPorSlug,
  obterDefinicoes,
  obterTextos,
} from "@/lib/dados";
import { periodo, t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, linkWhatsApp, resumir } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const expo = await exposicaoPorSlug(slug);
  if (!expo) return { title: "Percurso não encontrado" };

  const txt = await obterTextos();
  return metadados({
    idioma: lang,
    path: `/exposicoes/${slug}/percurso`,
    titulo: comMarca(
      `${texto(txt["percurso.titulo"], lang)}: ${texto(expo.titulo, lang)}`,
    ),
    descricao: resumir(texto(txt["percurso.intro"], lang)),
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

  const [txt, def] = await Promise.all([obterTextos(), obterDefinicoes()]);
  const T = (chave: string) => texto(txt[chave], idioma);

  const fim: Array<[string, string]> = [
    [
      idioma === "pt" ? "Morada" : idioma === "en" ? "Address" : "Dirección",
      expo.lugar?.morada ?? "",
    ],
    [
      idioma === "pt" ? "Reservas" : idioma === "en" ? "Booking" : "Reservas",
      texto(expo.reservas, idioma),
    ],
    [
      idioma === "pt" ? "Até" : idioma === "en" ? "Until" : "Hasta",
      expo.dataFim
        ? new Intl.DateTimeFormat(
            idioma === "pt" ? "pt-PT" : idioma === "en" ? "en-GB" : "es-ES",
            { day: "numeric", month: "long", year: "numeric" },
          ).format(new Date(expo.dataFim))
        : periodo(expo.dataInicio, expo.dataFim, idioma, expo.permanente),
    ],
  ].filter((par): par is [string, string] => Boolean(par[1]));

  return (
    <>
      {/* Abertura, antes de o percurso começar. */}
      <section className="flex min-h-[70dvh] flex-col justify-end px-7 pt-[120px] pb-12">
        <span className="text-[11px] tracking-[0.3em] text-[rgba(242,237,228,0.55)] uppercase">
          {[expo.lugar?.nome, texto(expo.lugar?.localidade, idioma)]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <h1 className="titulo mt-[18px] mb-4 text-[clamp(38px,8vw,130px)] leading-[0.84]">
          {T("percurso.titulo")}
        </h1>
        <p className="max-w-[54ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.78)]">
          {T("percurso.intro")}
        </p>
      </section>

      <Percurso
        salas={expo.salas.map((s) => ({
          id: s.id,
          nome: texto(s.nome, idioma),
          texto: texto(s.texto, idioma),
          notaObras: texto(s.notaObras, idioma),
          fotografia: s.fotografia,
        }))}
      />

      {/* Fecho: convite a visitar, com a informação prática. */}
      <Seccao
        semFio
        className="border-t border-[rgba(242,237,228,0.14)] px-7 py-[120px]"
      >
        <div className="grid items-center gap-12" style={colunas(300)}>
          <div className="flex flex-col gap-[22px]">
            <h2 className="titulo text-[clamp(32px,4.6vw,72px)] leading-[0.88]">
              {T("percurso.fim.titulo")}
            </h2>
            <p className="max-w-[46ch] text-[17px] leading-[1.6] text-[rgba(242,237,228,0.78)]">
              {T("percurso.fim.texto")}
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Botao
                externo
                href={linkWhatsApp(
                  def.whatsapp,
                  `Olá, queria marcar uma visita à exposição ${texto(expo.titulo, idioma)}.`,
                )}
              >
                {t("acao.visita", idioma)}
              </Botao>
              <Botao
                variante="linha"
                href={caminho(idioma, `/exposicoes/${slug}`)}
              >
                {t("acao.ver_exposicao", idioma)}
              </Botao>
            </div>
          </div>

          <dl className="flex flex-col text-[15px]">
            {fim.map(([rotulo, valor], i) => (
              <div
                key={rotulo}
                className={`flex justify-between gap-4 border-t border-[rgba(242,237,228,0.16)] py-4 ${
                  i === fim.length - 1
                    ? "border-b border-b-[rgba(242,237,228,0.16)]"
                    : ""
                }`}
              >
                <dt className="text-[rgba(242,237,228,0.55)]">{rotulo}</dt>
                <dd className="m-0 text-right">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Seccao>
    </>
  );
}
