import type { Metadata } from "next";
import { Imagem } from "@/components/Imagem";
import { Seccao } from "@/components/Seccao";
import { listarLugares, obterTextos } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas } from "@/lib/utils";

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
    path: "/a-galeria",
    titulo: comMarca(t("nav.galeria", lang)),
    descricao: texto(txt["home.galeria.texto"], lang),
  });
}

export default async function PaginaGaleria({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const [txt, lugares] = await Promise.all([obterTextos(), listarLugares()]);

  return (
    <>
      <Seccao className="pt-[160px]">
        <div
          className="grid gap-16"
          style={colunas(320)}
        >
          <Imagem
            media={null}
            alt={texto(txt["home.galeria.imagem.alt"], idioma)}
            proporcao="4/5"
            legenda={texto(txt["home.galeria.imagem.legenda"], idioma)}
            prioridade
            sizes="(max-width: 900px) 100vw, 45vw"
          />
          <div className="flex flex-col justify-center gap-[26px]">
            <span className="text-[11px] tracking-[0.3em] text-[rgba(242,237,228,0.55)] uppercase">
              {t("nav.galeria", idioma).toUpperCase()}
            </span>
            <h1 className="titulo d-1">
              {texto(txt["home.galeria.titulo"], idioma)}
            </h1>
            <p className="max-w-[48ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.8)]">
              {texto(txt["home.galeria.texto"], idioma)}
            </p>
            <p className="text-[14px] tracking-[0.06em] text-[rgba(242,237,228,0.55)]">
              {texto(txt["home.galeria.assinatura"], idioma)}
            </p>
          </div>
        </div>
      </Seccao>

      <Seccao claro className="px-7 py-[140px]">
        <blockquote className="titulo mx-auto max-w-[22ch] text-center text-[clamp(30px,5vw,80px)] leading-[1.02]">
          {texto(txt["home.citacao"], idioma)}
        </blockquote>
        <p className="mt-9 text-center text-[11px] tracking-[0.24em] text-[rgba(14,12,11,0.62)]">
          {texto(txt["home.citacao.autor"], idioma)}
        </p>
      </Seccao>

      <Seccao semFio>
        <h2 className="titulo d-2 mb-12">
          {t("nav.lugares", idioma).toUpperCase()}
        </h2>
        <ul
          className="grid gap-x-6 gap-y-12"
          style={colunas(220, "auto-fill")}
        >
          {lugares.map((l) => (
            <li key={l.id} className="flex flex-col gap-3.5">
              <Imagem
                media={l.fotografia}
                alt={`${l.nome}, ${texto(l.localidade, idioma)}`}
                proporcao="3/4"
                legenda={l.nome}
                sizes="(max-width: 700px) 50vw, 22vw"
              />
              <span className="titulo-med text-[16px] uppercase">{l.nome}</span>
              <span className="text-[14px] text-claro-55">
                {texto(l.localidade, idioma)}
              </span>
            </li>
          ))}
        </ul>
      </Seccao>
    </>
  );
}
