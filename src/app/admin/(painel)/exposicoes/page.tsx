import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  Aviso,
  Celula,
  Estado,
  Tabela,
  Titulo,
  Vazio,
} from "@/components/admin/Pecas";
import { db } from "@/lib/db";
import { exposicoes } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

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
      <Titulo
        nota="A exposição em destaque é a que abre a homepage."
        accao={{ href: "/admin/exposicoes/novo", rotulo: "Nova exposição" }}
      >
        Exposições
      </Titulo>

      {guardado && <Aviso tom="bom">Exposição guardada.</Aviso>}

      {lista.length === 0 ? (
        <Vazio>
          Ainda não há exposições.{" "}
          <Link href="/admin/exposicoes/novo">Criar a primeira</Link>.
        </Vazio>
      ) : (
        <Tabela
          colunas={["Título", "Lugar", "Datas", "Artistas", "Destaque", "Estado", ""]}
        >
          {lista.map((e) => (
            <tr key={e.id}>
              <Celula>
                <Link href={`/admin/exposicoes/${e.id}`}>{e.titulo.pt}</Link>
              </Celula>
              <Celula className="text-adm-suave">{e.lugar?.nome ?? ""}</Celula>
              <Celula className="text-adm-suave">
                {e.permanente
                  ? "permanente"
                  : [e.dataInicio, e.dataFim].filter(Boolean).join(" a ")}
              </Celula>
              <Celula className="text-adm-suave">{e.artistas.length}</Celula>
              <Celula>{e.destaque ? "sim" : ""}</Celula>
              <Celula>
                <Estado valor={e.estado} />
              </Celula>
              <Celula>
                <Link href={`/admin/exposicoes/${e.id}`}>Editar</Link>
              </Celula>
            </tr>
          ))}
        </Tabela>
      )}
    </>
  );
}
