import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import {
  Aviso,
  CabecalhoSeccao,
  Chip,
  Conteudo,
  Vazio,
} from "@/components/admin/Pecas";
import { faltaNaObra } from "@/lib/admin/lacunas";
import { db } from "@/lib/db";
import { obras } from "@/lib/db/schema";
import { texto } from "@/lib/i18n";
import { urlMedia } from "@/lib/media/url";
import { cx } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * As obras como aparecem no site: uma grelha de fotografias, e não uma
 * tabela. Quem gere a galeria reconhece uma obra pela imagem, não pelo
 * título, e uma obra sem fotografia salta à vista pelo marcador.
 */

type ObraLista = Awaited<ReturnType<typeof lerObras>>[number];

const lerObras = () =>
  db.query.obras.findMany({
    with: { artista: true, fotografia: true },
    orderBy: [asc(obras.ordem), desc(obras.criadoEm)],
  });

/**
 * Os filtros. Os cinco primeiros estão sempre; os outros valores que a
 * página sempre aceitou em `?filtro=` (arquivadas, reservadas, e
 * qualquer disponibilidade) continuam a funcionar, e ganham botão
 * quando há obras nesse estado.
 */
const FILTROS: Array<{
  chave: string;
  rotulo: string;
  passa: (o: ObraLista) => boolean;
  sempre: boolean;
}> = [
  { chave: "", rotulo: "Todas", passa: () => true, sempre: true },
  {
    chave: "publicado",
    rotulo: "No site",
    passa: (o) => o.estado === "publicado",
    sempre: true,
  },
  {
    chave: "sem-fotografia",
    rotulo: "Sem fotografia",
    passa: (o) => !o.fotografiaId,
    sempre: true,
  },
  {
    chave: "vendida",
    rotulo: "Vendidas",
    passa: (o) => o.disponibilidade === "vendida",
    sempre: true,
  },
  {
    chave: "rascunho",
    rotulo: "Rascunhos",
    passa: (o) => o.estado === "rascunho",
    sempre: true,
  },
  {
    chave: "reservada",
    rotulo: "Reservadas",
    passa: (o) => o.disponibilidade === "reservada",
    sempre: false,
  },
  {
    chave: "arquivado",
    rotulo: "Arquivadas",
    passa: (o) => o.estado === "arquivado",
    sempre: false,
  },
];

/** Um filtro que não está na lista compara com a disponibilidade. */
const filtroDe = (chave: string) =>
  FILTROS.find((f) => f.chave === chave)?.passa ??
  ((o: ObraLista) => o.disponibilidade === chave);

/** Sem acentos nem maiúsculas: "mario" encontra "Mário". */
const simples = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * O selo por cima da fotografia. Uma palavra só, a que mais importa:
 * um rascunho não está no site, venda-se ou não; uma obra no site diz
 * se já foi vendida ou reservada.
 */
function selo(o: ObraLista): { rotulo: string; classe: string } {
  if (o.estado === "rascunho")
    return { rotulo: "Rascunho", classe: "border border-fio-controlo bg-tinta text-papel" };
  if (o.estado === "arquivado")
    return { rotulo: "Arquivada", classe: "border border-fio-controlo bg-tinta text-claro-80" };
  if (o.disponibilidade === "vendida")
    return { rotulo: "Vendida", classe: "bg-ouro text-tinta" };
  if (o.disponibilidade === "reservada")
    return { rotulo: "Reservada", classe: "border border-ouro bg-tinta text-papel" };
  return { rotulo: "No site", classe: "bg-papel text-tinta" };
}

function preco(o: ObraLista): string {
  if (o.disponibilidade === "nao_venal") return "Não está à venda";
  return texto(o.preco, "pt").trim() || "Sob consulta";
}

