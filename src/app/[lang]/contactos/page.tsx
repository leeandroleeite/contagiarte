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
        <h1 className="titulo d-pagina mb-12">
          {t("rodape.fale", idioma)}
        </h1>

        <div className="grid gap-16" style={colunas(300)}>
          <div className="flex flex-col gap-6">
            <p className="lead max-w-[44ch] text-claro-80">
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
              <p className="corpo text-claro-55">{def.morada}</p>
            )}

            <Botao
              externo
              className="self-start"
              href={linkWhatsApp(def.whatsapp, T("contactos.whatsapp.visita"))}
            >
              {t("acao.visita", idioma)}
            </Botao>
          </div>

          <div className="flex flex-col gap-4 border border-fio p-7">
            <span className="etiqueta text-claro-55">
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
            <span className="etiqueta text-escuro-62">
              {T("newsletter.etiqueta")}
            </span>
            <h2 className="titulo max-w-[14ch] d-seccao">
              {T("newsletter.titulo")}
            </h2>
            <p className="corpo max-w-[44ch] text-escuro-78">
              {T("newsletter.texto")}
            </p>
          </div>
          <FormularioNewsletter idioma={idioma} origem="pagina-contactos" />
        </div>
      </Seccao>
    </>
  );
}
