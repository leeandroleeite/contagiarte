import Link from "next/link";
import { Imagem } from "@/components/Imagem";
import type { ObraLista } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { ordinal } from "@/lib/utils";

/** Cartão de obra: imagem 3:4, título, número de ordem e linha de meta. */
export function CartaoObra({
  obra,
  idioma,
  numero,
  largura,
  sizes = "(max-width: 900px) 78vw, 440px",
}: {
  obra: ObraLista;
  idioma: Idioma;
  numero?: number;
  /** Largura fixa, para o carrossel. Sem isto ocupa a célula da grelha. */
  largura?: string;
  sizes?: string;
}) {
  const titulo = texto(obra.titulo, idioma) || t("obra.sem_titulo", idioma);
  const meta = [
    obra.artista?.nome,
    texto(obra.tecnica, idioma),
    obra.disponibilidade === "vendida"
      ? t("estado.vendida", idioma)
      : obra.disponibilidade === "reservada"
        ? t("estado.reservada", idioma)
        : texto(obra.preco, idioma) || t("obra.sob_consulta", idioma),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={caminho(idioma, `/obras/${obra.slug}`)}
      className="group flex flex-col gap-4 text-papel hover:text-papel"
      style={largura ? { flex: "none", width: largura, scrollSnapAlign: "start" } : undefined}
    >
      <Imagem
        media={obra.fotografia}
        alt={`${titulo}, de ${obra.artista?.nome ?? "artista por atribuir"}`}
        proporcao="3/4"
        sizes={sizes}
      />
      <div className="flex items-baseline justify-between gap-4">
        <span className="titulo-med text-[22px] transition-colors group-hover:text-ouro">
          {titulo}
        </span>
        {numero !== undefined && (
          <span className="text-[12px] tracking-[0.16em] text-[rgba(242,237,228,0.45)]">
            {ordinal(numero)}
          </span>
        )}
      </div>
      <span className="text-[14px] text-claro-55">{meta}</span>
    </Link>
  );
}
