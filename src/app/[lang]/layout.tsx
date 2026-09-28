import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { BotaoWhatsApp } from "@/components/BotaoWhatsApp";
import { Movimento } from "@/components/Movimento";
import { Segredos } from "@/components/Segredos";
import { Rodape } from "@/components/Rodape";
import { obterDefinicoes, obterTextos } from "@/lib/dados";
import { eIdioma, HREFLANG, IDIOMAS, type Idioma } from "@/lib/i18n/config";
import { t, texto } from "@/lib/i18n";

export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export default async function LayoutSite({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!eIdioma(lang)) notFound();
  const idioma = lang as Idioma;

  const [def, txt] = await Promise.all([obterDefinicoes(), obterTextos()]);
  // A mesma mensagem serve o botão flutuante e o rodapé; lida uma vez
  // aqui para não ir duas vezes à base pela mesma frase.
  const mensagemWhatsApp = texto(txt["whatsapp.site"], idioma);

  return (
    <div lang={HREFLANG[idioma]} className="min-h-dvh bg-tinta text-papel">
      <div
        id="barra-progresso"
        aria-hidden="true"
        className="fixed top-0 left-0 z-[130] h-[2px] w-full origin-left scale-x-0 bg-ouro"
      />

      <Cabecalho idioma={idioma} />

      {/* A passagem entre páginas: o conteúdo antigo sai depressa e o novo
          chega a subir. O cabeçalho e o botão flutuante ficam parados,
          para haver um ponto fixo enquanto o resto muda. */}
      <ViewTransition default="none" update="pagina">
        <main id="conteudo">{children}</main>
      </ViewTransition>

      <Rodape
        idioma={idioma}
        definicoes={def}
        mensagemWhatsApp={mensagemWhatsApp}
      />

      <BotaoWhatsApp
        numero={def.whatsapp}
        rotulo={t("acao.whatsapp", idioma)}
        mensagem={mensagemWhatsApp}
      />

      <Movimento />
      <Segredos idioma={idioma} />
    </div>
  );
}
