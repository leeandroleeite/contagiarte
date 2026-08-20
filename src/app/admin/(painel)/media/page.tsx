import { GaleriaMedia } from "@/components/admin/GaleriaMedia";
import { Aviso, CabecalhoSeccao, Conteudo, Vazio } from "@/components/admin/Pecas";
import { listarMedia } from "@/lib/admin/media";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function PaginaMedia() {
  const itens = await listarMedia();
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

        <GaleriaMedia itens={itens} />

        {itens.length === 0 && <Vazio>Ainda não há ficheiros carregados.</Vazio>}
      </Conteudo>
    </>
  );
}
