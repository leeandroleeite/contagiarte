import { Imagem, type MediaLeve } from "@/components/Imagem";
import { cx } from "@/lib/utils";

/**
 * Uma obra, inteira, sobre passe-partout.
 *
 * O `Imagem` corta para encher, e isso serve a fotografias de lugares e
 * retratos. Numa obra não: medido, os cartões cortavam até 36% de uma
 * pintura, e a mesma obra aparecia a 3:4 numa página e quadrada noutra.
 * Aqui a moldura tem sempre a mesma proporção e a obra fica dentro dela
 * com a forma que o artista lhe deu.
 *
 * O hover (a obra cresce dentro da margem e um fio de ouro desenha a
 * moldura) vive em `.obra-moldura`, no globals.css, e está desligado com
 * movimento reduzido.
 */
export function ImagemObra({
  media,
  alt,
  legenda,
  proporcao = "4/5",
  sizes,
  prioridade,
  transicao,
  className,
}: {
  media: MediaLeve;
  alt: string;
  legenda?: string;
  proporcao?: string;
  sizes?: string;
  prioridade?: boolean;
  /** Nome da passagem entre páginas: a obra voa do cartão para a ficha. */
  transicao?: string;
  className?: string;
}) {
  return (
    <div
      className={cx("obra-moldura", className)}
      style={{
        aspectRatio: proporcao,
        viewTransitionName: transicao,
      }}
    >
      <div className="obra-moldura-interior">
        <Imagem
          media={media}
          alt={alt}
          legenda={legenda}
          ajuste="contain"
          sizes={sizes}
          prioridade={prioridade}
          className="h-full bg-transparent"
          semFundo
        />
      </div>
    </div>
  );
}
