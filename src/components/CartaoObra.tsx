import Link from "next/link";
import type { MediaLeve } from "@/components/Imagem";
import { ImagemObra } from "@/components/ImagemObra";
import { t, texto, type Idioma, type Localizado } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { cx, ordinal } from "@/lib/utils";

/** O mínimo que um cartão precisa de saber de uma obra. */
export type ObraCartao = {
  slug: string;
  titulo: Localizado | null;
  fotografia: MediaLeve;
  artista?: { nome: string } | null;
  ano?: number | null;
  tecnica?: Localizado | null;
  preco?: Localizado | null;
  disponibilidade?: string | null;
};

/**
 * O cartão de obra. Um só, em todo o site: antes havia quatro, e a mesma
 * obra mudava de proporção e de legenda de página para página.
 *
 * - `grande`: listas e carrossel. Título, número, artista, técnica, preço.
 * - `compacto`: grelhas dentro de fichas. Título e uma linha de meta.
 */
export function CartaoObra({
  obra,
  idioma,
  tamanho = "grande",
  meta = ["artista", "tecnica", "preco"],
  numero,
  largura,
  sizes = "(max-width: 900px) 78vw, 440px",
}: {
  obra: ObraCartao;
  idioma: Idioma;
  tamanho?: "grande" | "compacto";
  /** O que vai na linha por baixo do título, por esta ordem. */
  meta?: ("artista" | "ano" | "tecnica" | "preco")[];
  numero?: number;
  /** Largura fixa, para o carrossel. Sem isto ocupa a célula da grelha. */
  largura?: string;
  sizes?: string;
}) {
  const titulo = texto(obra.titulo, idioma) || t("obra.sem_titulo", idioma);
  const preco =
    obra.disponibilidade === "vendida"
      ? t("estado.vendida", idioma)
      : obra.disponibilidade === "reservada"
        ? t("estado.reservada", idioma)
        : texto(obra.preco, idioma) || t("obra.sob_consulta", idioma);

  const partes: Record<string, string | null | undefined> = {
    artista: obra.artista?.nome,
    ano: obra.ano ? String(obra.ano) : null,
    tecnica: texto(obra.tecnica, idioma),
    preco,
  };
  const linha = meta
    .map((m) => partes[m])
    .filter(Boolean)
    .join(" · ");

  const autor = obra.artista?.nome ?? t("obra.artista_por_atribuir", idioma);

  return (
    <Link
      href={caminho(idioma, `/obras/${obra.slug}`)}
      className={cx(
        "group flex flex-col text-papel hover:text-papel",
        tamanho === "grande" ? "gap-4" : "gap-3",
      )}
      style={largura ? { flex: "none", width: largura, scrollSnapAlign: "start" } : undefined}
      data-cursor-rotulo={t("cursor.ver", idioma)}
    >
      <ImagemObra
        media={obra.fotografia}
        alt={t("obra.alt", idioma, { titulo, autor })}
        legenda={titulo}
        sizes={sizes}
        transicao={`obra-${obra.slug}`}
      />
      <div className="flex items-baseline justify-between gap-4">
        <span
          className={cx(
            "titulo-med transition-colors duration-(--duracao-micro) group-hover:text-ouro",
            tamanho === "grande" ? "text-[22px]" : "text-[17px]",
          )}
        >
          {titulo}
        </span>
        {numero !== undefined && (
          <span className="etiqueta numeros text-claro-55">{ordinal(numero)}</span>
        )}
      </div>
      {linha && <span className="meta text-claro-55">{linha}</span>}
    </Link>
  );
}
