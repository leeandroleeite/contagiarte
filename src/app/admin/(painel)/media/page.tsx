import { GaleriaMedia } from "@/components/admin/GaleriaMedia";
import { Aviso, CabecalhoSeccao, Conteudo, Vazio } from "@/components/admin/Pecas";
import { listarMedia } from "@/lib/admin/media";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function PaginaMedia() {
  const itens = env.r2.configurado ? await listarMedia() : [];

  return (
    <>
      <CabecalhoSeccao descricao="Fotografias e documentos usados no site.">Media</CabecalhoSeccao>

      <Conteudo>
      {!env.r2.configurado ? (
        <Aviso tom="erro">
          O armazenamento R2 não está configurado neste ambiente. Defina
          R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET
          para poder carregar ficheiros.
        </Aviso>
      ) : (
        <>
          <GaleriaMedia itens={itens} />
          {itens.length === 0 && (
            <Vazio>Ainda não há ficheiros carregados.</Vazio>
          )}
        </>
      )}
      </Conteudo>
    </>
  );
}
