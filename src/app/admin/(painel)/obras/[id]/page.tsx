import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { EditorObra, type DadosObra } from "@/components/admin/EditorObra";
import { apagarObra, guardarObra } from "@/lib/admin/accoes";
import { listarMedia } from "@/lib/admin/media";
import { obterDefinicoes, obterTextos } from "@/lib/dados";
import { db } from "@/lib/db";
import { artistas, exposicoes, obras, type Localizado } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** Os três idiomas de um campo traduzível, sempre como texto. */
function emTexto(valor: Localizado | null | undefined) {
  return { pt: valor?.pt ?? "", en: valor?.en ?? "", es: valor?.es ?? "" };
}

export default async function EditarObra({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nova = id === "novo";

  const [obra, listaArtistas, listaExpo, biblioteca, def, txt] =
    await Promise.all([
      nova
        ? null
        : db.query.obras.findFirst({
            where: eq(obras.id, id),
            with: { fotografia: true },
          }),
      db.select().from(artistas).orderBy(asc(artistas.nome)),
      db.select().from(exposicoes).orderBy(asc(exposicoes.slug)),
      listarMedia("imagem"),
      // A pré-visualização é a ficha do site, com os mesmos contactos e
      // a mesma nota por baixo dos botões.
      obterDefinicoes(),
      obterTextos(),
    ]);

  if (!nova && !obra) notFound();

  // Tudo em texto, como fica nos campos: é assim que se compara o que
  // mudou e se desfaz.
  const inicial: DadosObra = {
    fotografia: obra?.fotografia
      ? {
          id: obra.fotografia.id,
          chave: obra.fotografia.chave,
          nomeOriginal: obra.fotografia.nomeOriginal,
          tipoMime: obra.fotografia.tipoMime,
        }
      : null,
    titulo: emTexto(obra?.titulo),
    artistaId: obra?.artistaId ?? "",
    tecnica: emTexto(obra?.tecnica),
    dimensoes: obra?.dimensoes ?? "",
    ano: obra?.ano != null ? String(obra.ano) : "",
    descricao: emTexto(obra?.descricao),
    exposicaoId: obra?.exposicaoId ?? "",
    disponibilidade: obra?.disponibilidade ?? "disponivel",
    preco: emTexto(obra?.preco),
    slug: obra?.slug ?? "",
    ordem: String(obra?.ordem ?? 0),
    larguraCm: obra?.larguraCm != null ? String(obra.larguraCm) : "",
    alturaCm: obra?.alturaCm != null ? String(obra.alturaCm) : "",
    destaque: obra?.destaque ?? false,
    estado: obra?.estado ?? "rascunho",
  };

  return (
    <EditorObra
      key={id}
      nova={nova}
      inicial={inicial}
      artistas={listaArtistas.map((a) => ({
        id: a.id,
        nome: a.nome,
        slug: a.slug,
      }))}
      exposicoes={listaExpo.map((e) => ({
        id: e.id,
        slug: e.slug,
        titulo: e.titulo,
      }))}
      biblioteca={biblioteca}
      whatsapp={def.whatsapp}
      email={def.email}
      nota={txt["obra.nota.servico"] ?? null}
      guardar={guardarObra.bind(null, nova ? null : id)}
      apagar={nova ? null : apagarObra.bind(null, id)}
    />
  );
}
