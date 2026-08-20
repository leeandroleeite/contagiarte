import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import {
  Aviso,
  CabecalhoSeccao,
  Chip,
  Conteudo,
  Estado,
  Linha,
  Miniatura,
  TituloColunas,
  Vazio,
} from "@/components/admin/Pecas";
import { db } from "@/lib/db";
import { obras } from "@/lib/db/schema";
import { urlMedia } from "@/lib/media/url";

export const dynamic = "force-dynamic";

const COLUNAS = "64px minmax(180px,2fr) minmax(130px,1.2fr) 116px 200px 104px";

const FILTROS = [
  { chave: "", rotulo: "Todas" },
  { chave: "publicado", rotulo: "Publicadas" },
  { chave: "reservada", rotulo: "Reservadas" },
  { chave: "vendida", rotulo: "Vendidas" },
  { chave: "rascunho", rotulo: "Rascunhos" },
];

export default async function ListaObras({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string; filtro?: string }>;
}) {
  const { guardado, filtro } = await searchParams;

  const todas = await db.query.obras.findMany({
    with: { artista: true, fotografia: true, exposicao: true },
    orderBy: [asc(obras.ordem), desc(obras.criadoEm)],
  });

  const visiveis = !filtro
    ? todas
    : todas.filter((o) =>
        ["publicado", "rascunho", "arquivado"].includes(filtro)
          ? o.estado === filtro
          : o.disponibilidade === filtro,
      );

  const vendidas = todas.filter((o) => o.disponibilidade === "vendida").length;
  const reservadas = todas.filter(
    (o) => o.disponibilidade === "reservada",
  ).length;
  const semFoto = todas.filter((o) => !o.fotografiaId).length;

  return (
    <>
      <CabecalhoSeccao
        descricao="Cada obra vive aqui: fotografia, ficha técnica e estado de venda."
        accao={{ href: "/admin/obras/novo", rotulo: "Nova obra" }}
      >
        Obras
      </CabecalhoSeccao>

      <Conteudo>
        {guardado && <Aviso tom="bom">Obra guardada.</Aviso>}

        {todas.length === 0 ? (
          <Vazio>
            Ainda não há obras.{" "}
            <Link href="/admin/obras/novo">Criar a primeira</Link>.
          </Vazio>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {FILTROS.map((f) => (
                <Chip
                  key={f.chave || "todas"}
                  href={f.chave ? `/admin/obras?filtro=${f.chave}` : "/admin/obras"}
                  activo={(filtro ?? "") === f.chave}
                >
                  {f.rotulo}
                </Chip>
              ))}
            </div>

            <div className="flex flex-col gap-3 overflow-x-auto">
              <TituloColunas
                colunas={COLUNAS}
                rotulos={["", "OBRA", "ARTISTA", "DIMENSÕES", "ESTADO", ""]}
              />

              {visiveis.map((o) => (
                <Linha key={o.id} colunas={COLUNAS}>
                  <Miniatura url={urlMedia(o.fotografia?.chave)} />

                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Link
                      href={`/admin/obras/${o.id}`}
                      className="text-[16px] no-underline"
                    >
                      {o.titulo.pt}
                    </Link>
                    <span className="text-[13px] text-[rgba(14,12,11,0.62)]">
                      {o.tecnica?.pt ?? "Técnica por preencher"}
                    </span>
                  </div>

                  <span className="text-[15px] text-[rgba(14,12,11,0.75)]">
                    {o.artista?.nome ?? (
                      <span className="text-adm-suave">sem artista</span>
                    )}
                  </span>

                  <span className="text-[14px] whitespace-nowrap text-[rgba(14,12,11,0.62)]">
                    {o.dimensoes ?? (
                      <span className="text-[#6B2B22]">por preencher</span>
                    )}
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    <Estado valor={o.estado} />
                    <Estado valor={o.disponibilidade} />
                    {o.destaque && <Estado valor="destaque" />}
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/admin/obras/${o.id}`}
                      className="inline-flex min-h-10 items-center border border-adm-fio-forte px-3.5 py-2.5 text-[12px] tracking-[0.1em] no-underline hover:border-tinta"
                    >
                      Editar
                    </Link>
                  </div>
                </Linha>
              ))}
            </div>

            <span className="text-[13px] text-[rgba(14,12,11,0.62)]">
              {visiveis.length} de {todas.length} obras · {vendidas} vendidas ·{" "}
              {reservadas} reservadas
              {semFoto > 0 && ` · ${semFoto} sem fotografia`}
            </span>
          </div>
        )}
      </Conteudo>
    </>
  );
}
