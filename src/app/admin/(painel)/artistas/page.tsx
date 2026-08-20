import { asc } from "drizzle-orm";
import Link from "next/link";
import {
  Aviso,
  CabecalhoSeccao,
  Conteudo,
  Estado,
  Miniatura,
  Vazio,
} from "@/components/admin/Pecas";
import { db } from "@/lib/db";
import { artistas, obras } from "@/lib/db/schema";
import { rotuloDisciplina } from "@/lib/i18n";
import { urlMedia } from "@/lib/media/url";
import { colunas } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ListaArtistasAdmin({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;

  const [lista, todasObras] = await Promise.all([
    db.query.artistas.findMany({
      with: { retrato: true },
      orderBy: [asc(artistas.ordem), asc(artistas.nome)],
    }),
    db.select({ artistaId: obras.artistaId }).from(obras),
  ]);

  const contar = (id: string) =>
    todasObras.filter((o) => o.artistaId === id).length;

  return (
    <>
      <CabecalhoSeccao
        descricao="Acrescentar um artista cria automaticamente a página dele no site."
        accao={{ href: "/admin/artistas/novo", rotulo: "Novo artista" }}
      >
        Artistas
      </CabecalhoSeccao>

      <Conteudo>
        {guardado && <Aviso tom="bom">Artista guardado.</Aviso>}

        {lista.length === 0 ? (
          <Vazio>
            Ainda não há artistas.{" "}
            <Link href="/admin/artistas/novo">Criar o primeiro</Link>.
          </Vazio>
        ) : (
          <ul className="grid gap-[18px]" style={colunas(280, "auto-fill")}>
            {lista.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-3.5 border border-adm-fio bg-adm-cartao p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Miniatura url={urlMedia(a.retrato?.chave)} tamanho={44} />
                    <span
                      className="titulo-med text-[19px]"
                      style={{ fontWeight: 800 }}
                    >
                      {a.nome}
                    </span>
                  </div>
                  <Estado valor={a.estado} />
                </div>

                <span className="text-[14px] leading-[1.55] text-[rgba(14,12,11,0.6)]">
                  {a.nota?.pt ?? "Sem nota."}
                </span>

                <div className="flex items-center justify-between gap-3 border-t border-adm-fio pt-3 text-[13px] text-[rgba(14,12,11,0.5)]">
                  <span>
                    {contar(a.id)} obras · {rotuloDisciplina(a.disciplina, "pt")}
                  </span>
                  <Link href={`/admin/artistas/${a.id}`}>Editar →</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Conteudo>
    </>
  );
}
