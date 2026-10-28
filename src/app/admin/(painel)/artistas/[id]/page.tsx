import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BarraGuardar } from "@/components/admin/BarraGuardar";
import { BotaoApagar } from "@/components/admin/BotaoApagar";
import { CampoMedia } from "@/components/admin/CampoMedia";
import {
  CampoLocalizado,
  CampoSelect,
  CampoTexto,
} from "@/components/admin/Campos";
import { Grelha, CabecalhoSeccao, Conteudo } from "@/components/admin/Pecas";
import { apagarArtista, guardarArtista } from "@/lib/admin/accoes";
import { listarMedia } from "@/lib/admin/media";
import { db } from "@/lib/db";
import { artistas, disciplinas } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function EditarArtista({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const novo = id === "novo";

  const [artista, biblioteca, tipologias] = await Promise.all([
    novo
      ? null
      : db.query.artistas.findFirst({
          where: eq(artistas.id, id),
          with: { retrato: true },
        }),
    listarMedia("imagem"),
    db.query.disciplinas.findMany({ orderBy: [asc(disciplinas.ordem)] }),
  ]);

  if (!novo && !artista) notFound();

  const guardar = guardarArtista.bind(null, novo ? null : id);
  const apagar = apagarArtista.bind(null, id);

  return (
    <>
      <CabecalhoSeccao descricao={artista ? `/artistas/${artista.slug}` : undefined}>
        {novo ? "Novo artista" : artista!.nome}
      </CabecalhoSeccao>

      <Conteudo>
      <form action={guardar}>
        <Grelha>
          <CampoTexto
            nome="nome"
            rotulo="Nome"
            valor={artista?.nome}
            obrigatorio
            nota="Como aparece na lista, normalmente em maiúsculas."
          />

          <CampoTexto
            nome="slug"
            rotulo="Endereço (slug)"
            valor={artista?.slug}
            nota="Deixe vazio para gerar a partir do nome."
          />

          <CampoSelect
            nome="disciplinaId"
            rotulo="Tipologia"
            // Um artista novo começa na primeira da lista; um que já
            // existe e não tem nenhuma fica em "Sem tipologia".
            valor={novo ? (tipologias[0]?.id ?? "") : (artista!.disciplinaId ?? "")}
            opcoes={[
              ...tipologias.map((d) => ({
                valor: d.id,
                rotulo: d.nota?.pt ? `${d.nome.pt} (${d.nota.pt})` : d.nome.pt,
              })),
              { valor: "", rotulo: "Sem tipologia" },
            ]}
            nota="Alimenta o filtro da lista de artistas. A lista edita-se em Tipologias."
          />

          <CampoTexto
            nome="naturalidade"
            rotulo="Naturalidade"
            valor={artista?.naturalidade}
            placeholder="Porto, Portugal"
          />

          <CampoTexto
            nome="instagram"
            rotulo="Instagram"
            valor={artista?.instagram}
            placeholder="nomedoartista"
            nota="Só o nome de utilizador, sem @ nem endereço."
          />

          <CampoTexto
            nome="website"
            rotulo="Site"
            tipo="url"
            valor={artista?.website}
          />

          <CampoMedia
            nome="retratoId"
            rotulo="Retrato"
            valor={artista?.retrato ?? null}
            biblioteca={biblioteca}
            largo
          />

          <CampoLocalizado
            nome="nota"
            rotulo="Nota curta"
            valor={artista?.nota}
            nota="Uma linha, mostrada ao lado do nome na lista."
            largo
          />

          <CampoLocalizado
            nome="biografia"
            rotulo="Biografia"
            valor={artista?.biografia}
            linhas={8}
            nota="Separe parágrafos com uma linha em branco."
            largo
          />

          <CampoLocalizado
            nome="citacao"
            rotulo="Citação"
            valor={artista?.citacao}
            linhas={3}
            nota="Aparece em bloco claro, no meio da página do artista."
            largo
          />

          <CampoSelect
            nome="estado"
            rotulo="Estado"
            valor={artista?.estado ?? "rascunho"}
            opcoes={[
              { valor: "rascunho", rotulo: "Rascunho (não aparece no site)" },
              { valor: "publicado", rotulo: "Publicado" },
              { valor: "arquivado", rotulo: "Arquivado" },
            ]}
          />

          <CampoTexto
            nome="ordem"
            rotulo="Ordem"
            tipo="number"
            valor={artista?.ordem ?? 0}
          />
        </Grelha>

        <BarraGuardar
          voltarPara="/admin/artistas"
          extra={
            !novo && (
              <BotaoApagar
                accao={apagar}
                rotulo="Apagar artista"
                pergunta="Apagar este artista? As obras dele ficam sem autor."
              />
            )
          }
        />
      </form>
      </Conteudo>
    </>
  );
}
