import { Botao } from "@/components/Botao";
import type { Localizado } from "@/lib/db/schema";
import { t, texto, type Idioma } from "@/lib/i18n";

/**
 * Botões de descarga dos catálogos ligados a uma exposição, ao lado dos
 * outros botões da página. Quase sempre há um só, e esse diz apenas
 * "Descarregar o catálogo". Quando a galeria liga mais do que um, cada
 * botão leva o nome do seu documento, para se saber qual é qual.
 *
 * O link passa por `/api/descarregar`, que conta a descarga.
 */
export function BotoesCatalogo({
  catalogos,
  idioma,
  className,
}: {
  catalogos: Array<{ id: string; slug: string; nome: Localizado }>;
  idioma: Idioma;
  className?: string;
}) {
  return catalogos.map((c) => (
    <Botao
      key={c.id}
      variante="linha"
      className={className}
      href={`/api/descarregar/${c.slug}`}
    >
      {catalogos.length === 1
        ? t("acao.descarregar_catalogo", idioma)
        : `${texto(c.nome, idioma)} (PDF) ↓`}
    </Botao>
  ));
}
