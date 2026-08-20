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
import { apagarLugar, guardarLugar } from "@/lib/admin/accoes";
import { listarMedia } from "@/lib/admin/media";
import { db } from "@/lib/db";
import { lugares } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function EditarLugar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const novo = id === "novo";

  const [lugar, biblioteca] = await Promise.all([
    novo
      ? null
      : db.query.lugares.findFirst({
          where: eq(lugares.id, id),
          with: { fotografia: true },
        }),
    listarMedia("imagem"),
  ]);

  if (!novo && !lugar) notFound();

  const guardar = guardarLugar.bind(null, novo ? null : id);
  const apagar = apagarLugar.bind(null, id);

  return (
    <>
      <Titulo>{novo ? "Novo lugar" : lugar!.nome}</Titulo>

      <form action={guardar}>
        <Grelha>
          <CampoTexto nome="nome" rotulo="Nome" valor={lugar?.nome} obrigatorio />
          <CampoTexto
            nome="slug"
            rotulo="Endereço (slug)"
            valor={lugar?.slug}
            nota="Deixe vazio para gerar a partir do nome."
          />
          <CampoLocalizado
            nome="localidade"
            rotulo="Localidade"
            valor={lugar?.localidade}
            nota="Ex. Favaios, Alijó."
          />
          <CampoLocalizado
            nome="tipo"
            rotulo="Tipo de espaço"
            valor={lugar?.tipo}
            nota="Ex. adega e enoturismo, centro cultural."
          />
          <CampoTexto nome="morada" rotulo="Morada" valor={lugar?.morada} largo />
          <CampoTexto nome="site" rotulo="Site" tipo="url" valor={lugar?.site} />
          <CampoTexto
            nome="mapa"
            rotulo="Link do mapa"
            tipo="url"
            valor={lugar?.mapa}
          />
          <CampoMedia
            nome="fotografiaId"
            rotulo="Fotografia"
            valor={lugar?.fotografia ?? null}
            biblioteca={biblioteca}
            largo
          />
          <CampoLocalizado
            nome="descricao"
            rotulo="Descrição"
            valor={lugar?.descricao}
            linhas={5}
            largo
          />
          <CampoSelect
            nome="estado"
            rotulo="Estado"
            valor={lugar?.estado ?? "rascunho"}
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
            valor={lugar?.ordem ?? 0}
          />
        </Grelha>

        <BarraGuardar
          voltarPara="/admin/lugares"
          extra={!novo && <BotaoApagar accao={apagar} rotulo="Apagar lugar" />}
        />
      </form>
    </>
  );
}
