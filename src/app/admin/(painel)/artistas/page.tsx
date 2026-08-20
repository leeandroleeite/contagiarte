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
import { artistas } from "@/lib/db/schema";
import { rotuloDisciplina } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ListaArtistasAdmin({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;
  const lista = await db.query.artistas.findMany({
    with: { retrato: true },
    orderBy: [asc(artistas.ordem), asc(artistas.nome)],
  });

  return (
    <>
      <Titulo
        nota="Cada artista tem página própria, com obras e exposições."
        accao={{ href: "/admin/artistas/novo", rotulo: "Novo artista" }}
      >
        Artistas
      </Titulo>

      {guardado && <Aviso tom="bom">Artista guardado.</Aviso>}

      {lista.length === 0 ? (
        <Vazio>
          Ainda não há artistas.{" "}
          <Link href="/admin/artistas/novo">Criar o primeiro</Link>.
        </Vazio>
      ) : (
        <Tabela colunas={["Ordem", "Nome", "Disciplina", "Retrato", "Estado", ""]}>
          {lista.map((a) => (
            <tr key={a.id}>
              <Celula className="text-adm-suave">{a.ordem}</Celula>
              <Celula>
                <Link href={`/admin/artistas/${a.id}`}>{a.nome}</Link>
              </Celula>
              <Celula>{rotuloDisciplina(a.disciplina, "pt")}</Celula>
              <Celula>
                {a.retrato ? (
                  "sim"
                ) : (
                  <span className="text-adm-suave">falta</span>
                )}
              </Celula>
              <Celula>
                <Estado valor={a.estado} />
              </Celula>
              <Celula>
                <Link href={`/admin/artistas/${a.id}`}>Editar</Link>
              </Celula>
            </tr>
          ))}
        </Tabela>
      )}
    </>
  );
}
