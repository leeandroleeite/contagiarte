import type { Metadata } from "next";
import { Imagem } from "@/components/Imagem";
import { ListaArtistas } from "@/components/ListaArtistas";
import { Seccao, TituloSeccao } from "@/components/Seccao";
import { listarArtistas, obterTextos } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import Link from "next/link";
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
    path: "/artistas",
    titulo: comMarca(t("nav.artistas", lang)),
    descricao:
      lang === "pt"
        ? "Os artistas representados pela Galeria Contagiarte, entre pintura, escultura, cerâmica e colagem."
        : lang === "en"
          ? "The artists represented by Galeria Contagiarte, across painting, sculpture, ceramics and collage."
          : "Los artistas representados por la Galería Contagiarte, entre pintura, escultura, cerámica y collage.",
  });
}

export default async function PaginaArtistas({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;
  const [artistas, txt] = await Promise.all([listarArtistas(), obterTextos()]);

  return (
    <>
      <Seccao className="pt-[160px]">
        <TituloSeccao nota={String(artistas.length).padStart(2, "0")}>
          {t("nav.artistas", idioma).toUpperCase()}
        </TituloSeccao>

        <ListaArtistas
          idioma={idioma}
          nota={texto(txt["artistas.nota"], idioma)}
          artistas={artistas.map((a) => ({
            slug: a.slug,
            nome: a.nome,
            disciplina: a.disciplina,
            nota: texto(a.nota, idioma),
            temPagina: true,
          }))}
        />
      </Seccao>

      <Seccao semFio>
        <ul
          className="grid gap-x-6 gap-y-12"
          style={colunas(240, "auto-fill")}
        >
          {artistas.map((a) => (
            <li key={a.id}>
              <Link
                href={caminho(idioma, `/artistas/${a.slug}`)}
                className="group flex flex-col gap-3.5 text-papel"
              >
                <Imagem
                  media={a.retrato}
                  alt={`Retrato de ${a.nome}`}
                  proporcao="3/4"
                  legenda={a.nome}
                  sizes="(max-width: 700px) 50vw, 24vw"
                />
                <span className="titulo-med text-[18px] uppercase transition-colors group-hover:text-ouro">
                  {a.nome}
                </span>
                <span className="text-[14px] text-claro-55">
                  {texto(a.nota, idioma)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Seccao>
    </>
  );
}
