import { GaleriaMedia } from "@/components/admin/GaleriaMedia";
import { Aviso, CabecalhoSeccao, Conteudo, Vazio } from "@/components/admin/Pecas";
import { procurarMedia } from "@/lib/admin/media";
import { POR_PAGINA } from "@/lib/admin/paginacao";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function PaginaMedia({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; p?: string }>;
}) {
  const { q = "", p = "1" } = await searchParams;
  const { linhas: itens, total, pagina, paginas } = await procurarMedia({
    procura: q,
    pagina: Number(p) || 1,
  });
  const local = !env.r2.configurado;

  return (
    <>
      <CabecalhoSeccao descricao="Fotografias e documentos usados no site.">
        Media
      </CabecalhoSeccao>

      <Conteudo>
        {local && (
          <Aviso>
            Os ficheiros estão a ser guardados nesta máquina, em
            <code> public/media</code>, porque ainda não há R2 configurado.
            Funciona para ver e editar o site, mas para produção é preciso
            definir R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e
            R2_BUCKET.
          </Aviso>
        )}

        <Aviso>
          Há aqui dois conjuntos. As dezasseis com nomes como
          <code>obra-1.png</code> ou <code>artista-2.png</code> saíram do
          catálogo em PDF e têm 440px no lado maior: dão para ver como o
          site fica, mas num ecrã grande ficam desfocadas. As restantes
          vieram do sítio antigo da galeria, são originais e vão até
          2000px. Estas últimas não foram atribuídas a nenhuma obra, porque
          só quem conhece o espólio sabe qual é qual: abra a obra, escolha
          a fotografia certa, e o endereço dela não muda.
        </Aviso>

        {/* Pesquisa por formulário simples: funciona sem JavaScript e
            deixa o endereço guardar a procura. */}
        <form className="mb-7 flex flex-wrap items-center gap-3" action="">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Procurar por nome ou descrição"
            className="min-w-[16rem] flex-1"
            aria-label="Procurar na mediateca"
          />
          <button type="submit" className="adm-botao">
            Procurar
          </button>
          <span className="text-[13px] text-adm-suave">
            {total} ficheiro{total === 1 ? "" : "s"}
            {q && " encontrados"}
            {paginas > 1 && ` · página ${pagina} de ${paginas}`}
          </span>
        </form>

        <GaleriaMedia itens={itens} />

        {itens.length === 0 && (
          <Vazio>
            {q
              ? `Nada encontrado para "${q}".`
              : "Ainda não há ficheiros carregados."}
          </Vazio>
        )}

        {paginas > 1 && (
          <nav
            aria-label="Páginas da mediateca"
            className="mt-8 flex items-center justify-between gap-4"
          >
            {pagina > 1 ? (
              <a
                className="adm-botao"
                href={`?q=${encodeURIComponent(q)}&p=${pagina - 1}`}
              >
                ← Anteriores
              </a>
            ) : (
              <span />
            )}
            <span className="text-[13px] text-adm-suave">
              {(pagina - 1) * POR_PAGINA + 1} a{" "}
              {Math.min(pagina * POR_PAGINA, total)} de {total}
            </span>
            {pagina < paginas ? (
              <a
                className="adm-botao"
                href={`?q=${encodeURIComponent(q)}&p=${pagina + 1}`}
              >
                Seguintes →
              </a>
            ) : (
              <span />
            )}
          </nav>
        )}
      </Conteudo>
    </>
  );
}
