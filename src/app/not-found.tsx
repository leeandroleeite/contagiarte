import { Cabecalho } from "@/components/Cabecalho";
import { Pagina404 } from "@/components/Pagina404";
import { Rodape } from "@/components/Rodape";
import { obterDefinicoes } from "@/lib/dados";
import { IDIOMA_BASE } from "@/lib/i18n/config";

/**
 * Endereços que não correspondem a rota nenhuma caem aqui, fora do
 * segmento de idioma. Como não há layout de site por cima, esta página
 * traz o seu próprio cabeçalho e rodapé, para o visitante não aterrar
 * num ecrã sem saída.
 */
export default async function NaoEncontradoRaiz() {
  const def = await obterDefinicoes();

  return (
    <div className="min-h-dvh bg-tinta text-papel">
      <Cabecalho idioma={IDIOMA_BASE} />
      <main id="conteudo">
        <Pagina404 />
      </main>
      <Rodape idioma={IDIOMA_BASE} definicoes={def} />
    </div>
  );
}
