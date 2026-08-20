import type { Metadata } from "next";
import { Botao } from "@/components/Botao";
import { Seccao } from "@/components/Seccao";
import { obterDefinicoes } from "@/lib/dados";
import { t, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { linkWhatsApp } from "@/lib/utils";

export const revalidate = 3600;

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
        ? "Como a Galeria Contagiarte avalia o potencial de valorização de uma obra: percurso do artista, raridade, estado de conservação e procedência."
        : lang === "en"
          ? "How Galeria Contagiarte assesses a work's potential to appreciate: the artist's track record, rarity, condition and provenance."
          : "Cómo la Galería Contagiarte evalúa el potencial de revalorización de una obra: trayectoria del artista, rareza, estado de conservación y procedencia.",
  });
}

const CRITERIOS = {
  pt: [
    ["PERCURSO DO ARTISTA", "Exposições, coleções onde já entrou e continuidade de produção. Um percurso constante conta mais do que um pico isolado."],
    ["RARIDADE", "Peças únicas, séries curtas e obras de fases que o artista já não repete."],
    ["ESTADO E CONSERVAÇÃO", "Materiais estáveis, moldura adequada e vidro museu prolongam a vida da obra e defendem o seu valor."],
    ["PROCEDÊNCIA", "Certificado do artista, registo de compra e histórico de exposições. Sem papéis, o mercado desconta."],
    ["PROCURA REAL", "O que efectivamente se vende, e a que ritmo. Preço de tabela não é valor de mercado."],
    ["LIQUIDEZ", "Uma obra não é um depósito a prazo: vender pode demorar. Compre primeiro pelo que a peça lhe diz."],
  ],
  en: [
    ["THE ARTIST'S TRACK RECORD", "Exhibitions, collections already reached and continuity of output. A steady path counts for more than an isolated peak."],
    ["RARITY", "Unique pieces, short series and works from phases the artist no longer repeats."],
    ["CONDITION", "Stable materials, a proper frame and museum glass extend a work's life and defend its value."],
    ["PROVENANCE", "The artist's certificate, purchase record and exhibition history. Without paperwork, the market discounts."],
    ["REAL DEMAND", "What actually sells, and how fast. A list price is not a market value."],
    ["LIQUIDITY", "A work is not a term deposit: selling can take time. Buy first for what the piece says to you."],
  ],
  es: [
    ["TRAYECTORIA DEL ARTISTA", "Exposiciones, colecciones en las que ya ha entrado y continuidad de producción. Una trayectoria constante cuenta más que un pico aislado."],
    ["RAREZA", "Piezas únicas, series cortas y obras de fases que el artista ya no repite."],
    ["ESTADO Y CONSERVACIÓN", "Materiales estables, marco adecuado y vidrio museo prolongan la vida de la obra y defienden su valor."],
    ["PROCEDENCIA", "Certificado del artista, registro de compra e historial de exposiciones. Sin papeles, el mercado descuenta."],
    ["DEMANDA REAL", "Lo que efectivamente se vende, y a qué ritmo. El precio de catálogo no es valor de mercado."],
    ["LIQUIDEZ", "Una obra no es un depósito a plazo: vender puede tardar. Compre primero por lo que la pieza le dice."],
  ],
} as const;

export default async function PaginaAtivo({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const def = await obterDefinicoes();
  const criterios = CRITERIOS[idioma];

  return (
    <>
      <Seccao className="pt-[160px]">
        <span className="etiqueta">
          {idioma === "pt"
            ? "COMO AVALIAMOS"
            : idioma === "en"
              ? "HOW WE ASSESS"
              : "CÓMO EVALUAMOS"}
        </span>
        <h1 className="titulo d-1 mt-4 max-w-[16ch]">
          {t("nav.ativo", idioma).toUpperCase()}
        </h1>
        <p className="mt-8 max-w-[58ch] text-[19px] leading-[1.65] text-[rgba(242,237,228,0.82)]">
          {idioma === "pt"
            ? "Uma obra compra-se primeiro pelo que provoca. Mas há critérios objectivos que ajudam a perceber se também pode valer mais amanhã. São estes os seis que usamos, e dizemos sempre o que não sabemos."
            : idioma === "en"
              ? "A work is bought first for what it stirs. But there are objective criteria that help you see whether it may also be worth more tomorrow. These are the six we use, and we always say what we do not know."
              : "Una obra se compra primero por lo que provoca. Pero hay criterios objetivos que ayudan a entender si además puede valer más mañana. Estos son los seis que usamos, y siempre decimos lo que no sabemos."}
        </p>
      </Seccao>

      <Seccao claro className="px-7 py-[120px]">
        <div
          className="grid gap-12"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}
        >
          {criterios.map(([titulo, descricao], i) => (
            <div
              key={titulo}
              className="flex flex-col gap-4 border-t-2 border-tinta pt-6"
            >
              <span className="text-[11px] tracking-[0.24em] text-[rgba(14,12,11,0.45)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="titulo text-[14px] tracking-[0.1em]">
                {titulo}
              </span>
              <p className="text-[17px] leading-[1.6] text-escuro-78">
                {descricao}
              </p>
            </div>
          ))}
        </div>
      </Seccao>

      <Seccao semFio>
        <div className="max-w-[62ch]">
          <h2 className="titulo d-3">
            {idioma === "pt"
              ? "O QUE NÃO PROMETEMOS"
              : idioma === "en"
                ? "WHAT WE DO NOT PROMISE"
                : "LO QUE NO PROMETEMOS"}
          </h2>
          <p className="mt-6 text-[18px] leading-[1.65] text-[rgba(242,237,228,0.8)]">
            {idioma === "pt"
              ? "Não damos previsões de rentabilidade nem gráficos de valorização. Arte não é um produto financeiro, não somos consultores de investimento e não há garantia nenhuma de que uma obra valha mais amanhã. O que fazemos é escolher bem, documentar tudo e dizer-lhe o que sabemos e o que não sabemos sobre cada peça."
              : idioma === "en"
                ? "We give no return forecasts and no appreciation charts. Art is not a financial product, we are not investment advisers, and there is no guarantee that a work will be worth more tomorrow. What we do is choose carefully, document everything, and tell you what we know and what we do not know about each piece."
                : "No damos previsiones de rentabilidad ni gráficos de revalorización. El arte no es un producto financiero, no somos asesores de inversión y no hay garantía alguna de que una obra valga más mañana. Lo que hacemos es elegir bien, documentarlo todo y decirle lo que sabemos y lo que no sabemos sobre cada pieza."}
          </p>

          <div className="mt-10 flex flex-wrap gap-3.5">
            <Botao
              externo
              href={linkWhatsApp(
                def.whatsapp,
                "Olá, queria falar sobre uma obra e o seu potencial de valorização.",
              )}
            >
              {t("acao.whatsapp", idioma)}
            </Botao>
            <Botao variante="linha" href={caminho(idioma, "/obras")}>
              {t("nav.obras", idioma)}
            </Botao>
          </div>
        </div>
      </Seccao>
    </>
  );
}
