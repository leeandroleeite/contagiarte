import { Pagina404 } from "@/components/Pagina404";

/**
 * O `not-found` do segmento de idioma não recebe params, por isso
 * responde em português, a língua de origem do site.
 */
export default function NaoEncontrado() {
  return <Pagina404 />;
}
