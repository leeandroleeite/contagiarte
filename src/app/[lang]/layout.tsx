import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { BotaoWhatsApp } from "@/components/BotaoWhatsApp";
import { Movimento } from "@/components/Movimento";
import { Rodape } from "@/components/Rodape";
import { obterDefinicoes } from "@/lib/dados";
import { eIdioma, HREFLANG, IDIOMAS, type Idioma } from "@/lib/i18n/config";
import { t } from "@/lib/i18n";

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

  const def = await obterDefinicoes();

  return (
    <div lang={HREFLANG[idioma]} className="min-h-dvh bg-tinta text-papel">
      <div
        id="barra-progresso"
        aria-hidden="true"
        className="fixed top-0 left-0 z-[130] h-[2px] w-0 bg-ouro"
      />

      <Cabecalho idioma={idioma} />

      <main id="conteudo">{children}</main>

      <Rodape idioma={idioma} definicoes={def} />

      <BotaoWhatsApp
        numero={def.whatsapp}
        rotulo={t("acao.whatsapp", idioma)}
        mensagem="Olá, venho do site da Galeria Contagiarte."
      />

      <Movimento />
    </div>
  );
}
