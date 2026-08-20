import { asc } from "drizzle-orm";
import { BarraGuardar } from "@/components/admin/BarraGuardar";
import { CampoLocalizado } from "@/components/admin/Campos";
import { Aviso, Titulo } from "@/components/admin/Pecas";
import { guardarTextos } from "@/lib/admin/accoes";
import { db } from "@/lib/db";
import { textos } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const NOME_GRUPO: Record<string, string> = {
  homepage: "Homepage",
  lugares: "Lugares",
  molduras: "Molduras",
  newsletter: "Newsletter",
  arquivo: "Arquivo",
  artistas: "Artistas",
  legal: "Textos legais",
  geral: "Geral",
};

export default async function PaginaTextos({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;
  const lista = await db
    .select()
    .from(textos)
    .orderBy(asc(textos.grupo), asc(textos.chave));

  const grupos = new Map<string, typeof lista>();
  for (const t of lista) {
    const g = grupos.get(t.grupo) ?? [];
    g.push(t);
    grupos.set(t.grupo, g);
  }

  return (
    <>
      <Titulo nota="As frases fixas do site. O que estiver vazio em EN ou ES mostra o português.">
        Textos do site
      </Titulo>

      {guardado && <Aviso tom="bom">Textos guardados.</Aviso>}

      <form action={guardarTextos}>
        {[...grupos.entries()].map(([grupo, entradas]) => (
          <section key={grupo} className="mb-12">
            <h2 className="titulo-med mb-5 border-b border-adm-fio pb-2 text-[20px]">
              {NOME_GRUPO[grupo] ?? grupo}
            </h2>

            <div className="flex flex-col gap-7">
              {entradas.map((t) => (
                <div key={t.chave}>
                  <input type="hidden" name="chaves" value={t.chave} />
                  <CampoLocalizado
                    nome={`t.${t.chave}`}
                    rotulo={t.chave}
                    valor={t.valor}
                    nota={t.nota ?? undefined}
                    linhas={t.valor.pt.length > 90 ? 6 : 0}
                    largo
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        <BarraGuardar voltarPara="/admin" />
      </form>
    </>
  );
}
