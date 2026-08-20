import { desc, eq } from "drizzle-orm";
import { BotaoApagar } from "@/components/admin/BotaoApagar";
import {
  Aviso,
  Estado,
  Titulo,
  Vazio,
} from "@/components/admin/Pecas";
import { actualizarPedido, apagarPedido } from "@/lib/admin/accoes";
import { db } from "@/lib/db";
import { pedidos, subscritores } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { urlMedia } from "@/lib/media/url";

export const dynamic = "force-dynamic";

const ROTULO: Record<string, string> = {
  moldura: "Orçamento de moldura",
  obra: "Interesse numa obra",
  contacto: "Contacto geral",
  visita: "Marcação de visita",
  parede: "Ver na parede",
};

const quando = (d: Date) =>
  new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);

export default async function PaginaPedidos() {
  const [lista, listaSubscritores] = await Promise.all([
    db.query.pedidos.findMany({
      with: { obra: true, anexo: true },
      orderBy: [desc(pedidos.criadoEm)],
      limit: 200,
    }),
    db
      .select()
      .from(subscritores)
      .where(eq(subscritores.estado, "activo"))
      .orderBy(desc(subscritores.criadoEm))
      .limit(500),
  ]);

  return (
    <>
      <Titulo nota="Tudo o que chega pelos formulários do site.">Pedidos</Titulo>

      {!env.email.configurado && (
        <Aviso>
          Não há serviço de email configurado: os pedidos ficam guardados aqui,
          mas ninguém recebe aviso. Defina RESEND_API_KEY ou SMTP_URL.
        </Aviso>
      )}

      {lista.length === 0 ? (
        <Vazio>Ainda não chegou nenhum pedido.</Vazio>
      ) : (
        <div className="flex flex-col gap-5">
          {lista.map((p) => {
            const actualizar = actualizarPedido.bind(null, p.id);
            const apagar = apagarPedido.bind(null, p.id);
            const anexo = urlMedia(p.anexo?.chave);
            const extra = (p.dados ?? {}) as Record<string, unknown>;

            return (
              <article
                key={p.id}
                className="border border-adm-fio bg-adm-cartao p-5"
              >
                <header className="mb-3 flex flex-wrap items-center gap-3">
                  <Estado valor={p.estado} />
                  <span className="text-[13px] tracking-[0.14em] text-adm-suave uppercase">
                    {ROTULO[p.tipo] ?? p.tipo}
                  </span>
                  <span className="ml-auto text-[13px] text-adm-suave">
                    {quando(p.criadoEm)}
                  </span>
                </header>

                <p className="mb-1 text-[17px] font-medium">
                  {p.nome ?? "Sem nome"}
                </p>
                <p className="mb-3 text-[15px]">
                  {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
                  {p.email && p.telefone && " · "}
                  {p.telefone && <a href={`tel:${p.telefone}`}>{p.telefone}</a>}
                </p>

                {p.obra && (
                  <p className="mb-2 text-[15px]">
                    Obra: <strong>{p.obra.titulo.pt}</strong>
                  </p>
                )}

                {p.mensagem && (
                  <p className="mb-3 max-w-[70ch] text-[15px] whitespace-pre-line">
                    {p.mensagem}
                  </p>
                )}

                {Object.keys(extra).length > 0 && (
                  <dl className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-[14px] text-adm-suave">
                    {Object.entries(extra).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt>{k}:</dt>
                        <dd className="m-0">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {anexo && (
                  <p className="mb-3 text-[14px]">
                    <a href={anexo} target="_blank" rel="noopener noreferrer">
                      Ver anexo →
                    </a>
                  </p>
                )}

                <form
                  action={actualizar}
                  className="flex flex-wrap items-end gap-3 border-t border-adm-fio pt-4"
                >
                  <div className="w-[170px]">
                    <label
                      className="adm-rotulo"
                      htmlFor={`estado-${p.id}`}
                    >
                      Estado
                    </label>
                    <select
                      id={`estado-${p.id}`}
                      name="estado"
                      defaultValue={p.estado}
                    >
                      <option value="novo">Novo</option>
                      <option value="em_curso">Em curso</option>
                      <option value="fechado">Fechado</option>
                    </select>
                  </div>

                  <div className="min-w-[240px] flex-1">
                    <label
                      className="adm-rotulo"
                      htmlFor={`nota-${p.id}`}
                    >
                      Nota interna
                    </label>
                    <input
                      id={`nota-${p.id}`}
                      name="notaInterna"
                      defaultValue={p.notaInterna ?? ""}
                    />
                  </div>

                  <button type="submit" className="adm-botao">
                    Guardar
                  </button>
                  <BotaoApagar
                    accao={apagar}
                    rotulo="Apagar"
                    pergunta="Apagar este pedido? Perde-se o contacto."
                  />
                </form>
              </article>
            );
          })}
        </div>
      )}

      <h2 className="titulo-med mt-14 mb-4 text-[20px]">
        Newsletter ({listaSubscritores.length})
      </h2>

      {listaSubscritores.length === 0 ? (
        <p className="text-[15px] text-adm-suave">Ainda não há subscritores.</p>
      ) : (
        <>
          <p className="mb-3 text-[14px] text-adm-suave">
            Copie esta lista para a ferramenta de envio.
          </p>
          <textarea
            readOnly
            rows={8}
            className="font-mono text-[13px]"
            value={listaSubscritores.map((s) => s.email).join("\n")}
          />
        </>
      )}
    </>
  );
}