export default async function ListaObras({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string; filtro?: string; q?: string }>;
}) {
  const { guardado, filtro = "", q = "" } = await searchParams;

  const todas = await lerObras();

  // A pesquisa vem primeiro e os filtros contam sobre o que ela deixa:
  // o número ao lado de cada botão é o que aparece ao carregar nele.
  const procura = simples(q.trim());
  const encontradas = procura
    ? todas.filter((o) =>
        simples(
          [o.titulo.pt, o.titulo.en, o.titulo.es, o.artista?.nome]
            .filter(Boolean)
            .join(" "),
        ).includes(procura),
      )
    : todas;
  const visiveis = encontradas.filter(filtroDe(filtro));

  const endereco = (chave: string, comPesquisa = true) => {
    const p = new URLSearchParams();
    if (chave) p.set("filtro", chave);
    if (comPesquisa && q.trim()) p.set("q", q.trim());
    const s = p.toString();
    return s ? `/admin/obras?${s}` : "/admin/obras";
  };

  const botoes = FILTROS.map((f) => ({
    ...f,
    n: encontradas.filter(f.passa).length,
  })).filter((f) => f.sempre || f.n > 0 || f.chave === filtro);

  return (
    <>
      <CabecalhoSeccao
        descricao="Tal como aparecem no site. Carregue numa para a editar."
        accao={{ href: "/admin/obras/novo", rotulo: "+ Acrescentar obra" }}
      >
        Obras
      </CabecalhoSeccao>

      <Conteudo>
        {guardado && <Aviso tom="bom">Obra guardada.</Aviso>}

        {todas.length === 0 ? (
          <Vazio>
            Ainda não há obras.{" "}
            <Link href="/admin/obras/novo">Acrescentar a primeira</Link>.
          </Vazio>
        ) : (
          <div className="flex flex-col gap-7">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-4">
              <div className="flex flex-wrap gap-2">
                {botoes.map((f) => (
                  <Chip
                    key={f.chave || "todas"}
                    href={endereco(f.chave)}
                    activo={filtro === f.chave}
                  >
                    {f.rotulo}
                    <span
                      className={cx(
                        "ml-2",
                        filtro === f.chave ? "text-claro-65" : "text-adm-suave",
                      )}
                    >
                      {f.n}
                    </span>
                  </Chip>
                ))}
              </div>

              {/* Um formulário simples, sem JavaScript: Enter procura, e
                  o filtro escolhido vai junto. */}
              <form
                role="search"
                action="/admin/obras"
                className="flex w-full min-w-0 items-center gap-2 border-b border-fio-escuro-forte md:ml-auto md:w-auto md:min-w-[280px]"
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="shrink-0"
                >
                  <circle cx="11" cy="11" r="6" />
                  <path d="M20 20l-4.5-4.5" />
                </svg>
                <label htmlFor="procurar-obra" className="so-leitor">
                  Procurar obra
                </label>
                {filtro && <input type="hidden" name="filtro" value={filtro} />}
                <input
                  id="procurar-obra"
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Procurar título ou artista"
                  className="min-w-0 flex-1 border-0 bg-transparent px-0 text-[14px]"
                />
                <button
                  type="submit"
                  className="min-h-11 shrink-0 cursor-pointer border-0 bg-transparent px-1 text-[12px] tracking-[0.12em] uppercase"
                >
                  Procurar
                </button>
              </form>
            </div>

            {procura && (
              <p className="-mt-3 text-[14px] text-adm-suave">
                {encontradas.length === 1
                  ? "1 obra encontrada"
                  : `${encontradas.length} obras encontradas`}{" "}
                para «{q.trim()}».{" "}
                <Link href={endereco(filtro, false)}>
                  Limpar a pesquisa
                </Link>
              </p>
            )}

            {visiveis.length === 0 ? (
              <Vazio>
                {procura
                  ? "Nenhuma obra com este filtro e esta pesquisa."
                  : "Nenhuma obra com este filtro."}{" "}
                <Link href="/admin/obras">Tirar o filtro</Link>.
              </Vazio>
            ) : (
              <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
                {visiveis.map((o) => (
                  <CartaoObra key={o.id} obra={o} acabada={o.id === guardado} />
                ))}
              </ul>
            )}
          </div>
        )}
      </Conteudo>
    </>
  );
}

/**
 * Uma obra na grelha. O cartão inteiro abre a ficha, mas o link é só
 * o título, esticado por cima de tudo: assim um leitor de ecrã ouve
 * "Wonder Frida" e não o cartão inteiro de seguida.
 */
function CartaoObra({ obra: o, acabada }: { obra: ObraLista; acabada: boolean }) {
  const foto = urlMedia(o.fotografia?.chave);
  const s = selo(o);
  const falta = faltaNaObra(o);
  const titulo = texto(o.titulo, "pt");

  return (
    <li
      data-obra={o.id}
      className={cx(
        "group relative flex min-w-0 flex-col gap-2.5",
        acabada && "outline-2 outline-offset-4 outline-ouro",
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-tinta-elevada">
        {foto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={foto}
            alt=""
            loading="lazy"
            className="block size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 border border-dashed border-fio-controlo px-2 text-center text-claro-65">
            <svg
              aria-hidden="true"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <path d="M4 7h3l2-3h6l2 3h3v12H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            <span className="text-[11px] tracking-[0.16em] uppercase">
              Pôr fotografia
            </span>
          </div>
        )}
        <span
          className={cx(
            "absolute top-2.5 left-2.5 px-2 py-[5px] text-[10px] tracking-[0.16em] uppercase",
            s.classe,
          )}
        >
          {s.rotulo}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-[3px]">
        <Link
          href={`/admin/obras/${o.id}`}
          className="text-[15px] font-semibold [overflow-wrap:anywhere] no-underline group-hover:underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ouro"
        >
          {titulo}
        </Link>
        <span className="text-[13px] text-adm-suave [overflow-wrap:anywhere]">
          {o.artista?.nome ?? "Sem artista"} · {preco(o)}
        </span>
        {falta.length > 0 && (
          // No site, a falta é a sério; num rascunho é trabalho por
          // acabar, e o vermelho ficava a gritar por coisa nenhuma.
          <span
            className={cx(
              "text-[12px]",
              o.estado === "publicado" ? "text-erro" : "text-adm-suave",
            )}
          >
            Falta: {falta.join(", ")}
          </span>
        )}
      </div>
    </li>
  );
}
