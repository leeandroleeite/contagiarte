import { asc } from "drizzle-orm";
import Link from "next/link";
import {
  Celula,
  Estado,
  Tabela,
  Titulo,
  Vazio,
} from "@/components/admin/Pecas";
import { db } from "@/lib/db";
import { descarregaveis } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function ListaDescarregaveis() {
  const lista = await db.query.descarregaveis.findMany({
    with: { ficheiro: true },
    orderBy: [asc(descarregaveis.ordem)],
  });

  return (
    <>
      <Titulo
        nota="Catálogo, dossiers e flyers. Sem PDF associado, o cartão não aparece no site."
        accao={{
          href: "/admin/descarregaveis/novo",
          rotulo: "Novo descarregável",
        }}
      >
        Descarregáveis
      </Titulo>

      {lista.length === 0 ? (
        <Vazio>
          Ainda não há documentos.{" "}
          <Link href="/admin/descarregaveis/novo">Criar o primeiro</Link>.
        </Vazio>
      ) : (
        <Tabela
          colunas={["Ordem", "Nome", "Ficheiro", "Descargas", "Estado", ""]}
        >
          {lista.map((d) => (
            <tr key={d.id}>
              <Celula className="text-adm-suave">{d.ordem}</Celula>
              <Celula>
                <Link href={`/admin/descarregaveis/${d.id}`}>{d.nome.pt}</Link>
              </Celula>
              <Celula className="text-adm-suave">
                {d.ficheiro ? (
                  d.ficheiro.nomeOriginal
                ) : (
                  <span className="text-[#9B3226]">falta o PDF</span>
                )}
              </Celula>
              <Celula>{d.descargas}</Celula>
              <Celula>
                <Estado valor={d.estado} />
              </Celula>
              <Celula>
                <Link href={`/admin/descarregaveis/${d.id}`}>Editar</Link>
              </Celula>
            </tr>
          ))}
        </Tabela>
      )}
    </>
  );
}
