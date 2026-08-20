import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BarraGuardar } from "@/components/admin/BarraGuardar";
import { BotaoApagar } from "@/components/admin/BotaoApagar";
import { CampoMedia } from "@/components/admin/CampoMedia";
import {
  Bloco,
  CampoInterruptor,
  CampoLocalizado,
  CampoSelect,
  CampoTexto,
} from "@/components/admin/Campos";
import { Grelha, CabecalhoSeccao, Conteudo } from "@/components/admin/Pecas";
import { apagarExposicao, guardarExposicao } from "@/lib/admin/accoes";
import { listarMedia } from "@/lib/admin/media";
import { db } from "@/lib/db";
import { artistas, exposicoes, lugares } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function EditarExposicao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nova = id === "novo";

  const [expo, listaLugares, listaArtistas, biblioteca] = await Promise.all([
    nova
      ? null
      : db.query.exposicoes.findFirst({
          where: eq(exposicoes.id, id),
          with: { imagem: true, artistas: true },
        }),
    db.select().from(lugares).orderBy(asc(lugares.nome)),
    db.select().from(artistas).orderBy(asc(artistas.nome)),
    listarMedia("imagem"),
  ]);

  if (!nova && !expo) notFound();

  const escolhidos = new Set(expo?.artistas.map((a) => a.artistaId) ?? []);
  const guardar = guardarExposicao.bind(null, nova ? null : id);
  const apagar = apagarExposicao.bind(null, id);

  return (
    <>
      <CabecalhoSeccao descricao={expo ? `/exposicoes/${expo.slug}` : undefined}>
        {nova ? "Nova exposição" : expo!.titulo.pt}
      </CabecalhoSeccao>

      <Conteudo>
      <form action={guardar}>
        <Grelha>
          <CampoLocalizado
            nome="titulo"
            rotulo="Título"
            valor={expo?.titulo}
            obrigatorio
            largo
          />

          <CampoTexto
            nome="slug"
            rotulo="Endereço (slug)"
            valor={expo?.slug}
            nota="Deixe vazio para gerar a partir do título."
          />

          <CampoSelect
            nome="lugarId"
            rotulo="Lugar"
            valor={expo?.lugarId}
            opcoes={[
              { valor: "", rotulo: "Sem lugar" },
              ...listaLugares.map((l) => ({ valor: l.id, rotulo: l.nome })),
            ]}
          />

          <CampoTexto
            nome="dataInicio"
            rotulo="Data de início"
            tipo="date"
            valor={expo?.dataInicio}
          />

          <CampoTexto
            nome="dataFim"
            rotulo="Data de fim"
            tipo="date"
            valor={expo?.dataFim}
            nota="Deixe vazio se for permanente ou ainda sem data."
          />

          <CampoTexto
            nome="curadoria"
            rotulo="Curadoria"
            valor={expo?.curadoria}
          />

          <CampoMedia
            nome="imagemId"
            rotulo="Imagem principal"
            valor={expo?.imagem ?? null}
            biblioteca={biblioteca}
            nota="Serve de topo da página, de cartão de partilha e de fundo do herói quando a exposição está em destaque."
            largo
          />

          <CampoLocalizado
            nome="texto"
            rotulo="Texto curatorial"
            valor={expo?.texto}
            linhas={10}
            nota="Separe parágrafos com uma linha em branco."
            largo
          />

          <CampoLocalizado
            nome="horario"
            rotulo="Visitas e horário"
            valor={expo?.horario}
          />

          <CampoLocalizado
            nome="reservas"
            rotulo="Reservas"
            valor={expo?.reservas}
          />

          <CampoLocalizado
            nome="inclui"
            rotulo="O que inclui"
            valor={expo?.inclui}
          />

          <CampoLocalizado
            nome="subtitulo"
            rotulo="Subtítulo"
            valor={expo?.subtitulo}
          />

          <CampoLocalizado
            nome="citacao"
            rotulo="Citação"
            valor={expo?.citacao}
            linhas={3}
            largo
          />

          <CampoTexto
            nome="citacaoAutor"
            rotulo="Autor da citação"
            valor={expo?.citacaoAutor}
          />

          <Bloco
            rotulo="Artistas nesta exposição"
            nota="A ordem segue a lista abaixo."
            largo
          >
            <ul className="flex flex-col gap-2 border border-adm-fio bg-adm-cartao p-4">
              {listaArtistas.map((a) => (
                <li key={a.id}>
                  <label className="flex items-center gap-3 text-[15px]">
                    <input
                      type="checkbox"
                      name="artistas"
                      value={a.id}
                      defaultChecked={escolhidos.has(a.id)}
                    />
                    {a.nome}
                  </label>
                </li>
              ))}
              {listaArtistas.length === 0 && (
                <li className="text-[14px] text-adm-suave">
                  Ainda não há artistas criados.
                </li>
              )}
            </ul>
          </Bloco>

          <CampoSelect
            nome="estado"
            rotulo="Estado"
            valor={expo?.estado ?? "rascunho"}
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
            valor={expo?.ordem ?? 0}
          />

          <CampoInterruptor
            nome="permanente"
            rotulo="Exposição permanente"
            valor={expo?.permanente}
          />

          <CampoInterruptor
            nome="destaque"
            rotulo="Abrir a homepage com esta exposição"
            valor={expo?.destaque}
            nota="Só uma pode estar em destaque: marcar esta desmarca a anterior."
          />
        </Grelha>

        <BarraGuardar
          voltarPara="/admin/exposicoes"
          extra={
            !nova && (
              <BotaoApagar
                accao={apagar}
                rotulo="Apagar exposição"
                pergunta="Apagar esta exposição? As salas do percurso vão com ela."
              />
            )
          }
        />
      </form>
      </Conteudo>
    </>
  );
}
