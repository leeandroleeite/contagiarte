import type { Metadata } from "next";
import { Seccao } from "@/components/Seccao";
import { obterDefinicoes, obterTextos } from "@/lib/dados";
import { texto, type Idioma } from "@/lib/i18n";
import { comMarca, metadados } from "@/lib/metadados";

export const revalidate = 3600;

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
      <h1 className="titulo d-2 mb-12">
        {idioma === "pt"
          ? "POLÍTICA DE PRIVACIDADE"
          : idioma === "en"
            ? "PRIVACY POLICY"
            : "POLÍTICA DE PRIVACIDAD"}
      </h1>

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
