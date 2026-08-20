import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  Aviso,
  CabecalhoSeccao,
  Conteudo,
  Estado,
  Linha,
  Vazio,
} from "@/components/admin/Pecas";
import { situacao } from "@/lib/dados";
import { db } from "@/lib/db";
import { exposicoes } from "@/lib/db/schema";
import { anos } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const COLUNAS = "76px minmax(180px,2fr) minmax(140px,1.4fr) 190px 104px";

export default async function ListaExposicoes({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;
  const lista = await db.query.exposicoes.findMany({
    with: { lugar: true, artistas: true },
    orderBy: [desc(exposicoes.dataInicio)],
  });

  return (
    <>
      <CabecalhoSeccao
        descricao="Datas, local, texto curatorial e obras associadas."
        accao={{ href: "/admin/exposicoes/novo", rotulo: "Nova exposição" }}
      >
        Exposições
      </CabecalhoSeccao>

      <Conteudo>
        {guardado && <Aviso tom="bom">Exposição guardada.</Aviso>}

        {lista.length === 0 ? (
          <Vazio>
            Ainda não há exposições.{" "}
            <Link href="/admin/exposicoes/novo">Criar a primeira</Link>.
          </Vazio>
        ) : (
          <div className="flex flex-col gap-3 overflow-x-auto">
            {lista.map((e) => (
              <Linha key={e.id} colunas={COLUNAS}>
                <span className="text-[14px] text-[rgba(14,12,11,0.5)]">
                  {anos(e.dataInicio, e.dataFim)}
                </span>

                <div className="flex min-w-0 flex-col gap-0.5">
                  <Link
                    href={`/admin/exposicoes/${e.id}`}
                    className="titulo-med text-[19px] no-underline"
                  >
                    {e.titulo.pt}
                  </Link>
                  <span className="text-[13px] text-[rgba(14,12,11,0.5)]">
                    {e.artistas.length} artistas
                  </span>
                </div>

                <span className="text-[14px] text-[rgba(14,12,11,0.6)]">
                  {e.lugar?.nome ?? ""}
                </span>

                <div className="flex flex-wrap gap-1.5">
                  <Estado valor={e.estado} />
                  <Estado valor={situacao(e)} />
                  {e.destaque && <Estado valor="destaque" />}
                </div>

                <div className="flex justify-end">
                  <Link
                    href={`/admin/exposicoes/${e.id}`}
                    className="inline-flex min-h-10 items-center border border-adm-fio-forte px-3.5 py-2.5 text-[12px] tracking-[0.1em] no-underline hover:border-tinta"
                  >
                    Editar
                  </Link>
                </div>
              </Linha>
            ))}
          </div>
        )}
      </Conteudo>
    </>
  );
}
