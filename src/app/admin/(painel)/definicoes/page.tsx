import { EditorDefinicoes } from "@/components/admin/EditorDefinicoes";
import type { MediaEscolhivel } from "@/components/admin/CampoMedia";
import { guardarDefinicoes } from "@/lib/admin/accoes";
import { listarMedia } from "@/lib/admin/media";
import { exposicaoEmDestaque, obterDefinicoes, obterTextos } from "@/lib/dados";
import { DEFINICOES_OMISSAO } from "@/lib/db/omissoes";
import { env } from "@/lib/env";
import { texto } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PaginaDefinicoes({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;
  const [d, linhas, txt, expo] = await Promise.all([
    obterDefinicoes(),
    listarMedia("imagem"),
    // A pré-visualização é o rodapé do site, com a mesma frase no
    // WhatsApp, e o cartão de partilha leva a mesma fotografia.
    obterTextos(),
    exposicaoEmDestaque(),
  ]);

  const biblioteca: MediaEscolhivel[] = linhas.map((m) => ({
    id: m.id,
    chave: m.chave,
    nomeOriginal: m.nomeOriginal,
    tipoMime: m.tipoMime,
  }));
  const imagem = (id?: string | null) =>
    biblioteca.find((m) => m.id === id) ?? null;

  return (
    <EditorDefinicoes
      // Guardar volta a esta página: com outras definições, os campos
      // desenham-se de novo e o que estava por guardar passa a guardado.
      key={JSON.stringify(d)}
      definicoes={d}
      omissoes={{
        email: DEFINICOES_OMISSAO.email,
        telefone: DEFINICOES_OMISSAO.telefone,
        whatsapp: DEFINICOES_OMISSAO.whatsapp,
        instagram: DEFINICOES_OMISSAO.instagram,
      }}
      imagens={{
        og: imagem(d.ogImagemId),
        moldura: imagem(d.molduraImagemId),
        galeria: imagem(d.galeriaImagemId),
      }}
      biblioteca={biblioteca}
      mensagemWhatsApp={texto(txt["whatsapp.site"], "pt")}
      capaPartilha={expo?.imagem?.chave ?? null}
      endereco={env.urlPublico.replace(/^https?:\/\//, "")}
      ambiente={env.ambiente}
      guardado={Boolean(guardado)}
      guardar={guardarDefinicoes}
    />
  );
}
