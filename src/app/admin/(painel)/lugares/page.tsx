import { asc } from "drizzle-orm";
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
import { lugares } from "@/lib/db/schema";

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
      <Titulo
        nota="Os espaços onde a galeria expõe: adegas, hotéis, clubes, centros culturais."
        accao={{ href: "/admin/lugares/novo", rotulo: "Novo lugar" }}
      >
        Lugares
      </Titulo>

      {guardado && <Aviso tom="bom">Lugar guardado.</Aviso>}

      {lista.length === 0 ? (
        <Vazio>
          Ainda não há lugares.{" "}
          <Link href="/admin/lugares/novo">Criar o primeiro</Link>.
        </Vazio>
      ) : (
        <Tabela colunas={["Ordem", "Nome", "Localidade", "Foto", "Estado", ""]}>
          {lista.map((l) => (
            <tr key={l.id}>
              <Celula className="text-adm-suave">{l.ordem}</Celula>
              <Celula>
                <Link href={`/admin/lugares/${l.id}`}>{l.nome}</Link>
              </Celula>
              <Celula className="text-adm-suave">
                {l.localidade?.pt ?? ""}
              </Celula>
              <Celula>
                {l.fotografia ? "sim" : <span className="text-adm-suave">falta</span>}
              </Celula>
              <Celula>
                <Estado valor={l.estado} />
              </Celula>
              <Celula>
                <Link href={`/admin/lugares/${l.id}`}>Editar</Link>
              </Celula>
            </tr>
          ))}
        </Tabela>
      )}
    </>
  );
}
