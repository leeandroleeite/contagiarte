import { asc, desc } from "drizzle-orm";
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
import { obras } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function ListaObras({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;

  const lista = await db.query.obras.findMany({
    with: { artista: true, fotografia: true, exposicao: true },
    orderBy: [asc(obras.ordem), desc(obras.criadoEm)],
  });

  return (
    <>
      <Titulo
        nota="Cada obra tem endereço próprio, ficha técnica e botão de contacto."
        accao={{ href: "/admin/obras/novo", rotulo: "Nova obra" }}
      >
        Obras
      </Titulo>

      {guardado && <Aviso tom="bom">Obra guardada.</Aviso>}

      {lista.length === 0 ? (
        <Vazio>
          Ainda não há obras. <Link href="/admin/obras/novo">Criar a primeira</Link>.
        </Vazio>
      ) : (
        <Tabela
          colunas={["Ordem", "Título", "Artista", "Exposição", "Foto", "Estado", ""]}
        >
          {lista.map((o) => (
            <tr key={o.id}>
              <Celula className="text-adm-suave">{o.ordem}</Celula>
              <Celula>
                <Link href={`/admin/obras/${o.id}`}>{o.titulo.pt}</Link>
              </Celula>
              <Celula>
                {o.artista?.nome ?? (
                  <span className="text-adm-suave">sem artista</span>
                )}
              </Celula>
              <Celula className="text-adm-suave">
                {o.exposicao?.titulo.pt ?? ""}
              </Celula>
              <Celula>
                {o.fotografia ? (
                  "sim"
                ) : (
                  <span className="text-[#9B3226]">falta</span>
                )}
              </Celula>
              <Celula>
                <div className="flex flex-wrap gap-1.5">
                  <Estado valor={o.estado} />
                  <Estado valor={o.disponibilidade} />
                </div>
              </Celula>
              <Celula>
                <Link href={`/admin/obras/${o.id}`}>Editar</Link>
              </Celula>
            </tr>
          ))}
        </Tabela>
      )}
    </>
  );
}
