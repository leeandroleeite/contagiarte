import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  EditorExposicao,
  type DadosExposicao,
} from "@/components/admin/EditorExposicao";
import { apagarExposicao, guardarExposicao } from "@/lib/admin/accoes";
import { listarMedia } from "@/lib/admin/media";
import { obterDefinicoes } from "@/lib/dados";
import { db } from "@/lib/db";
import {
  artistas,
  descarregaveis,
  exposicoes,
  lugares,
  salas,
  type Localizado,
} from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** Os três idiomas de um campo traduzível, sempre como texto. */
function emTexto(valor: Localizado | null | undefined) {
  return { pt: valor?.pt ?? "", en: valor?.en ?? "", es: valor?.es ?? "" };
}

export default async function EditarExposicao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nova = id === "novo";

  const [expo, listaLugares, listaArtistas, biblioteca, ligados, nSalas, def] =
    await Promise.all([
      nova
        ? null
        : db.query.exposicoes.findFirst({
            where: eq(exposicoes.id, id),
            with: {
              imagem: true,
              artistas: { orderBy: (ea, { asc }) => [asc(ea.ordem)] },
            },
          }),
      db.select().from(lugares).orderBy(asc(lugares.nome)),
      db.query.artistas.findMany({
        with: { retrato: true },
        orderBy: [asc(artistas.nome)],
      }),
      listarMedia("imagem"),
      // Os documentos ligados a esta exposição, publicados ou não: o
      // cartão do catálogo diz quais é que o visitante já vê.
      nova
        ? []
        : db.query.descarregaveis.findMany({
            where: eq(descarregaveis.exposicaoId, id),
            with: { ficheiro: true },
            orderBy: [asc(descarregaveis.ordem)],
          }),
      nova ? 0 : db.$count(salas, eq(salas.exposicaoId, id)),
      // O botão de WhatsApp da pré-visualização é o do site.
      obterDefinicoes(),
    ]);

  if (!nova && !expo) notFound();

  // Tudo em texto, como fica nos campos: é assim que se compara o que
  // mudou e se desfaz.
  const inicial: DadosExposicao = {
    imagem: expo?.imagem
      ? {
          id: expo.imagem.id,
          chave: expo.imagem.chave,
          nomeOriginal: expo.imagem.nomeOriginal,
          tipoMime: expo.imagem.tipoMime,
        }
      : null,
    titulo: emTexto(expo?.titulo),
    dataInicio: expo?.dataInicio ?? "",
    dataFim: expo?.dataFim ?? "",
    permanente: expo?.permanente ?? false,
    lugarId: expo?.lugarId ?? "",
    artistas: expo?.artistas.map((a) => a.artistaId) ?? [],
    horario: emTexto(expo?.horario),
    reservas: emTexto(expo?.reservas),
    inclui: emTexto(expo?.inclui),
    texto: emTexto(expo?.texto),
    curadoria: expo?.curadoria ?? "",
    citacao: emTexto(expo?.citacao),
    citacaoAutor: expo?.citacaoAutor ?? "",
    subtitulo: emTexto(expo?.subtitulo),
    slug: expo?.slug ?? "",
    ordem: String(expo?.ordem ?? 0),
    destaque: expo?.destaque ?? false,
    estado: expo?.estado ?? "rascunho",
  };

  return (
    <EditorExposicao
      key={id}
      id={nova ? null : id}
      inicial={inicial}
      lugares={listaLugares.map((l) => ({
        id: l.id,
        nome: l.nome,
        morada: l.morada,
        localidade: l.localidade,
      }))}
      artistas={listaArtistas.map((a) => ({
        id: a.id,
        slug: a.slug,
        nome: a.nome,
        nota: a.nota,
        retrato: a.retrato ? { chave: a.retrato.chave } : null,
      }))}
      catalogos={ligados.map((d) => ({
        id: d.id,
        slug: d.slug,
        nome: d.nome,
        estado: d.estado,
        ficheiro: d.ficheiro?.nomeOriginal ?? null,
        descargas: d.descargas,
      }))}
      temPercurso={nSalas > 0}
      biblioteca={biblioteca}
      whatsapp={def.whatsapp}
      guardar={guardarExposicao.bind(null, nova ? null : id)}
      apagar={nova ? null : apagarExposicao.bind(null, id)}
    />
  );
}
