import { asc } from "drizzle-orm";
import Link from "next/link";
import {
  Aviso,
  CabecalhoSeccao,
  Conteudo,
  Estado,
  Vazio,
} from "@/components/admin/Pecas";
import { db } from "@/lib/db";
import { lugares } from "@/lib/db/schema";
import { urlMedia } from "@/lib/media/url";
import { colunas } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ListaLugares({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;
  const lista = await db.query.lugares.findMany({
    with: { fotografia: true },
    orderBy: [asc(lugares.ordem), asc(lugares.nome)],
  });

  return (
    <>
      <CabecalhoSeccao
        descricao="Os espaços onde expomos: adega, hotel, clube, café."
        accao={{ href: "/admin/lugares/novo", rotulo: "Novo lugar" }}
      >
        Lugares e parcerias
      </CabecalhoSeccao>

      <Conteudo>
        {guardado && <Aviso tom="bom">Lugar guardado.</Aviso>}

        {lista.length === 0 ? (
          <Vazio>
            Ainda não há lugares.{" "}
            <Link href="/admin/lugares/novo">Criar o primeiro</Link>.
          </Vazio>
        ) : (
          <ul className="grid gap-[18px]" style={colunas(260, "auto-fill")}>
            {lista.map((l) => {
              const foto = urlMedia(l.fotografia?.chave);
              return (
                <li
                  key={l.id}
                  className="flex flex-col gap-3 border border-adm-fio bg-adm-cartao p-[18px]"
                >
                  <div
                    className="flex h-[110px] items-center justify-center border bg-[rgba(14,12,11,0.06)] text-[12px] text-[rgba(14,12,11,0.45)]"
                    style={
                      foto
                        ? {
                            backgroundImage: `url(${foto})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            borderColor: "rgba(14,12,11,0.14)",
                          }
                        : {
                            borderStyle: "dashed",
                            borderColor: "rgba(14,12,11,0.2)",
                          }
                    }
                  >
                    {!foto && "Fotografia do espaço"}
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="titulo-med text-[17px]"
                      style={{ fontWeight: 800 }}
                    >
                      {l.nome}
                    </span>
                    <Estado valor={l.estado} />
                  </div>

                  <span className="text-[14px] leading-[1.5] text-[rgba(14,12,11,0.6)]">
                    {[l.localidade?.pt, l.tipo?.pt].filter(Boolean).join(" · ")}
                  </span>

                  <Link
                    href={`/admin/lugares/${l.id}`}
                    className="inline-flex min-h-10 items-center self-start border border-adm-fio-forte px-3.5 py-2.5 text-[12px] tracking-[0.1em] no-underline hover:border-tinta"
                  >
                    Editar
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Conteudo>
    </>
  );
}
