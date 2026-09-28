import { headers } from "next/headers";
import { Pagina404 } from "@/components/Pagina404";
import { CABECALHO_IDIOMA, eIdioma, IDIOMA_BASE } from "@/lib/i18n/config";

/**
 * O `not-found` do segmento de idioma não recebe params. O idioma vem
 * do cabeçalho que o proxy põe em cada pedido, como no layout de raiz:
 * antes respondia sempre em português, também em /en e /es.
 */
export default async function NaoEncontrado() {
  const pedido = (await headers()).get(CABECALHO_IDIOMA) ?? "";
  return <Pagina404 idioma={eIdioma(pedido) ? pedido : IDIOMA_BASE} />;
}
