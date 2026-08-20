import type { Metadata } from "next";
import { Botao } from "@/components/Botao";
import { Seccao } from "@/components/Seccao";
import { obterDefinicoes, obterTextos } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, linkWhatsApp } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Série do gráfico. É a FORMA de uma carreira que se consolida, não a
 * cotação de ninguém: não há unidades, não há moeda, e o aviso ao lado
 * do título diz isso por extenso. Substituir por dados reais quando
 * existirem, ou remover a secção inteira.
 */
const SERIE = [
  { ano: "2016", altura: 12 },
  { ano: "2018", altura: 18 },
  { ano: "2019", altura: 26 },
  { ano: "2021", altura: 30 },
  { ano: "2022", altura: 52 },
  { ano: "2023", altura: 58 },
  { ano: "2025", altura: 74 },
  { ano: "2026", altura: 100 },
];

const MARCOS = [
  { ano: "2019", chave: "ativo.marco.1" },
  { ano: "2022", chave: "ativo.marco.2" },
  { ano: "2026", chave: "ativo.marco.3" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return metadados({
    idioma: lang,
    path: "/a-obra-como-ativo",
    titulo: comMarca(t("nav.ativo", lang)),
    descricao:
      lang === "pt"
        ? "O que faz uma obra de arte valorizar, o que a galeria avalia antes de representar um artista, e o que ninguém honesto lhe pode prometer."
        : lang === "en"
          ? "What makes a work of art appreciate, what the gallery assesses before representing an artist, and what nobody honest can promise you."
          : "Qué hace que una obra de arte se revalorice, qué evalúa la galería antes de representar a un artista, y lo que nadie honesto puede prometerle.",
  });
}

export default async function PaginaAtivo({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const [txt, def] = await Promise.all([obterTextos(), obterDefinicoes()]);
  const T = (chave: string) => texto(txt[chave], idioma);

  const garantias: Array<[string, string]> =
    idioma === "pt"
      ? [
          ["Certificado de autenticidade", "Em todas as obras"],
          ["Historial do artista", "A pedido"],
          ["Conservação e moldagem", "MOLDARTPÓVOA"],
          ["Revenda futura", "Acompanhamos"],
        ]
      : idioma === "en"
        ? [
            ["Certificate of authenticity", "On every work"],
            ["Artist's history", "On request"],
            ["Conservation and framing", "MOLDARTPÓVOA"],
            ["Future resale", "We help"],
          ]
        : [
            ["Certificado de autenticidad", "En todas las obras"],
            ["Historial del artista", "A petición"],
            ["Conservación y enmarcado", "MOLDARTPÓVOA"],
            ["Reventa futura", "Acompañamos"],
          ];

  return (
    <>
      {/* Abertura. */}
      <Seccao semFio className="px-7 pt-[130px] pb-[72px]">
        <span className="text-[11px] tracking-[0.3em] text-[rgba(242,237,228,0.55)] uppercase">
          {T("ativo.etiqueta")}
        </span>
        <h1 className="titulo my-5 max-w-[18ch] text-[clamp(38px,7.5vw,124px)] leading-[0.84]">
          {t("nav.ativo", idioma).toUpperCase()}
        </h1>
        <p className="max-w-[58ch] text-[19px] leading-[1.55] text-[rgba(242,237,228,0.8)]">
          {T("ativo.intro")}
        </p>
      </Seccao>

      {/* Os quatro critérios. */}
      <Seccao semFio className="px-7 pt-0 pb-24">
        <h2 className="titulo mb-10 text-[clamp(30px,4.4vw,68px)] leading-[0.9]">
          {T("ativo.criterios.titulo")}
        </h2>
        <div className="grid gap-9" style={colunas(250)}>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex flex-col gap-3.5 border-t border-[rgba(242,237,228,0.25)] pt-[22px]"
            >
              <span className="text-[11px] tracking-[0.2em] text-[rgba(242,237,228,0.55)]">
                {String(n).padStart(2, "0")}
              </span>
              <span className="titulo-med text-[19px]" style={{ fontWeight: 800 }}>
                {T(`ativo.criterio.${n}.titulo`)}
              </span>
              <p className="text-[16px] leading-[1.6] text-[rgba(242,237,228,0.7)]">
                {T(`ativo.criterio.${n}.texto`)}
              </p>
            </div>
          ))}
        </div>
      </Seccao>

      {/* Gráfico ilustrativo do percurso de um artista. */}
      <Seccao
        semFio
        className="border-t border-[rgba(242,237,228,0.14)] px-7 py-24"
      >
        <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-5">
          <h2 className="titulo text-[clamp(30px,4.4vw,68px)] leading-[0.9]">
            {T("ativo.grafico.titulo")}
          </h2>
          <span className="border border-[rgba(242,237,228,0.35)] px-3.5 py-2 text-[10px] tracking-[0.22em] text-[rgba(242,237,228,0.6)] uppercase">
            {idioma === "pt"
              ? "Exemplo ilustrativo"
              : idioma === "en"
                ? "Illustrative example"
                : "Ejemplo ilustrativo"}
          </span>
        </div>

        <p className="mb-12 max-w-[62ch] text-[16px] leading-[1.6] text-[rgba(242,237,228,0.65)]">
          {T("ativo.grafico.aviso")}
        </p>

        <figure className="m-0">
          <div
            className="flex h-[220px] items-end gap-2.5 border-b border-[rgba(242,237,228,0.25)] pb-4 sm:h-[280px] sm:gap-3.5"
            role="img"
            aria-label={T("ativo.grafico.aviso")}
          >
            {SERIE.map((p, i) => (
              <div
                key={p.ano}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2.5"
              >
                <span className="text-[12px] text-[rgba(242,237,228,0.55)]">
                  {i === SERIE.length - 1 ? "↑" : ""}
                </span>
                <div
                  className="w-full"
                  style={{
                    height: `${p.altura}%`,
                    background:
                      i === SERIE.length - 1
                        ? "#B4884A"
                        : "rgba(242,237,228,0.22)",
                  }}
                />
              </div>
            ))}
          </div>
          <figcaption className="flex gap-2.5 pt-3.5 sm:gap-3.5">
            {SERIE.map((p) => (
              <span
                key={p.ano}
                className="flex-1 text-center text-[11px] tracking-[0.06em] text-[rgba(242,237,228,0.55)] sm:text-[12px]"
              >
                {p.ano}
              </span>
            ))}
          </figcaption>
        </figure>

        <div className="mt-14 grid gap-7" style={colunas(240)}>
          {MARCOS.map((m) => (
            <div
              key={m.ano}
              className="flex flex-col gap-2.5 border-t border-[rgba(242,237,228,0.2)] pt-5"
            >
              <span className="text-[12px] tracking-[0.18em] text-[rgba(242,237,228,0.55)]">
                {m.ano}
              </span>
              <span className="text-[16px] leading-[1.55] text-[rgba(242,237,228,0.75)]">
                {T(m.chave)}
              </span>
            </div>
          ))}
        </div>
      </Seccao>

      {/* O que não prometemos. */}
      <Seccao claro semFio className="px-7 py-[110px]">
        <h2 className="titulo mb-8 max-w-[20ch] text-[clamp(32px,5vw,80px)] leading-[0.9]">
          {T("ativo.promessas.titulo")}
        </h2>
        <div className="grid max-w-[1100px] gap-9" style={colunas(260)}>
          {[1, 2, 3].map((n) => (
            <p key={n} className="text-[17px] leading-[1.6] text-escuro-78">
              {T(`ativo.promessa.${n}`)}
            </p>
          ))}
        </div>
      </Seccao>

      {/* Fecho. */}
      <Seccao semFio className="px-7 py-[110px]">
        <div className="grid items-center gap-12" style={colunas(300)}>
          <div className="flex flex-col gap-5">
            <h2 className="titulo text-[clamp(30px,4.4vw,68px)] leading-[0.88]">
              {T("ativo.final.titulo")}
            </h2>
            <p className="max-w-[46ch] text-[17px] leading-[1.6] text-[rgba(242,237,228,0.78)]">
              {T("ativo.final.texto")}
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Botao
                externo
                href={linkWhatsApp(
                  def.whatsapp,
                  "Olá, queria perceber melhor o percurso dos artistas que representam.",
                )}
              >
                {idioma === "pt"
                  ? "Falar connosco"
                  : idioma === "en"
                    ? "Talk to us"
                    : "Hablar con nosotros"}
              </Botao>
              <Botao variante="linha" href={caminho(idioma, "/ver-na-parede")}>
                {idioma === "pt"
                  ? "Ver na sua parede"
                  : idioma === "en"
                    ? "See it on your wall"
                    : "Ver en su pared"}
              </Botao>
            </div>
          </div>

          <dl className="flex flex-col text-[15px]">
            {garantias.map(([rotulo, valor], i) => (
              <div
                key={rotulo}
                className={`flex justify-between gap-4 border-t border-[rgba(242,237,228,0.16)] py-4 ${
                  i === garantias.length - 1
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
