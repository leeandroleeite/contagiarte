import type { Metadata } from "next";
import Link from "next/link";
import { CartaoObra } from "@/components/CartaoObra";
import { Seccao, TituloSeccao } from "@/components/Seccao";
import { listarArtistas, listarObras } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { comMarca, metadados } from "@/lib/metadados";
import { colunas, cx } from "@/lib/utils";

export const revalidate = 300;

type Busca = { artista?: string; estado?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return metadados({
    idioma: lang,
    path: "/obras",
    titulo: comMarca(t("nav.obras", lang)),
    descricao:
      lang === "pt"
        ? "Obras disponíveis na Galeria Contagiarte: pintura, escultura, cerâmica e técnica mista de artistas nacionais e internacionais."
        : lang === "en"
          ? "Works available at Galeria Contagiarte: painting, sculpture, ceramics and mixed media by Portuguese and international artists."
          : "Obras disponibles en la Galería Contagiarte: pintura, escultura, cerámica y técnica mixta de artistas nacionales e internacionales.",
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

  const artistas = await listarArtistas();
  const artistaEscolhido = artistas.find((a) => a.slug === busca.artista);
  const soDisponiveis = busca.estado === "disponivel";

  const obras = await listarObras({
    artistaId: artistaEscolhido?.id,
    soDisponiveis,
  });

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
    <Seccao className="pt-[160px]" semFio>
      <TituloSeccao nota={`${String(obras.length).padStart(2, "0")}`}>
        {t("nav.obras", idioma).toUpperCase()}
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
        <span className="w-px self-stretch bg-[rgba(242,237,228,0.16)]" />
        <Filtro
          href={url({ estado: soDisponiveis ? "" : "disponivel" })}
          activo={soDisponiveis}
        >
          {t("filtro.disponivel", idioma)}
        </Filtro>
      </div>

      {obras.length === 0 ? (
        <p className="text-[16px] text-claro-55">
          {t("msg.sem_resultados", idioma)}
        </p>
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
        <p className="mt-14 text-[15px]">
          <Link href={caminho(idioma, `/artistas/${artistaEscolhido.slug}`)}>
            {texto(artistaEscolhido.nota, idioma) || artistaEscolhido.nome}{" "}
            {t("acao.ver_artista", idioma)}
          </Link>
        </p>
      )}
    </Seccao>
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
        "inline-flex min-h-11 items-center border px-5 py-3 text-[11px] tracking-[0.18em] uppercase transition-colors",
        activo
          ? "border-papel bg-papel text-tinta hover:bg-papel hover:text-tinta"
          : "border-[rgba(242,237,228,0.25)] text-[rgba(242,237,228,0.7)] hover:border-papel hover:text-papel",
      )}
    >
      {children}
    </Link>
  );
}
