import { and, asc, eq, inArray } from "drizzle-orm";
import { Aviso, CabecalhoSeccao } from "@/components/admin/Pecas";
import { db } from "@/lib/db";
import { exposicoes, obras, salas, textos } from "@/lib/db/schema";
import { EditorTextos, type TextoDoSite } from "./EditorTextos";
import { nomeDoTexto, paginaDoTexto, paginasDoSite } from "./paginas";

export const dynamic = "force-dynamic";

/**
 * Textos do site, editados em cima da página onde aparecem.
 *
 * Antes era uma parede de cem campos com a chave técnica por rótulo, e
 * quem editava não sabia o que estava a mudar. Agora escolhe-se a
 * página, vê-se a página verdadeira ao lado e clica-se na frase. A
 * chave continua a existir, mas fica num pormenor discreto do painel.
 */
export default async function PaginaTextos({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string; pagina?: string; texto?: string }>;
}) {
  const { guardado, pagina, texto } = await searchParams;

  const [lista, [obra], [percurso]] = await Promise.all([
    db.select().from(textos).orderBy(asc(textos.chave)),
    // Os textos de uma ficha são os mesmos em todas; basta um exemplo
    // que o visitante também consiga abrir.
    db
      .select({ slug: obras.slug })
      .from(obras)
      .where(eq(obras.estado, "publicado"))
      .orderBy(asc(obras.ordem))
      .limit(1),
    db
      .select({ slug: exposicoes.slug })
      .from(exposicoes)
      .where(
        and(
          eq(exposicoes.estado, "publicado"),
          inArray(
            exposicoes.id,
            db.select({ id: salas.exposicaoId }).from(salas),
          ),
        ),
      )
      .limit(1),
  ]);

  const paginas = paginasDoSite({
    obra: obra?.slug ?? null,
    percurso: percurso?.slug ?? null,
  });

  const lidos: TextoDoSite[] = lista.map((t) => ({
    chave: t.chave,
    nome: nomeDoTexto(t.chave),
    nota: t.nota ?? "",
    pagina: paginaDoTexto(t.chave, t.grupo),
    valor: { pt: t.valor.pt, en: t.valor.en ?? "", es: t.valor.es ?? "" },
  }));

  // Só aparecem as páginas que têm textos; o "Outros" fica escondido
  // enquanto todos os grupos tiverem casa.
  const comTextos = paginas.filter((p) =>
    lidos.some((t) => t.pagina === p.id),
  );

  // Muda sempre que alguém guarda. O editor nasce de novo com ela, e
  // com ele a página ao lado, que assim mostra já o texto guardado.
  const versao = String(
    Math.max(0, ...lista.map((t) => t.actualizadoEm.getTime())),
  );

  return (
    <>
      <CabecalhoSeccao descricao="Escolha a página e clique no texto que quer mudar.">
        Textos do site
      </CabecalhoSeccao>

      <div className="px-6 pt-6 pb-16 lg:px-8">
        {guardado && <Aviso tom="bom">Textos guardados.</Aviso>}

        <EditorTextos
          key={versao}
          paginas={comTextos}
          textos={lidos}
          paginaInicial={pagina}
          textoInicial={texto}
        />
      </div>
    </>
  );
}
