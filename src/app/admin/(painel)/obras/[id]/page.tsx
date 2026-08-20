import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BarraGuardar } from "@/components/admin/BarraGuardar";
import { BotaoApagar } from "@/components/admin/BotaoApagar";
import { CampoMedia } from "@/components/admin/CampoMedia";
import {
  CampoInterruptor,
  CampoLocalizado,
  CampoSelect,
  CampoTexto,
} from "@/components/admin/Campos";
import { Grelha, CabecalhoSeccao, Conteudo } from "@/components/admin/Pecas";
import { apagarObra, guardarObra } from "@/lib/admin/accoes";
import { listarMedia } from "@/lib/admin/media";
import { db } from "@/lib/db";
import { artistas, exposicoes, obras } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function EditarObra({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nova = id === "novo";

  const [obra, listaArtistas, listaExpo, biblioteca] = await Promise.all([
    nova
      ? null
      : db.query.obras.findFirst({
          where: eq(obras.id, id),
          with: { fotografia: true },
        }),
    db.select().from(artistas).orderBy(asc(artistas.nome)),
    db.select().from(exposicoes).orderBy(asc(exposicoes.slug)),
    listarMedia("imagem"),
  ]);

  if (!nova && !obra) notFound();

  const guardar = guardarObra.bind(null, nova ? null : id);
  const apagar = apagarObra.bind(null, id);

  return (
    <>
      <CabecalhoSeccao descricao={obra ? `/obras/${obra.slug}` : undefined}>
        {nova ? "Nova obra" : obra!.titulo.pt}
      </CabecalhoSeccao>

      <Conteudo>
      <form action={guardar}>
        <Grelha>
          <CampoLocalizado
            nome="titulo"
            rotulo="Título"
            valor={obra?.titulo}
            obrigatorio
            largo
          />

          <CampoTexto
            nome="slug"
            rotulo="Endereço (slug)"
            valor={obra?.slug}
            nota="Deixe vazio para gerar a partir do título. Mudar isto parte links já divulgados."
          />

          <CampoSelect
            nome="artistaId"
            rotulo="Artista"
            valor={obra?.artistaId}
            opcoes={[
              { valor: "", rotulo: "Sem artista" },
              ...listaArtistas.map((a) => ({ valor: a.id, rotulo: a.nome })),
            ]}
          />

          <CampoLocalizado
            nome="tecnica"
            rotulo="Técnica"
            valor={obra?.tecnica}
            nota="Ex. grés e pigmentos, técnica mista, colagem e spray."
          />

          <CampoTexto
            nome="dimensoes"
            rotulo="Dimensões"
            valor={obra?.dimensoes}
            placeholder="70 × 50 cm"
          />

          <CampoTexto
            nome="ano"
            rotulo="Ano"
            tipo="number"
            valor={obra?.ano}
          />

          <CampoSelect
            nome="exposicaoId"
            rotulo="Exposição"
            valor={obra?.exposicaoId}
            opcoes={[
              { valor: "", rotulo: "Sem exposição" },
              ...listaExpo.map((e) => ({
                valor: e.id,
                rotulo: e.titulo.pt,
              })),
            ]}
          />

          <CampoMedia
            nome="fotografiaId"
            rotulo="Fotografia"
            valor={obra?.fotografia ?? null}
            biblioteca={biblioteca}
            nota="Sem fotografia, o site mostra um marcador com o título."
            largo
          />

          <CampoLocalizado
            nome="descricao"
            rotulo="Descrição"
            valor={obra?.descricao}
            linhas={5}
            largo
          />

          <CampoLocalizado
            nome="preco"
            rotulo="Preço"
            valor={obra?.preco}
            nota="Texto livre. Vazio mostra Sob consulta."
          />

          <CampoSelect
            nome="disponibilidade"
            rotulo="Disponibilidade"
            valor={obra?.disponibilidade ?? "disponivel"}
            opcoes={[
              { valor: "disponivel", rotulo: "Disponível" },
              { valor: "reservada", rotulo: "Reservada" },
              { valor: "vendida", rotulo: "Vendida" },
              { valor: "nao_venal", rotulo: "Não está à venda" },
            ]}
          />

          <CampoTexto
            nome="larguraCm"
            rotulo="Largura real (cm)"
            tipo="number"
            valor={obra?.larguraCm}
            nota="Usada pelo simulador Ver na parede para acertar a escala."
          />

          <CampoTexto
            nome="alturaCm"
            rotulo="Altura real (cm)"
            tipo="number"
            valor={obra?.alturaCm}
          />

          <CampoSelect
            nome="estado"
            rotulo="Estado"
            valor={obra?.estado ?? "rascunho"}
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
            valor={obra?.ordem ?? 0}
            nota="Número mais baixo aparece primeiro."
          />

          <CampoInterruptor
            nome="destaque"
            rotulo="Mostrar no carrossel da homepage"
            valor={obra?.destaque}
          />
        </Grelha>

        <BarraGuardar
          voltarPara="/admin/obras"
          extra={!nova && <BotaoApagar accao={apagar} rotulo="Apagar obra" />}
        />
      </form>
      </Conteudo>
    </>
  );
}
