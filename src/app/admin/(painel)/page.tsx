import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Aviso, Estado, CabecalhoSeccao, Conteudo } from "@/components/admin/Pecas";
import { levantarLacunas } from "@/lib/admin/lacunas";
import { db } from "@/lib/db";
import {
  artistas,
  exposicoes,
  lugares,
  obras,
  pedidos,
  subscritores,
} from "@/lib/db/schema";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const ROTULO_PEDIDO: Record<string, string> = {
  moldura: "Moldura",
  obra: "Obra",
  contacto: "Contacto",
  visita: "Visita",
  parede: "Ver na parede",
};

export default async function Painel() {
  const [
    totalObras,
    obrasPublicadas,
    totalArtistas,
    totalExposicoes,
    totalLugares,
    pedidosNovos,
    subscritoresActivos,
    ultimosPedidos,
    lacunas,
  ] = await Promise.all([
    db.$count(obras),
    db.$count(obras, eq(obras.estado, "publicado")),
    db.$count(artistas, eq(artistas.estado, "publicado")),
    db.$count(exposicoes, eq(exposicoes.estado, "publicado")),
    db.$count(lugares, eq(lugares.estado, "publicado")),
    db.$count(pedidos, eq(pedidos.estado, "novo")),
    db.$count(subscritores, eq(subscritores.estado, "activo")),
    db
      .select()
      .from(pedidos)
      .orderBy(desc(pedidos.criadoEm))
      .limit(6),
    levantarLacunas(),
  ]);

  const porFazer: string[] = [];
  if (!env.r2.configurado) {
    porFazer.push(
      "O armazenamento R2 ainda não está configurado: não é possível carregar fotografias nem PDFs.",
    );
  }
  if (!env.email.configurado) {
    porFazer.push(
      "Não há serviço de email configurado: os pedidos ficam guardados aqui, mas não chega aviso à caixa de correio.",
    );
  }

  return (
    <>
      <CabecalhoSeccao descricao="Estado do site e o que falta tratar.">Painel</CabecalhoSeccao>

      <Conteudo>
      {porFazer.length > 0 && (
        <div className="mb-8">
          {porFazer.map((p) => (
            <Aviso key={p}>{p}</Aviso>
          ))}
        </div>
      )}

      <OQueFalta {...lacunas} />

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Numero
          rotulo="Obras publicadas"
          valor={`${obrasPublicadas} / ${totalObras}`}
          href="/admin/obras"
        />
        <Numero
          rotulo="Artistas"
          valor={totalArtistas}
          href="/admin/artistas"
        />
        <Numero
          rotulo="Exposições"
          valor={totalExposicoes}
          href="/admin/exposicoes"
        />
        <Numero rotulo="Lugares" valor={totalLugares} href="/admin/lugares" />
        <Numero
          rotulo="Pedidos por ver"
          valor={pedidosNovos}
          href="/admin/pedidos"
        />
        <Numero
          rotulo="Subscritores"
          valor={subscritoresActivos}
          href="/admin/pedidos"
        />
      </div>

      <h2 className="titulo-med mb-4 text-[20px]">Últimos pedidos</h2>

      {ultimosPedidos.length === 0 ? (
        <p className="text-[15px] text-adm-suave">
          Ainda não chegou nenhum pedido pelo site.
        </p>
      ) : (
        <ul className="flex flex-col border-t border-adm-fio">
          {ultimosPedidos.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-3 border-b border-adm-fio py-3"
            >
              <Estado valor={p.estado} />
              <span className="text-[14px] text-adm-suave">
                {ROTULO_PEDIDO[p.tipo] ?? p.tipo}
              </span>
              <span className="font-medium">{p.nome ?? "Sem nome"}</span>
              <span className="text-[14px] text-adm-suave">
                {p.email ?? p.telefone ?? ""}
              </span>
              <span className="ml-auto text-[13px] text-adm-suave">
                {new Intl.DateTimeFormat("pt-PT", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(p.criadoEm)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[14px]">
        <Link href="/admin/pedidos">Ver todos os pedidos →</Link>
      </p>
      </Conteudo>
    </>
  );
}

function Numero({
  rotulo,
  valor,
  href,
}: {
  rotulo: string;
  valor: number | string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 border border-adm-fio bg-adm-cartao p-4 no-underline"
    >
      <span className="text-[10px] tracking-[0.2em] text-adm-suave uppercase">
        {rotulo}
      </span>
      <span className="titulo text-[30px] leading-none">{valor}</span>
    </Link>
  );
}

/**
 * O que falta preencher, com o nome de cada coisa e o caminho para a
 * corrigir. Um número não se corrige; um link abre-se.
 */
function OQueFalta({
  lista,
  mediaSemDescricao,
  totalMedia,
  provisorios,
}: Awaited<ReturnType<typeof levantarLacunas>>) {
  if (lista.length === 0 && mediaSemDescricao === 0 && provisorios.length === 0) {
    return (
      <div className="mb-10 border border-adm-fio bg-adm-cartao p-5">
        <h2 className="titulo-med mb-1 text-[20px]">O que falta</h2>
        <p className="text-[15px] text-adm-suave">
          Nada. Todas as fichas publicadas estão completas.
        </p>
      </div>
    );
  }

  const grupos = new Map<string, typeof lista>();
  for (const l of lista) {
    grupos.set(l.grupo, [...(grupos.get(l.grupo) ?? []), l]);
  }

  return (
    <div className="mb-10 border border-adm-fio bg-adm-cartao p-5">
      <h2 className="titulo-med mb-1 text-[20px]">O que falta</h2>
      <p className="mb-5 text-[14px] text-adm-suave">
        {lista.length} ficha(s) publicada(s) por completar. Só conta o que já
        está no site: um rascunho por acabar é um rascunho.
      </p>

      {[...grupos.entries()].map(([grupo, itens]) => {
        // A explicação é a mesma para todos os itens com a mesma
        // falha. Repetida doze vezes seguidas deixa de se ler, por
        // isso vai uma vez no topo do grupo.
        const porques = [...new Set(itens.map((l) => l.porque).filter(Boolean))];
        return (
          <section key={grupo} className="mb-5 last:mb-0">
            <h3 className="mb-2 text-[11px] tracking-[0.2em] text-adm-suave uppercase">
              {grupo} · {itens.length}
            </h3>
            {porques.map((p) => (
              <p key={p} className="mb-2 text-[13px] text-adm-suave">
                {p}
              </p>
            ))}
            <ul className="flex flex-col border-t border-adm-fio">
              {itens.map((l) => (
                <li
                  key={l.href + l.nome}
                  className="flex flex-wrap items-baseline gap-x-3 border-b border-adm-fio py-2.5"
                >
                  <Link href={l.href} className="font-medium">
                    {l.nome}
                  </Link>
                  <span className="text-[14px] text-adm-suave">
                    falta {l.falta.join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {provisorios.length > 0 && (
        <section className="mb-5">
          <h3 className="mb-2 text-[11px] tracking-[0.2em] text-adm-suave uppercase">
            Textos provisórios · {provisorios.length}
          </h3>
          <p className="mb-2 text-[13px] text-adm-suave">
            Escritos durante o desenho, à espera da versão da galeria. Estão
            no site como se fossem definitivos.
          </p>
          <ul className="flex flex-col border-t border-adm-fio">
            {provisorios.map((t) => (
              <li
                key={t.chave}
                className="flex flex-wrap items-baseline gap-x-3 border-b border-adm-fio py-2.5"
              >
                <Link href="/admin/textos" className="font-medium">
                  {t.chave}
                </Link>
                {t.nota && (
                  <span className="text-[14px] text-adm-suave">{t.nota}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {mediaSemDescricao > 0 && (
        <p className="mt-5 text-[14px] text-adm-suave">
          <Link href="/admin/media">{mediaSemDescricao}</Link> de {totalMedia}{" "}
          ficheiros da mediateca sem descrição. Sem ela não se encontram pela
          pesquisa, e um leitor de ecrã não os sabe anunciar.
        </p>
      )}
    </div>
  );
}
