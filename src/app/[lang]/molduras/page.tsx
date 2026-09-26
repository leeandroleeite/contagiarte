import type { Metadata } from "next";
import { Botao } from "@/components/Botao";
import { FormularioPedido } from "@/components/FormularioPedido";
import { Imagem } from "@/components/Imagem";
import { Seccao } from "@/components/Seccao";
import {
  obterDefinicoes,
  obterImagensDoSite,
  obterTextos,
} from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
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
    path: "/molduras",
    titulo: comMarca(t("faixa.molduras", lang)),
    descricao: texto(txt["molduras.descricao"], lang),
  });
}

export default async function PaginaMolduras({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const [def, txt] = await Promise.all([obterDefinicoes(), obterTextos()]);
  const imagens = await obterImagensDoSite(def);

  // Os passos vêm da base, não daqui: a galeria muda-os no backoffice
  // sem esperar por um deploy. São sempre quatro, tantos quantos o
  // desenho previu; acrescentar um quinto é mexer no desenho também.
  const T = (chave: string) => texto(txt[chave], idioma);
  const passos = [1, 2, 3, 4].map((n) => ({
    numero: n,
    titulo: T(`molduras.passo${n}.titulo`),
    descricao: T(`molduras.passo${n}.texto`),
  }));

  return (
    <>
      <Seccao className="pt-[160px]">
        <div className="grid items-center gap-16" style={colunas(360)}>
          <div className="flex flex-col gap-[26px]">
            <span className="text-[11px] tracking-[0.3em] text-[rgba(242,237,228,0.55)] uppercase">
              {T("molduras.etiqueta")}
            </span>
            <h1 className="titulo d-1">{t("faixa.molduras", idioma)}</h1>
            <p className="max-w-[48ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.8)]">
              {T("molduras.texto")}
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Botao
                externo
                href={linkWhatsApp(def.whatsapp, T("molduras.whatsapp"))}
              >
                {t("acao.whatsapp", idioma)}
              </Botao>
              <Botao variante="linha" href={caminho(idioma, "/ver-na-parede")}>
                {t("acao.parede", idioma)}
              </Botao>
            </div>
          </div>

          <Imagem
            media={imagens.moldura}
            alt={T("molduras.imagem.alt")}
            proporcao="1/1"
            legenda={T("molduras.imagem.legenda")}
            sizes="(max-width: 900px) 100vw, 45vw"
          />
        </div>
      </Seccao>

      <Seccao claro className="px-7 py-[120px]">
        <div className="grid gap-12" style={colunas(220)}>
          {passos.map(({ numero, titulo, descricao }) => (
            <div
              key={numero}
              className="flex flex-col gap-4 border-t-2 border-tinta pt-6"
            >
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
