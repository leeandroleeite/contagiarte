import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BarraGuardar } from "@/components/admin/BarraGuardar";
import { BotaoApagar } from "@/components/admin/BotaoApagar";
import { CampoMedia } from "@/components/admin/CampoMedia";
import {
  CampoLocalizado,
  CampoSelect,
  CampoTexto,
} from "@/components/admin/Campos";
import { Grelha, Titulo } from "@/components/admin/Pecas";
import {
  apagarDescarregavel,
  guardarDescarregavel,
} from "@/lib/admin/accoes";
import { listarMedia } from "@/lib/admin/media";
import { db } from "@/lib/db";
import { descarregaveis } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function EditarDescarregavel({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const novo = id === "novo";

  const [doc, biblioteca] = await Promise.all([
    novo
      ? null
      : db.query.descarregaveis.findFirst({
          where: eq(descarregaveis.id, id),
          with: { ficheiro: true },
        }),
    listarMedia("documento"),
  ]);

  if (!novo && !doc) notFound();

  const guardar = guardarDescarregavel.bind(null, novo ? null : id);
  const apagar = apagarDescarregavel.bind(null, id);

  return (
    <>
      <Titulo nota={doc ? `/api/descarregar/${doc.slug}` : undefined}>
        {novo ? "Novo descarregável" : doc!.nome.pt}
      </Titulo>

      <form action={guardar}>
        <Grelha>
          <CampoLocalizado
            nome="nome"
            rotulo="Nome"
            valor={doc?.nome}
            obrigatorio
            largo
          />
          <CampoTexto
            nome="slug"
            rotulo="Endereço (slug)"
            valor={doc?.slug}
            nota="Faz parte do link de descarga. Mudar parte links já divulgados."
          />
          <CampoTexto nome="data" rotulo="Data" tipo="date" valor={doc?.data} />
          <CampoLocalizado
            nome="etiqueta"
            rotulo="Etiqueta"
            valor={doc?.etiqueta}
            nota="Linha pequena por cima do nome. Ex. CATÁLOGO · VOL. 05."
          />
          <CampoLocalizado
            nome="descricao"
            rotulo="Descrição"
            valor={doc?.descricao}
            nota="Ex. PT | EN · 96 páginas · PDF."
          />
          <CampoMedia
            nome="ficheiroId"
            rotulo="Ficheiro PDF"
            valor={doc?.ficheiro ?? null}
            biblioteca={biblioteca}
            tipo="documento"
            largo
          />
          <CampoSelect
            nome="estado"
            rotulo="Estado"
            valor={doc?.estado ?? "rascunho"}
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
            valor={doc?.ordem ?? 0}
          />
        </Grelha>

        <BarraGuardar
          voltarPara="/admin/descarregaveis"
          extra={
            !novo && <BotaoApagar accao={apagar} rotulo="Apagar documento" />
          }
        />
      </form>
    </>
  );
}
