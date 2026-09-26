import type { Metadata } from "next";
import { Botao } from "@/components/Botao";
import { FormularioNewsletter } from "@/components/FormularioNewsletter";
import { FormularioPedido } from "@/components/FormularioPedido";
import { Seccao } from "@/components/Seccao";
import { obterDefinicoes, obterTextos } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, linkWhatsApp } from "@/lib/utils";
import { DadosEstruturados, galeria } from "@/lib/dados-estruturados";

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
    path: "/contactos",
    titulo: comMarca(t("nav.contactos", lang)),
    descricao: texto(txt["contactos.descricao"], lang),
  });
}

export default async function PaginaContactos({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const [def, txt] = await Promise.all([obterDefinicoes(), obterTextos()]);
  const T = (chave: string) => texto(txt[chave], idioma);

  return (
    <>
      <DadosEstruturados dados={galeria(def, idioma)} />

      <Seccao className="pt-[160px]">
        <h1 className="titulo d-contactos mb-12">
          {t("rodape.fale", idioma).toUpperCase()}
        </h1>

        <div className="grid gap-16" style={colunas(300)}>
          <div className="flex flex-col gap-6">
            <p className="max-w-[44ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.8)]">
              {T("contactos.intro")}
            </p>

            <div className="flex flex-col gap-3 text-[18px]">
              <a
                href={linkWhatsApp(def.whatsapp, T("whatsapp.site"))}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp →
              </a>
              <a href={`mailto:${def.email}`}>{def.email}</a>
              <a href={`tel:${def.telefone.replace(/\s/g, "")}`}>
                {def.telefone}
              </a>
              <a
                href={`https://instagram.com/${def.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{def.instagram}
              </a>
            </div>

            {def.morada && (
              <p className="text-[15px] text-claro-55">{def.morada}</p>
            )}

            <Botao
              externo
              className="self-start"
              href={linkWhatsApp(def.whatsapp, T("contactos.whatsapp.visita"))}
            >
              {t("acao.visita", idioma)}
            </Botao>
          </div>

          <div className="flex flex-col gap-4 border border-[rgba(242,237,228,0.2)] p-7">
            <span className="text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.55)] uppercase">
              {t("campo.mensagem", idioma)}
            </span>
            <FormularioPedido
              idioma={idioma}
              tipo="contacto"
              origem="pagina-contactos"
            />
          </div>
        </div>
      </Seccao>

      <Seccao claro semFio>
        <div className="grid items-center gap-16" style={colunas(340)}>
          <div className="flex flex-col gap-5">
            <span className="text-[11px] tracking-[0.3em] text-[rgba(14,12,11,0.62)] uppercase">
              {T("newsletter.etiqueta")}
            </span>
            <h2 className="titulo max-w-[14ch] text-[clamp(34px,5.5vw,88px)] leading-[0.9]">
              {T("newsletter.titulo")}
            </h2>
            <p className="max-w-[44ch] text-[17px] leading-[1.6] text-[rgba(14,12,11,0.7)]">
              {T("newsletter.texto")}
            </p>
          </div>
          <FormularioNewsletter idioma={idioma} origem="pagina-contactos" />
        </div>
      </Seccao>
    </>
  );
}
