import { Cabecalho } from "@/components/Cabecalho";
import { Pagina404 } from "@/components/Pagina404";
import { Rodape } from "@/components/Rodape";
import { DEFINICOES_OMISSAO } from "@/lib/db/omissoes";
import { IDIOMA_BASE } from "@/lib/i18n/config";

/**
 * Endereços que não correspondem a rota nenhuma caem aqui, fora do
 * segmento de idioma. Como não há layout de site por cima, esta página
 * traz o seu próprio cabeçalho e rodapé, para o visitante não aterrar
 * num ecrã sem saída.
 *
 * É a única página do site que não lê a base de dados. O Next gera o
 * 404 global na compilação, sempre, e não há forma de o adiar; usa por
 * isso os contactos de origem, que são os mesmos que a base traz até
 * alguém os mudar no backoffice.
 */
export default function NaoEncontradoRaiz() {
  const def = DEFINICOES_OMISSAO;

  return (
    <div className="min-h-dvh bg-tinta text-papel">
      <Cabecalho idioma={IDIOMA_BASE} />
      <main id="conteudo">
        <Pagina404 semBase />
      </main>
      <Rodape idioma={IDIOMA_BASE} definicoes={def} />
    </div>
  );
}
