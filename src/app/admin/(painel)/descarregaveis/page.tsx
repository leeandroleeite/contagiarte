import { asc } from "drizzle-orm";
import Link from "next/link";
import {
  CabecalhoSeccao,
  Conteudo,
  Estado,
  Vazio,
} from "@/components/admin/Pecas";
import { db } from "@/lib/db";
import { descarregaveis } from "@/lib/db/schema";
import { urlMedia } from "@/lib/media/url";

export const dynamic = "force-dynamic";

export default async function ListaDescarregaveis() {
  const lista = await db.query.descarregaveis.findMany({
    with: { ficheiro: true },
    orderBy: [asc(descarregaveis.ordem)],
  });

  return (
    <>
      <CabecalhoSeccao
        descricao="Catálogos e dossiers publicados na secção Descarregar."
        accao={{
          href: "/admin/descarregaveis/novo",
          rotulo: "Novo descarregável",
        }}
      >
        Descarregáveis
      </CabecalhoSeccao>

      <Conteudo estreito>
        {lista.length === 0 ? (
          <Vazio>
            Ainda não há documentos.{" "}
            <Link href="/admin/descarregaveis/novo">Criar o primeiro</Link>.
          </Vazio>
        ) : (
          <div className="flex flex-col gap-3.5">
            {lista.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-4 border border-adm-fio bg-adm-cartao p-[18px]"
              >
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/admin/descarregaveis/${d.id}`}
                    className="text-[16px]"
                  >
                    {d.nome.pt}
                  </Link>
                  <span className="text-[13px] text-adm-suave">
                    {d.ficheiro
                      ? `${d.ficheiro.nomeOriginal} · ${(d.ficheiro.tamanho / 1024 / 1024).toFixed(1)} MB · ${d.descargas} descargas`
                      : "Sem PDF associado: não aparece no site."}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Estado valor={d.estado} />
                  {/* Abrir o PDF aqui não conta como descarga: quem
                      está a gerir precisa de ver qual é o ficheiro,
                      e isso não é um download do público. */}
                  {d.ficheiro && (
                    <a
                      href={urlMedia(d.ficheiro.chave) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px]"
                    >
                      Abrir
                    </a>
                  )}
                  <Link
                    href={`/admin/descarregaveis/${d.id}`}
                    className="inline-flex min-h-10 items-center border border-adm-fio-forte px-[18px] py-3 text-[12px] tracking-[0.1em] no-underline hover:border-tinta"
                  >
                    {d.ficheiro ? "Substituir ficheiro" : "Carregar PDF"}
                  </Link>
                </div>
              </div>
            ))}

            <Link
              href="/admin/descarregaveis/novo"
              className="flex items-center justify-center border border-dashed border-adm-fio-forte p-9 text-center text-[14px] text-adm-suave no-underline hover:border-tinta"
            >
              Criar um documento novo para publicar um PDF na secção Descarregar
            </Link>
          </div>
        )}
      </Conteudo>
    </>
  );
}
