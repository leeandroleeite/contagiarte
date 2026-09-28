import type { Metadata } from "next";
import Link from "next/link";
import { CartaoObra } from "@/components/CartaoObra";
import { Seccao, TituloSeccao } from "@/components/Seccao";
import { listarArtistas, listarObras, obterTextos } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, cx } from "@/lib/utils";
import { DadosEstruturados, lista } from "@/lib/dados-estruturados";

export const dynamic = "force-dynamic";

type Busca = { artista?: string; estado?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const txt = await obterTextos();
  return metadados({
    idioma: lang,
    path: "/obras",
    titulo: comMarca(t("nav.obras", lang)),
    descricao: texto(txt["obras.descricao"], lang),
  });
}

export default async function PaginaObras({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Idioma }>;
  searchParams: Promise<Busca>;
}) {
  const { lang: idioma } = await params;
  const busca = await searchParams;

  const [todosArtistas, todas] = await Promise.all([
    listarArtistas(),
    listarObras({}),
  ]);
  const artistaEscolhido = todosArtistas.find((a) => a.slug === busca.artista);
  const soDisponiveis = busca.estado === "disponivel";

  const obras = todas.filter(
    (o) =>
      (!artistaEscolhido || o.artistaId === artistaEscolhido.id) &&
      (!soDisponiveis || o.disponibilidade === "disponivel"),
  );

  // Um filtro que leva a uma parede vazia, ou que não muda nada, ensina
  // a não confiar nos filtros. Só aparecem artistas com obras, e o
  // "Disponíveis" só quando tira alguma coisa da lista.
  const artistas = todosArtistas.filter(
    (a) => a.id === artistaEscolhido?.id || todas.some((o) => o.artistaId === a.id),
  );
  const doArtista = todas.filter(
    (o) => !artistaEscolhido || o.artistaId === artistaEscolhido.id,
  );
  const disponiveisFiltram =
    soDisponiveis ||
    doArtista.some((o) => o.disponibilidade !== "disponivel");

  // Os filtros são links: funcionam sem JavaScript e ficam indexáveis.
  const url = (mudanca: Partial<Busca>) => {
    const q = new URLSearchParams();
    const artista = mudanca.artista ?? busca.artista;
    const estado = mudanca.estado ?? busca.estado;
    if (mudanca.artista === "") {
      /* limpar */
    } else if (artista) q.set("artista", artista);
    if (mudanca.estado === "") {
      /* limpar */
    } else if (estado) q.set("estado", estado);
    const s = q.toString();
    return caminho(idioma, `/obras${s ? `?${s}` : ""}`);
  };

  return (
    <>
      <DadosEstruturados
        dados={lista(
          idioma,
          "Obras",
          obras.map((o) => ({
            nome: texto(o.titulo, idioma) || t("obra.sem_titulo", idioma),
            path: `/obras/${o.slug}`,
          })),
        )}
      />

      <Seccao className="pt-[160px]" semFio>
      <TituloSeccao nota={`${String(obras.length).padStart(2, "0")}`}>
        {t("nav.obras", idioma)}
      </TituloSeccao>

      <div className="mb-12 flex flex-wrap gap-2.5">
        <Filtro href={url({ artista: "" })} activo={!busca.artista}>
          {t("filtro.todas", idioma)}
        </Filtro>
        {artistas.map((a) => (
          <Filtro
            key={a.slug}
            href={url({ artista: a.slug })}
            activo={busca.artista === a.slug}
          >
            {a.nome}
          </Filtro>
        ))}
        {disponiveisFiltram && (
          <>
            <span className="w-px self-stretch bg-fio" />
            <Filtro
              href={url({ estado: soDisponiveis ? "" : "disponivel" })}
              activo={soDisponiveis}
            >
              {t("filtro.disponivel", idioma)}
            </Filtro>
          </>
        )}
      </div>

      {obras.length === 0 ? (
        <div className="flex flex-col items-start gap-5">
          <p className="corpo text-claro-65">{t("msg.sem_resultados", idioma)}</p>
          <Link
            href={caminho(idioma, "/obras")}
            className="etiqueta inline-flex min-h-11 items-center"
          >
            {t("acao.limpar_filtros", idioma)}
          </Link>
        </div>
      ) : (
        <ul
          className="grid gap-x-8 gap-y-14"
          style={colunas(280, "auto-fill")}
        >
          {obras.map((obra, i) => (
            <li key={obra.id}>
              <CartaoObra
                obra={obra}
                idioma={idioma}
                numero={i + 1}
                sizes="(max-width: 700px) 100vw, (max-width: 1200px) 45vw, 30vw"
              />
            </li>
          ))}
        </ul>
      )}

      {artistaEscolhido && (
        <p className="corpo mt-14">
          <Link href={caminho(idioma, `/artistas/${artistaEscolhido.slug}`)}>
            {texto(artistaEscolhido.nota, idioma) || artistaEscolhido.nome}{" "}
            {t("acao.ver_artista", idioma)}
          </Link>
        </p>
      )}
    </Seccao>
    </>
  );
}

function Filtro({
  href,
  activo,
  children,
}: {
  href: string;
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? "true" : undefined}
      className={cx(
        "etiqueta inline-flex min-h-11 items-center border px-5 py-3 transition-colors",
        activo
          ? "border-papel bg-papel text-tinta hover:bg-papel hover:text-tinta"
          : "border-fio-forte text-claro-65 hover:border-papel hover:text-papel",
      )}
    >
      {children}
    </Link>
  );
}
