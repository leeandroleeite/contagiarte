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
          As imagens que aqui estão vieram do catálogo da galeria, extraídas
          de um PDF, e são de baixa resolução. Servem para o site poder ser
          visto como ficará. Substitua-as pelas fotografias originais: o
          endereço de cada obra não muda.
        </Aviso>

        <GaleriaMedia itens={itens} />

        {itens.length === 0 && <Vazio>Ainda não há ficheiros carregados.</Vazio>}
      </Conteudo>
    </>
  );
}
