import type { Metadata } from "next";
import { Imagem } from "@/components/Imagem";
import { Seccao, TituloSeccao } from "@/components/Seccao";
import { listarLugares, obterTextos } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return metadados({
    idioma: lang,
    path: "/lugares",
    titulo: comMarca(t("nav.lugares", lang)),
    descricao:
      lang === "pt"
        ? "Adegas, hotéis, clubes e centros culturais onde a Galeria Contagiarte expõe."
        : lang === "en"
          ? "Wineries, hotels, clubs and cultural centres where Galeria Contagiarte exhibits."
          : "Bodegas, hoteles, clubes y centros culturales donde expone la Galería Contagiarte.",
  });
}

export default async function PaginaLugares({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const [lugares, txt] = await Promise.all([listarLugares(), obterTextos()]);

  return (
    <Seccao className="pt-[160px]" semFio>
      <TituloSeccao
        nota={
          <span className="max-w-[40ch] text-[16px] leading-relaxed normal-case">
            {texto(txt["lugares.intro"], idioma)}
          </span>
        }
      >
        {t("nav.lugares", idioma).toUpperCase()}
      </TituloSeccao>

      <ul
        className="grid gap-x-6 gap-y-14"
        style={colunas(260, "auto-fill")}
      >
        {lugares.map((l) => (
          <li key={l.id} className="flex flex-col gap-4">
            <Imagem
              media={l.fotografia}
              alt={`${l.nome}, ${texto(l.localidade, idioma)}`}
              proporcao="3/4"
              legenda={l.nome}
              sizes="(max-width: 700px) 100vw, 25vw"
            />
            <span className="titulo-med text-[18px]">{l.nome}</span>
            <span className="text-[14px] text-claro-55">
              {[texto(l.localidade, idioma), texto(l.tipo, idioma)]
                .filter(Boolean)
                .join(" · ")}
            </span>
            {texto(l.descricao, idioma) && (
              <p className="text-[15px] leading-[1.6] text-[rgba(242,237,228,0.7)]">
                {texto(l.descricao, idioma)}
              </p>
            )}
            {l.site && (
              <a
                href={l.site}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-[12px] tracking-[0.18em] uppercase"
              >
                {new URL(l.site).hostname.replace("www.", "")} →
              </a>
            )}
          </li>
        ))}
      </ul>
    </Seccao>
  );
}
