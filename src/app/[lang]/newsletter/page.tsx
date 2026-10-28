import type { Metadata } from "next";
import { Botao } from "@/components/Botao";
import { FormularioNewsletter } from "@/components/FormularioNewsletter";
import { Seccao } from "@/components/Seccao";
import { obterTextos, TEXTOS_OMISSAO, type MapaTextos } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * O texto de uma chave, ou a omissão escrita em código quando a base
 * ainda não tem a linha. As chaves desta página nasceram depois da
 * base de produção, e só lá entram quando a semente correr.
 */
function leitor(txt: MapaTextos, idioma: Idioma) {
  return (chave: string) => texto(txt[chave] ?? TEXTOS_OMISSAO[chave], idioma);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const T = leitor(await obterTextos(), lang);
  return metadados({
    idioma: lang,
    path: "/newsletter",
    titulo: comMarca(t("nav.newsletter", lang)),
    descricao: T("newsletter.descricao"),
  });
}

/**
 * Página própria da newsletter, pedida pela galeria: o bloco de
 * subscrição continua nos contactos e na entrada, mas aqui diz-se o
 * que se ganha em subscrever. Quatro vantagens, e o formulário de
 * sempre no bloco claro, que é onde ele foi desenhado para viver.
 */
export default async function PaginaNewsletter({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const T = leitor(await obterTextos(), idioma);

  return (
    <>
      <Seccao className="pt-[160px]">
        <span className="etiqueta text-claro-55">
          {T("newsletter.etiqueta")}
        </span>
        <h1 className="titulo my-5 max-w-[16ch] d-pagina">
          {T("newsletter.pagina.titulo")}
        </h1>
        <p className="lead max-w-[52ch] text-claro-80">
          {T("newsletter.pagina.intro")}
        </p>

        {/* No telemóvel o formulário fica quatro blocos abaixo: o botão
            leva lá direito, sem obrigar a ler tudo primeiro. */}
        <Botao href="#subscrever" className="mt-10">
          {t("acao.subscrever", idioma)} ↓
        </Botao>

        <ol className="mt-20 grid gap-9" style={colunas(230)}>
          {[1, 2, 3, 4].map((n) => (
            <li
              key={n}
              className="flex flex-col gap-3.5 border-t border-fio-forte pt-[22px]"
            >
              <span className="text-[11px] tracking-[0.2em] text-claro-55">
                {String(n).padStart(2, "0")}
              </span>
              <h2
                className="titulo-med text-[19px]"
                style={{ fontWeight: 800 }}
              >
                {T(`newsletter.vantagem.${n}.titulo`)}
              </h2>
              <p className="corpo text-claro-65">
                {T(`newsletter.vantagem.${n}.texto`)}
              </p>
            </li>
          ))}
        </ol>
      </Seccao>

      <Seccao id="subscrever" claro semFio>
        <div className="grid items-center gap-16" style={colunas(340)}>
          <div className="flex flex-col gap-5">
            <h2 className="titulo max-w-[14ch] d-seccao">
              {T("newsletter.pagina.subscrever")}
            </h2>
            <p className="corpo max-w-[44ch] text-escuro-78">
              {T("newsletter.pagina.nota")}
            </p>
          </div>
          <FormularioNewsletter idioma={idioma} origem="pagina-newsletter" />
        </div>
      </Seccao>
    </>
  );
}
