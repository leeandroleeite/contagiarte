import type { Metadata } from "next";
import { Botao } from "@/components/Botao";
import { FormularioPedido } from "@/components/FormularioPedido";
import { Imagem } from "@/components/Imagem";
import { Seccao } from "@/components/Seccao";
import { obterDefinicoes, obterTextos } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, linkWhatsApp } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return metadados({
    idioma: lang,
    path: "/molduras",
    titulo: comMarca(t("faixa.molduras", lang)),
    descricao:
      lang === "pt"
        ? "Molduras à medida com a MOLDARTPÓVOA: vidro museu Tru-Vue®, madeiras naturais e alumínio de precisão, com recolha, entrega e instalação."
        : lang === "en"
          ? "Bespoke framing with MOLDARTPÓVOA: Tru-Vue® museum glass, natural woods and precision aluminium, with collection, delivery and installation."
          : "Marcos a medida con MOLDARTPÓVOA: vidrio museo Tru-Vue®, maderas naturales y aluminio de precisión, con recogida, entrega e instalación.",
  });
}

export default async function PaginaMolduras({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const [def, txt] = await Promise.all([obterDefinicoes(), obterTextos()]);

  const passos =
    idioma === "pt"
      ? [
          ["01 · MEDIR", "Diz-nos as medidas da obra, ou levantamo-la em sua casa."],
          ["02 · ESCOLHER", "Vê madeiras, alumínios e vidros, com orçamento na hora."],
          ["03 · PRODUZIR", "A MOLDARTPÓVOA produz a moldura à medida na fábrica."],
          ["04 · INSTALAR", "Entregamos e deixamos a obra pendurada no sítio certo."],
        ]
      : idioma === "en"
        ? [
            ["01 · MEASURE", "Tell us the dimensions, or we collect the work from you."],
            ["02 · CHOOSE", "See woods, aluminium and glass, with a quote on the spot."],
            ["03 · MAKE", "MOLDARTPÓVOA makes the frame to measure at the factory."],
            ["04 · INSTALL", "We deliver and hang the work in the right place."],
          ]
        : [
            ["01 · MEDIR", "Díganos las medidas, o recogemos la obra en su casa."],
            ["02 · ELEGIR", "Vea maderas, aluminios y vidrios, con presupuesto al momento."],
            ["03 · PRODUCIR", "MOLDARTPÓVOA produce el marco a medida en fábrica."],
            ["04 · INSTALAR", "Entregamos y dejamos la obra colgada en el sitio adecuado."],
          ];

  return (
    <>
      <Seccao className="pt-[160px]">
        <div
          className="grid items-center gap-16"
          style={colunas(360)}
        >
          <div className="flex flex-col gap-[26px]">
            <span className="text-[11px] tracking-[0.3em] text-[rgba(242,237,228,0.5)] uppercase">
              {texto(txt["molduras.etiqueta"], idioma)}
            </span>
            <h1 className="titulo d-1">{t("faixa.molduras", idioma)}</h1>
            <p className="max-w-[48ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.8)]">
              {texto(txt["molduras.texto"], idioma)}
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Botao
                externo
                href={linkWhatsApp(
                  def.whatsapp,
                  "Olá, queria um orçamento de moldura.",
                )}
              >
                {t("acao.whatsapp", idioma)}
              </Botao>
              <Botao variante="linha" href={caminho(idioma, "/ver-na-parede")}>
                {t("acao.parede", idioma)}
              </Botao>
            </div>
          </div>

          <Imagem
            media={null}
            alt="Moldura produzida em parceria com a MOLDARTPÓVOA"
            proporcao="1/1"
            legenda="Molduras MOLDARTPÓVOA"
            sizes="(max-width: 900px) 100vw, 45vw"
          />
        </div>
      </Seccao>

      <Seccao claro className="px-7 py-[120px]">
        <div
          className="grid gap-12"
          style={colunas(220)}
        >
          {passos.map(([titulo, descricao]) => (
            <div
              key={titulo}
              className="flex flex-col gap-4 border-t-2 border-tinta pt-6"
            >
              <span className="titulo text-[14px] tracking-[0.1em]">{titulo}</span>
              <p className="text-[17px] leading-[1.6] text-escuro-78">
                {descricao}
              </p>
            </div>
          ))}
        </div>
      </Seccao>

      <Seccao semFio>
        <div className="max-w-[720px]">
          <h2 className="titulo d-2 mb-8">{t("acao.orcamento", idioma)}</h2>
          <FormularioPedido
            idioma={idioma}
            tipo="moldura"
            comMedidas
            origem="pagina-molduras"
          />
        </div>
      </Seccao>
    </>
  );
}
