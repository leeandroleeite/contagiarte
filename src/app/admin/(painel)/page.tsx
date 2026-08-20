import { and, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { Aviso, Estado, CabecalhoSeccao, Conteudo } from "@/components/admin/Pecas";
import { db } from "@/lib/db";
import {
  artistas,
  descarregaveis,
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
    obrasSemFoto,
    totalArtistas,
    totalExposicoes,
    totalLugares,
    docsSemFicheiro,
    pedidosNovos,
    subscritoresActivos,
    ultimosPedidos,
  ] = await Promise.all([
    db.$count(obras),
    db.$count(obras, eq(obras.estado, "publicado")),
    db.$count(
      obras,
      and(eq(obras.estado, "publicado"), sql`${obras.fotografiaId} is null`),
    ),
    db.$count(artistas, eq(artistas.estado, "publicado")),
    db.$count(exposicoes, eq(exposicoes.estado, "publicado")),
    db.$count(lugares, eq(lugares.estado, "publicado")),
    db.$count(descarregaveis, sql`${descarregaveis.ficheiroId} is null`),
    db.$count(pedidos, eq(pedidos.estado, "novo")),
    db.$count(subscritores, eq(subscritores.estado, "activo")),
    db
      .select()
      .from(pedidos)
      .orderBy(desc(pedidos.criadoEm))
      .limit(6),
  ]);

  const porFazer: string[] = [];
  if (!env.r2.configurado) {
    porFazer.push(
      "O armazenamento R2 ainda não está configurado: não é possível carregar fotografias nem PDFs.",
    );
  }
  if (obrasSemFoto > 0) {
    porFazer.push(
      `${obrasSemFoto} obra(s) publicada(s) sem fotografia. Aparecem no site com um marcador em vez da imagem.`,
    );
  }
  if (docsSemFicheiro > 0) {
    porFazer.push(
      `${docsSemFicheiro} descarregável(is) sem PDF associado. Ficam escondidos até o ficheiro entrar.`,
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
