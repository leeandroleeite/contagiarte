import NextImage from "next/image";
import { urlMedia } from "@/lib/media/url";
import { cx } from "@/lib/utils";

export type MediaLeve = {
  chave: string;
  largura?: number | null;
  altura?: number | null;
  blur?: string | null;
  corDominante?: string | null;
} | null;

type Props = {
  media: MediaLeve;
  alt: string;
  /** Proporção do enquadramento, ex. "3/4". Omitir para preencher o pai. */
  proporcao?: string;
  /** `cover` corta para encher; `contain` mostra a obra inteira. */
  ajuste?: "cover" | "contain";
  /** Texto do marcador quando ainda não há fotografia. */
  legenda?: string;
  sizes?: string;
  prioridade?: boolean;
  /** Revela por clip-path quando entra no ecrã. */
  revelar?: boolean;
  className?: string;
};

/**
 * Enquadramento de imagem do site. Substitui o `<image-slot>` do
 * protótipo: quando não há fotografia carregada, desenha um marcador
 * com a mesma proporção em vez de deixar um buraco no layout.
 */
export function Imagem({
  media,
  alt,
  proporcao,
  ajuste = "cover",
  legenda,
  sizes = "(max-width: 900px) 100vw, 50vw",
  prioridade = false,
  revelar = true,
  className,
}: Props) {
  const src = urlMedia(media?.chave);
  const estilo = proporcao ? { aspectRatio: proporcao } : undefined;

  if (!src) {
    return (
      <div
        style={estilo}
        className={cx(
          "relative flex w-full items-center justify-center overflow-hidden border border-dashed border-[rgba(242,237,228,0.18)] bg-[#151211]",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <span className="max-w-[24ch] px-4 text-center text-[11px] tracking-[0.2em] text-[rgba(242,237,228,0.55)] uppercase">
          {legenda ?? alt}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ ...estilo, background: media?.corDominante ?? "#151211" }}
      className={cx("relative w-full overflow-hidden", className)}
      data-revelar={revelar ? "" : undefined}
    >
      <NextImage
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={prioridade}
        placeholder={media?.blur ? "blur" : "empty"}
        blurDataURL={media?.blur ?? undefined}
        className={ajuste === "contain" ? "object-contain" : "object-cover"}
      />
    </div>
  );
}
