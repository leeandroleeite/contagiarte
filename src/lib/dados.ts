import "server-only";

import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  artistas,
  definicoes as tDefinicoes,
  descarregaveis,
  exposicoes,
  exposicoesArtistas,
  lugares,
  media,
  molduras,
  obras,
  salas,
  textos,
  type Definicoes,
  type Localizado,
} from "@/lib/db/schema";
import { DEFINICOES_OMISSAO } from "@/lib/db/omissoes";

/**
 * Camada de leitura do site público. Todas as consultas filtram por
 * `estado = 'publicado'`, para um rascunho nunca escapar para fora do
 * backoffice.
 */

const PUBLICADO = "publicado" as const;

// --------------------------------------------------------------------
// Definições e textos
// --------------------------------------------------------------------

export { DEFINICOES_OMISSAO } from "@/lib/db/omissoes";

export async function obterDefinicoes(): Promise<Definicoes> {
  const [linha] = await db
    .select()
    .from(tDefinicoes)
    .where(eq(tDefinicoes.id, 1))
    .limit(1);
  if (!linha) return DEFINICOES_OMISSAO;
  return { ...DEFINICOES_OMISSAO, ...linha.valor };
}

/**
 * As fotografias das páginas fixas, já resolvidas em media.
 *
 * As definições guardam só o identificador; quem desenha a página
 * precisa da chave, das medidas e do desfoque. Uma consulta para as
 * duas, e `null` onde a galeria ainda não escolheu nenhuma.
 */
export async function obterImagensDoSite(def: Definicoes) {
  const ids = [def.molduraImagemId, def.galeriaImagemId].filter(
    (id): id is string => Boolean(id),
  );
  if (ids.length === 0) return { moldura: null, galeria: null };

  const linhas = await db.select().from(media).where(inArray(media.id, ids));
  const achar = (id?: string | null) =>
    (id && linhas.find((m) => m.id === id)) || null;
  return {
    moldura: achar(def.molduraImagemId),
    galeria: achar(def.galeriaImagemId),
  };
}

export type MapaTextos = Record<string, Localizado>;

/** Todos os textos editáveis, indexados por chave. */
export async function obterTextos(): Promise<MapaTextos> {
  const linhas = await db.select().from(textos);
  const mapa: MapaTextos = {};
  for (const l of linhas) mapa[l.chave] = l.valor;
  return mapa;
}

// --------------------------------------------------------------------
// Exposições
// --------------------------------------------------------------------

const comMediaExposicao = {
  lugar: { with: { fotografia: true } },
  imagem: true,
  artistas: { with: { artista: { with: { retrato: true } } } },
} as const;

export async function exposicaoEmDestaque() {
  const [linha] = await db.query.exposicoes.findMany({
    where: and(
      eq(exposicoes.estado, PUBLICADO),
      eq(exposicoes.destaque, true),
    ),
    // As salas vêm juntas porque a homepage precisa de saber se há
    // percurso para mostrar (ou não) o botão de atravessar a adega.
    with: { ...comMediaExposicao, salas: { columns: { id: true } } },
    orderBy: [desc(exposicoes.dataInicio)],
    limit: 1,
  });
  return linha ?? null;
}

export async function listarExposicoes() {
  return db.query.exposicoes.findMany({
    where: eq(exposicoes.estado, PUBLICADO),
    with: comMediaExposicao,
    orderBy: [desc(exposicoes.destaque), desc(exposicoes.dataInicio), asc(exposicoes.ordem)],
  });
}

export async function exposicaoPorSlug(slug: string) {
  const linha = await db.query.exposicoes.findFirst({
    where: and(eq(exposicoes.slug, slug), eq(exposicoes.estado, PUBLICADO)),
    with: {
      ...comMediaExposicao,
      salas: {
        with: { fotografia: true, obras: { with: { obra: true } } },
        orderBy: [asc(salas.ordem)],
      },
    },
  });
  return linha ?? null;
}

export type Exposicao = NonNullable<Awaited<ReturnType<typeof exposicaoPorSlug>>>;

/** Situação de uma exposição face à data de hoje. */
export function situacao(e: {
  dataInicio: string | null;
  dataFim: string | null;
  permanente: boolean;
}): "em_curso" | "permanente" | "proxima" | "arquivo" {
  if (e.permanente) return "permanente";
  const hoje = new Date().toISOString().slice(0, 10);
  if (e.dataInicio && e.dataInicio > hoje) return "proxima";
  if (e.dataFim && e.dataFim < hoje) return "arquivo";
  if (e.dataInicio && e.dataInicio <= hoje) return "em_curso";
  return "arquivo";
}

// --------------------------------------------------------------------
// Obras
// --------------------------------------------------------------------

const comMediaObra = {
  artista: true,
  exposicao: true,
  fotografia: true,
} as const;

type FiltroObras = {
  artistaId?: string;
  exposicaoId?: string;
  soDisponiveis?: boolean;
  destaque?: boolean;
  /** Só obras já fotografadas. O simulador não serve sem imagem. */
  comFotografia?: boolean;
  limite?: number;
  excluir?: string;
};

