import { Botao } from "@/components/Botao";
import { obterDefinicoes, obterTextos } from "@/lib/dados";
import { t, texto } from "@/lib/i18n";
import { caminho, IDIOMA_BASE } from "@/lib/i18n/config";
import { linkWhatsApp } from "@/lib/utils";

/**
 * O `not-found` do segmento de idioma não recebe params, por isso
 * responde sempre em português, a língua de origem do site.
 */
export default async function NaoEncontrado() {
  const idioma = IDIOMA_BASE;
  const [txt, def] = await Promise.all([obterTextos(), obterDefinicoes()]);

  return (
    <div className="flex min-h-[80dvh] flex-col justify-center gap-8 px-7 pt-[140px] pb-16">
      <span className="text-[11px] tracking-[0.2em] text-[rgba(242,237,228,0.45)] uppercase">
        Erro 404
      </span>

      <h1 className="titulo max-w-[16ch] text-[clamp(40px,9vw,150px)] leading-[0.84]">
        {texto(txt["404.titulo"], idioma) || t("404.titulo", idioma)}
      </h1>

      <p className="max-w-[46ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.75)]">
        {texto(txt["404.texto"], idioma) || t("404.texto", idioma)}
      </p>

      <div className="flex flex-wrap gap-3.5">
        <Botao href={caminho(idioma, "/")}>Voltar ao início</Botao>
        <Botao variante="linha" href={caminho(idioma, "/exposicoes")}>
          Exposição em curso
        </Botao>
        <Botao
          variante="linha"
          externo
          href={linkWhatsApp(
            def.whatsapp,
            "Olá, andava à procura de algo no site.",
          )}
        >
          Perguntar por WhatsApp
        </Botao>
      </div>
    </div>
  );
}
