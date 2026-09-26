import { Botao } from "@/components/Botao";
import { obterDefinicoes, obterTextos, type MapaTextos } from "@/lib/dados";
import { DEFINICOES_OMISSAO } from "@/lib/db/omissoes";
import { t, texto } from "@/lib/i18n";
import { caminho, IDIOMA_BASE, type Idioma } from "@/lib/i18n/config";
import { linkWhatsApp } from "@/lib/utils";

/**
 * A página de erro 404, partilhada pelos dois sítios onde o Next a
 * pode pedir: o `not-found` da raiz (endereços que não correspondem a
 * rota nenhuma) e o do segmento de idioma (quando uma página chama
 * `notFound()` por não encontrar o registo).
 *
 * Com `semBase`, não lê a base de dados e usa os contactos de origem.
 * É o que o 404 da raiz precisa: o Next gera-o na compilação, onde não
 * há base nenhuma para ler.
 */
export async function Pagina404({
  idioma = IDIOMA_BASE,
  semBase = false,
}: {
  idioma?: Idioma;
  semBase?: boolean;
}) {
  const [txt, def]: [MapaTextos, typeof DEFINICOES_OMISSAO] = semBase
    ? [{}, DEFINICOES_OMISSAO]
    : await Promise.all([obterTextos(), obterDefinicoes()]);

  const titulo = texto(txt["404.titulo"], idioma) || t("404.titulo", idioma);
  const corpo = texto(txt["404.texto"], idioma) || t("404.texto", idioma);
  const mensagem =
    texto(txt["404.whatsapp"], idioma) || t("404.whatsapp", idioma);

  const rotulos =
    idioma === "en"
      ? ["Back to home", "Current exhibition", "Ask on WhatsApp"]
      : idioma === "es"
        ? ["Volver al inicio", "Exposición en curso", "Preguntar por WhatsApp"]
        : ["Voltar ao início", "Exposição em curso", "Perguntar por WhatsApp"];

  return (
    <div className="flex min-h-[80dvh] flex-col justify-center gap-8 px-7 pt-[140px] pb-16">
      <span className="text-[11px] tracking-[0.2em] text-[rgba(242,237,228,0.55)] uppercase">
        Erro 404
      </span>

      <h1 className="titulo max-w-[16ch] text-[clamp(40px,9vw,150px)] leading-[0.84]">
        {titulo}
      </h1>

      <p className="max-w-[46ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.75)]">
        {corpo}
      </p>

      <div className="flex flex-wrap gap-3.5">
        <Botao href={caminho(idioma, "/")}>{rotulos[0]}</Botao>
        <Botao variante="linha" href={caminho(idioma, "/exposicoes")}>
          {rotulos[1]}
        </Botao>
        <Botao
          variante="linha"
          externo
          href={linkWhatsApp(def.whatsapp, mensagem)}
        >
          {rotulos[2]}
        </Botao>
      </div>
    </div>
  );
}
