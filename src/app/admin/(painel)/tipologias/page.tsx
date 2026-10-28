import { asc } from "drizzle-orm";
import Link from "next/link";
import { BarraGuardar } from "@/components/admin/BarraGuardar";
import { BotaoApagar } from "@/components/admin/BotaoApagar";
import { CampoLocalizado, CampoTexto } from "@/components/admin/Campos";
import {
  Aviso,
  CabecalhoSeccao,
  Conteudo,
  Grelha,
} from "@/components/admin/Pecas";
import { apagarDisciplina, guardarDisciplina } from "@/lib/admin/accoes";
import { db } from "@/lib/db";
import { artistas, disciplinas } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Tipologias dos artistas. São o filtro da lista de artistas no site,
 * pela ordem definida aqui. Como no percurso, cada uma edita-se no
 * próprio cartão, e o último cartão acrescenta uma nova.
 */
export default async function PaginaTipologias({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string; erro?: string; id?: string }>;
}) {
  const { guardado, erro, id: idErro } = await searchParams;

  const [lista, usos] = await Promise.all([
    db.query.disciplinas.findMany({ orderBy: [asc(disciplinas.ordem)] }),
    db.select({ id: artistas.disciplinaId }).from(artistas),
  ]);

  const contar = (id: string) => usos.filter((u) => u.id === id).length;
  const recusada = erro === "em-uso" && lista.find((d) => d.id === idErro);

  return (
    <>
      <CabecalhoSeccao descricao="O filtro da lista de artistas no site, pela ordem definida aqui. Só aparecem as tipologias com artistas publicados.">
        Tipologias
      </CabecalhoSeccao>

      <Conteudo estreito>
        {guardado && <Aviso tom="bom">Tipologia guardada.</Aviso>}
        {recusada && (
          <Aviso tom="erro">
            Não foi possível apagar {recusada.nome.pt}: ainda há{" "}
            {contar(recusada.id)} artistas com esta tipologia. Escolha outra
            para eles em <Link href="/admin/artistas">Artistas</Link>, e
            depois apague.
          </Aviso>
        )}

        <div className="flex flex-col gap-10">
          {lista.map((d) => (
            <FormularioTipologia
              key={d.id}
              tipologia={d}
              artistas={contar(d.id)}
            />
          ))}

          <FormularioTipologia ordemSugerida={lista.length + 1} />
        </div>
      </Conteudo>
    </>
  );
}

function FormularioTipologia({
  tipologia,
  artistas = 0,
  ordemSugerida,
}: {
  tipologia?: typeof disciplinas.$inferSelect;
  artistas?: number;
  ordemSugerida?: number;
}) {
  const nova = !tipologia;
  const guardar = guardarDisciplina.bind(null, tipologia?.id ?? null);
  const apagar = tipologia ? apagarDisciplina.bind(null, tipologia.id) : null;

  return (
    <section
      className="border border-adm-fio bg-adm-cartao p-6"
      data-tipologia={tipologia?.slug}
    >
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="titulo-med text-[18px]">
          {nova ? "Acrescentar tipologia" : tipologia!.nome.pt}
        </h2>
        {!nova && (
          <span className="text-[13px] text-adm-suave">
            {artistas === 1 ? "1 artista" : `${artistas} artistas`}
          </span>
        )}
      </div>

      <form action={guardar}>
        <Grelha>
          <CampoLocalizado
            nome="nome"
            rotulo="Nome"
            valor={tipologia?.nome}
            obrigatorio
            nota="Como aparece no botão do filtro. Ex. Obra gráfica."
          />
          <CampoTexto
            nome="ordem"
            id={`ordem-${tipologia?.slug ?? "nova"}`}
            rotulo="Ordem"
            tipo="number"
            valor={tipologia?.ordem ?? ordemSugerida ?? 0}
            nota="A mais baixa aparece primeiro."
          />
          <CampoLocalizado
            nome="nota"
            rotulo="O que abrange"
            valor={tipologia?.nota}
            nota="Opcional. O texto entre parênteses, ex. serigrafia, gravura, litografia, giclée. Aparece ao passar o rato no filtro e na escolha do artista."
            largo
          />
        </Grelha>

        <BarraGuardar
          voltarPara="/admin/tipologias"
          extra={
            apagar &&
            (artistas > 0 ? (
              <span className="text-[13px] text-adm-suave">
                Em uso: para apagar, mude antes a tipologia destes artistas.
              </span>
            ) : (
              <BotaoApagar accao={apagar} rotulo="Apagar tipologia" />
            ))
          }
        />
      </form>
    </section>
  );
}
