import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { BarraGuardar } from "@/components/admin/BarraGuardar";
import { BotaoApagar } from "@/components/admin/BotaoApagar";
import { CampoMedia } from "@/components/admin/CampoMedia";
import { CampoLocalizado, CampoTexto } from "@/components/admin/Campos";
import { Aviso, Grelha, Titulo, Vazio } from "@/components/admin/Pecas";
import { apagarSala, guardarSala } from "@/lib/admin/accoes";
import { listarMedia } from "@/lib/admin/media";
import { db } from "@/lib/db";
import { exposicoes, salas } from "@/lib/db/schema";
import { cx } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Salas do percurso. Cada exposição pode ter o seu, e é ele que
 * alimenta a página que se atravessa em scroll.
 */
export default async function PaginaPercurso({
  searchParams,
}: {
  searchParams: Promise<{ exposicao?: string; erro?: string }>;
}) {
  const { exposicao: escolhida, erro } = await searchParams;

  const listaExpo = await db.query.exposicoes.findMany({
    with: { salas: { columns: { id: true } } },
    orderBy: [asc(exposicoes.slug)],
  });

  const expoId = escolhida ?? listaExpo[0]?.id;

  const [listaSalas, biblioteca] = await Promise.all([
    expoId
      ? db.query.salas.findMany({
          where: eq(salas.exposicaoId, expoId),
          with: { fotografia: true },
          orderBy: [asc(salas.ordem)],
        })
      : Promise.resolve([]),
    listarMedia("imagem"),
  ]);

  const expo = listaExpo.find((e) => e.id === expoId);

  return (
    <>
      <Titulo nota="As salas substituem-se umas às outras enquanto o visitante desce a página.">
        Percurso
      </Titulo>

      {erro === "sem-exposicao" && (
        <Aviso tom="erro">Escolha primeiro a exposição.</Aviso>
      )}

      {listaExpo.length === 0 ? (
        <Vazio>
          Crie primeiro uma exposição em{" "}
          <Link href="/admin/exposicoes">Exposições</Link>.
        </Vazio>
      ) : (
        <>
          <nav className="mb-8 flex flex-wrap gap-2" aria-label="Exposição">
            {listaExpo.map((e) => (
              <Link
                key={e.id}
                href={`/admin/percurso?exposicao=${e.id}`}
                className={cx(
                  "border px-4 py-2.5 text-[13px] no-underline",
                  e.id === expoId
                    ? "border-tinta bg-tinta text-papel"
                    : "border-adm-fio-forte text-tinta",
                )}
              >
                {e.titulo.pt}{" "}
                <span className="opacity-60">({e.salas.length})</span>
              </Link>
            ))}
          </nav>

          {expo && (
            <p className="mb-6 text-[14px] text-adm-suave">
              Percurso em{" "}
              <Link href={`/exposicoes/${expo.slug}/percurso`} target="_blank">
                /exposicoes/{expo.slug}/percurso
              </Link>
              . Precisa de pelo menos uma sala com fotografia para valer a pena.
            </p>
          )}

          <div className="flex flex-col gap-10">
            {listaSalas.map((s) => (
              <FormularioSala
                key={s.id}
                sala={s}
                exposicaoId={expoId!}
                biblioteca={biblioteca}
              />
            ))}

            <FormularioSala
              exposicaoId={expoId!}
              biblioteca={biblioteca}
              ordemSugerida={listaSalas.length + 1}
            />
          </div>
        </>
      )}
    </>
  );
}

type Sala = typeof salas.$inferSelect & {
  fotografia: { id: string; chave: string; nomeOriginal: string; tipoMime: string } | null;
};

function FormularioSala({
  sala,
  exposicaoId,
  biblioteca,
  ordemSugerida,
}: {
  sala?: Sala;
  exposicaoId: string;
  biblioteca: Awaited<ReturnType<typeof listarMedia>>;
  ordemSugerida?: number;
}) {
  const nova = !sala;
  const guardar = guardarSala.bind(null, sala?.id ?? null);
  const apagar = sala ? apagarSala.bind(null, sala.id, exposicaoId) : null;

  return (
    <section className="border border-adm-fio bg-adm-cartao p-6">
      <h2 className="titulo-med mb-5 text-[18px]">
        {nova ? "Acrescentar sala" : sala!.nome.pt}
      </h2>

      <form action={guardar}>
        <input type="hidden" name="exposicaoId" value={exposicaoId} />

        <Grelha>
          <CampoLocalizado
            nome="nome"
            rotulo="Nome da sala"
            valor={sala?.nome}
            obrigatorio
          />
          <CampoTexto
            nome="ordem"
            rotulo="Ordem"
            tipo="number"
            valor={sala?.ordem ?? ordemSugerida ?? 0}
          />
          <CampoLocalizado
            nome="texto"
            rotulo="Texto"
            valor={sala?.texto}
            linhas={4}
            largo
          />
          <CampoMedia
            nome="fotografiaId"
            rotulo="Fotografia da sala"
            valor={sala?.fotografia ?? null}
            biblioteca={biblioteca}
            largo
          />
        </Grelha>

        <BarraGuardar
          voltarPara={`/admin/percurso?exposicao=${exposicaoId}`}
          extra={
            apagar && (
              <BotaoApagar accao={apagar} rotulo="Apagar sala" />
            )
          }
        />
      </form>
    </section>
  );
}
