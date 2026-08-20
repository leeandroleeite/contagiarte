import type { Metadata } from "next";
import { Seccao } from "@/components/Seccao";
import { obterDefinicoes, obterTextos } from "@/lib/dados";
import { texto, type Idioma } from "@/lib/i18n";
import { comMarca, metadados } from "@/lib/metadados";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return metadados({
    idioma: lang,
    path: "/privacidade",
    titulo: comMarca(
      lang === "pt"
        ? "Política de privacidade"
        : lang === "en"
          ? "Privacy policy"
          : "Política de privacidad",
    ),
    descricao:
      lang === "pt"
        ? "Que dados a galeria guarda quando alguém envia um pedido ou subscreve a newsletter, durante quanto tempo, e como se pedem apagados."
        : lang === "en"
          ? "What the gallery stores when someone sends an enquiry or subscribes, for how long, and how to ask for it to be deleted."
          : "Qué datos guarda la galería cuando alguien envía una solicitud o se suscribe, durante cuánto tiempo, y cómo pedir que se borren.",
    semIndice: true,
  });
}

export default async function PaginaPrivacidade({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const [txt, def] = await Promise.all([obterTextos(), obterDefinicoes()]);

  const conteudo = texto(txt["privacidade.conteudo"], idioma)
    .replaceAll("{email}", def.email)
    .replaceAll("{telefone}", def.telefone);

  return (
    <Seccao className="pt-[160px]" semFio>
      <div className="mb-12 flex flex-col gap-4">
        <span className="text-[11px] tracking-[0.28em] text-[rgba(242,237,228,0.55)] uppercase">
          {idioma === "pt"
            ? "Documento legal"
            : idioma === "en"
              ? "Legal document"
              : "Documento legal"}
        </span>
        <h1 className="titulo text-[clamp(34px,5vw,68px)] leading-[0.92]">
          {idioma === "pt"
            ? "POLÍTICA DE PRIVACIDADE"
            : idioma === "en"
              ? "PRIVACY POLICY"
              : "POLÍTICA DE PRIVACIDAD"}
        </h1>
        {/* Aviso do design. Sai quando um advogado rever o texto. */}
        <p className="text-[14px] text-[rgba(242,237,228,0.55)]">
          {idioma === "pt"
            ? "Rascunho por rever juridicamente. Última atualização: por definir."
            : idioma === "en"
              ? "Draft pending legal review. Last updated: to be defined."
              : "Borrador pendiente de revisión jurídica. Última actualización: por definir."}
        </p>
      </div>

      <div className="max-w-[72ch]">
        {conteudo.split(/\n\s*\n/).map((bloco, i) => {
          const linha = bloco.trim();
          if (linha.startsWith("## ")) {
            return (
              <h2
                key={i}
                className="titulo-med mt-12 mb-4 text-[20px] tracking-normal"
              >
                {linha.slice(3)}
              </h2>
            );
          }
          return (
            <p
              key={i}
              className="mb-5 text-[17px] leading-[1.7] text-[rgba(242,237,228,0.78)]"
            >
              {linha}
            </p>
          );
        })}
      </div>
    </Seccao>
  );
}
