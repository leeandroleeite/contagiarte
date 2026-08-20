import type { Metadata } from "next";
import { Botao } from "@/components/Botao";
import { FormularioNewsletter } from "@/components/FormularioNewsletter";
import { FormularioPedido } from "@/components/FormularioPedido";
import { Seccao } from "@/components/Seccao";
import { obterDefinicoes, obterTextos } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, linkWhatsApp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return metadados({
    idioma: lang,
    path: "/contactos",
    titulo: comMarca(t("nav.contactos", lang)),
    descricao:
      lang === "pt"
        ? "Fale com a Galeria Contagiarte por WhatsApp, email ou telefone."
        : lang === "en"
          ? "Reach Galeria Contagiarte on WhatsApp, by email or by phone."
          : "Contacte con la Galería Contagiarte por WhatsApp, email o teléfono.",
  });
}

export default async function PaginaContactos({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const [def, txt] = await Promise.all([obterDefinicoes(), obterTextos()]);

  return (
    <>
      <Seccao className="pt-[160px]">
        <h1 className="titulo d-contactos mb-12">
          {t("rodape.fale", idioma).toUpperCase()}
        </h1>

        <div
          className="grid gap-16"
          style={colunas(300)}
        >
          <div className="flex flex-col gap-6">
            <p className="max-w-[44ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.8)]">
              {idioma === "pt"
                ? "O WhatsApp é o caminho mais rápido. Respondemos todos os dias."
                : idioma === "en"
                  ? "WhatsApp is the fastest route. We answer every day."
                  : "WhatsApp es la vía más rápida. Respondemos todos los días."}
            </p>

            <div className="flex flex-col gap-3 text-[18px]">
              <a
                href={linkWhatsApp(
                  def.whatsapp,
                  "Olá, venho do site da Galeria Contagiarte.",
                )}
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
              href={linkWhatsApp(
                def.whatsapp,
                "Olá, queria marcar uma visita à galeria.",
              )}
            >
              {t("acao.visita", idioma)}
            </Botao>
          </div>

          <div className="flex flex-col gap-4 border border-[rgba(242,237,228,0.2)] p-7">
            <span className="text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.5)] uppercase">
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
        <div
          className="grid items-center gap-16"
          style={colunas(340)}
        >
          <div className="flex flex-col gap-5">
            <span className="text-[11px] tracking-[0.3em] text-[rgba(14,12,11,0.5)] uppercase">
              NEWSLETTER
            </span>
            <h2 className="titulo max-w-[14ch] text-[clamp(34px,5.5vw,88px)] leading-[0.9]">
              {texto(txt["newsletter.titulo"], idioma)}
            </h2>
            <p className="max-w-[44ch] text-[17px] leading-[1.6] text-[rgba(14,12,11,0.7)]">
              {texto(txt["newsletter.texto"], idioma)}
            </p>
          </div>
          <FormularioNewsletter idioma={idioma} origem="pagina-contactos" />
        </div>
      </Seccao>
    </>
  );
}