export async function listarObras(filtro: FiltroObras = {}) {
  const condicoes = [eq(obras.estado, PUBLICADO)];
  if (filtro.artistaId) condicoes.push(eq(obras.artistaId, filtro.artistaId));
  if (filtro.exposicaoId)
    condicoes.push(eq(obras.exposicaoId, filtro.exposicaoId));
  if (filtro.soDisponiveis)
    condicoes.push(eq(obras.disponibilidade, "disponivel"));
  if (filtro.destaque) condicoes.push(eq(obras.destaque, true));
  if (filtro.comFotografia)
    condicoes.push(sql`${obras.fotografiaId} is not null`);
  if (filtro.excluir) condicoes.push(ne(obras.id, filtro.excluir));

  return db.query.obras.findMany({
    where: and(...condicoes),
    with: comMediaObra,
    orderBy: [asc(obras.ordem), desc(obras.criadoEm)],
    limit: filtro.limite,
  });
}

export async function obraPorSlug(slug: string) {
  const linha = await db.query.obras.findFirst({
    where: and(eq(obras.slug, slug), eq(obras.estado, PUBLICADO)),
    with: {
      ...comMediaObra,
      galeria: { with: { media: true } },
    },
  });
  return linha ?? null;
}

export type Obra = NonNullable<Awaited<ReturnType<typeof obraPorSlug>>>;
export type ObraLista = Awaited<ReturnType<typeof listarObras>>[number];

/**
 * Obras a mostrar no fim da ficha.
 *
 * A preferência é pelo mesmo artista, porque é isso que o rodapé da
 * ficha promete. Só quando o artista não tem mais nada é que se cai
 * para as companheiras de exposição, e nesse caso o `mesmoArtista`
 * devolvido diz à página para mudar o título: escrever "do mesmo
 * artista" por cima de obras de outra pessoa seria mentira.
 */
export async function obrasRelacionadas(obra: Obra, limite = 3) {
  const base = [eq(obras.estado, PUBLICADO), ne(obras.id, obra.id)];

  if (obra.artistaId) {
    const doArtista = await db.query.obras.findMany({
      where: and(...base, eq(obras.artistaId, obra.artistaId)),
      with: comMediaObra,
      orderBy: [asc(obras.ordem)],
      limit: limite,
    });
    if (doArtista.length > 0) {
      return { lista: doArtista, mesmoArtista: true as const };
    }
  }

  if (obra.exposicaoId) {
    const daExposicao = await db.query.obras.findMany({
      where: and(...base, eq(obras.exposicaoId, obra.exposicaoId)),
      with: comMediaObra,
      orderBy: [asc(obras.ordem)],
      limit: limite,
    });
    if (daExposicao.length > 0) {
      return { lista: daExposicao, mesmoArtista: false as const };
    }
  }

  const quaisquer = await listarObras({ limite, excluir: obra.id });
  return { lista: quaisquer, mesmoArtista: false as const };
}

// --------------------------------------------------------------------
// Artistas
// --------------------------------------------------------------------

export async function listarArtistas() {
  return db.query.artistas.findMany({
    where: eq(artistas.estado, PUBLICADO),
    with: { retrato: true },
    orderBy: [asc(artistas.ordem), asc(artistas.nome)],
  });
}

export async function artistaPorSlug(slug: string) {
  const linha = await db.query.artistas.findFirst({
    where: and(eq(artistas.slug, slug), eq(artistas.estado, PUBLICADO)),
    with: { retrato: true },
  });
  return linha ?? null;
}

export type Artista = NonNullable<Awaited<ReturnType<typeof artistaPorSlug>>>;

/** Exposições em que um artista participou, da mais recente para trás. */
export async function exposicoesDoArtista(artistaId: string) {
  const linhas = await db
    .select({ id: exposicoesArtistas.exposicaoId })
    .from(exposicoesArtistas)
    .where(eq(exposicoesArtistas.artistaId, artistaId));

  const ids = linhas.map((l) => l.id);
  if (ids.length === 0) return [];

  return db.query.exposicoes.findMany({
    where: and(inArray(exposicoes.id, ids), eq(exposicoes.estado, PUBLICADO)),
    with: { lugar: true },
    orderBy: [desc(exposicoes.dataInicio)],
  });
}

// --------------------------------------------------------------------
// Lugares, molduras e descarregáveis
// --------------------------------------------------------------------

export async function listarLugares() {
  return db.query.lugares.findMany({
    where: eq(lugares.estado, PUBLICADO),
    with: { fotografia: true },
    orderBy: [asc(lugares.ordem), asc(lugares.nome)],
  });
}

export async function lugarPorSlug(slug: string) {
  const linha = await db.query.lugares.findFirst({
    where: and(eq(lugares.slug, slug), eq(lugares.estado, PUBLICADO)),
    with: { fotografia: true },
  });
  return linha ?? null;
}

export async function listarMolduras() {
  return db
    .select()
    .from(molduras)
    .where(eq(molduras.estado, PUBLICADO))
    .orderBy(asc(molduras.ordem));
}

export async function listarDescarregaveis() {
  return db.query.descarregaveis.findMany({
    where: eq(descarregaveis.estado, PUBLICADO),
    with: { ficheiro: true },
    orderBy: [asc(descarregaveis.ordem), desc(descarregaveis.data)],
  });
}

export async function descarregavelPorSlug(slug: string) {
  const linha = await db.query.descarregaveis.findFirst({
    where: and(
      eq(descarregaveis.slug, slug),
      eq(descarregaveis.estado, PUBLICADO),
    ),
    with: { ficheiro: true },
  });
  return linha ?? null;
}

/** Conta uma descarga sem bloquear a resposta do ficheiro. */
export async function contarDescarga(id: string) {
  await db
    .update(descarregaveis)
    .set({ descargas: sql`${descarregaveis.descargas} + 1` })
    .where(eq(descarregaveis.id, id));
}
