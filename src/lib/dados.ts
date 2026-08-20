import "server-only";

import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  artistas,
  definicoes as tDefinicoes,
  descarregaveis,
  exposicoes,
  exposicoesArtistas,
  lugares,
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

/** Obras da mesma exposição ou do mesmo artista, para o rodapé da ficha. */
export async function obrasRelacionadas(obra: Obra, limite = 3) {
  const condicoes = [
    obra.exposicaoId ? eq(obras.exposicaoId, obra.exposicaoId) : undefined,
    obra.artistaId ? eq(obras.artistaId, obra.artistaId) : undefined,
  ].filter(Boolean);

  if (condicoes.length === 0) return listarObras({ limite, excluir: obra.id });

  return db.query.obras.findMany({
    where: and(
      eq(obras.estado, PUBLICADO),
      ne(obras.id, obra.id),
      or(...(condicoes as NonNullable<(typeof condicoes)[number]>[])),
    ),
    with: comMediaObra,
    orderBy: [asc(obras.ordem)],
    limit: limite,
  });
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
