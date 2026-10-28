import Link from "next/link";
import { Imagem, type MediaLeve } from "@/components/Imagem";
import { periodo, t, texto, type Idioma, type Localizado } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { situacao } from "@/lib/situacao";
import { colunas, cx } from "@/lib/utils";
import { VEU_FICHA } from "@/lib/veu";

/**
 * As peças da página de uma exposição: a capa com o título, o texto
 * curatorial com a ficha de visita, a citação e os artistas.
 *
 * Vivem à parte da página pela mesma razão que a `FichaObra`: a ficha
 * da exposição no backoffice desenha-se com este mesmo código, e é
 * por isso que o que lá se vê é o que o site mostra. As secções que as
 * envolvem (alturas, margens, fundos) ficam na página.
 */

/** A linha pequena por cima do título: situação e datas. */
export function etiquetaExposicao(
  expo: {
    dataInicio: string | null;
    dataFim: string | null;
    permanente: boolean;
  },
  idioma: Idioma,
): string {
  return [
    t(`estado.${situacao(expo)}`, idioma),
    periodo(expo.dataInicio, expo.dataFim, idioma, expo.permanente),
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Herói: imagem a toda a largura, título por cima do degradê.
 *
 * No backoffice o título troca-se por um campo (`tituloEditavel`) e
 * por baixo dele entram as datas e o lugar (`children`). No site nada
 * disso existe e o bloco de texto não apanha cliques.
 */
export function CabecalhoExposicao({
  imagem,
  titulo,
  etiqueta,
  prioridade = false,
  className,
  style,
  nivelTitulo = "h1",
  classeTitulo = "d-ficha",
  tituloEditavel,
  canto,
  children,
}: {
  imagem: MediaLeve;
  titulo: string;
  etiqueta: string;
  prioridade?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Na pré-visualização não é o título da página. */
  nivelTitulo?: "h1" | "p";
  /** O corpo do título mede-se pela janela; no backoffice, pela caixa. */
  classeTitulo?: string;
  tituloEditavel?: React.ReactNode;
  /** Por cima da capa, no canto: o "Trocar capa" do backoffice. */
  canto?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const Titulo = nivelTitulo;
  return (
    <section
      className={cx("relative min-h-[480px] overflow-hidden", className)}
      style={style}
    >
      <Imagem
        media={imagem}
        alt={`Vista da exposição ${titulo}`}
        legenda="Vista da exposição na adega"
        prioridade={prioridade}
        revelar={false}
        sizes="100vw"
        className="h-full"
      />
      {/* O véu apanha a capa toda e não uma faixa de altura fixa:
          um título de duas linhas saía fora dela e ficava por ler.
          Ver `src/lib/veu.ts`. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: VEU_FICHA }}
      />
      {canto}
      <div className="pointer-events-none absolute inset-x-margem bottom-10 sm:inset-x-10">
        <span className="etiqueta text-claro-55">{etiqueta}</span>
        {tituloEditavel ?? (
          <Titulo
            className={cx(
              "titulo mt-3.5 tracking-[-0.02em] uppercase",
              classeTitulo,
            )}
          >
            {titulo}
          </Titulo>
        )}
        {children}
      </div>
    </section>
  );
}

/** Os rótulos da ficha de visita, na língua da página. */
export function rotulosVisita(idioma: Idioma) {
  return {
    local: idioma === "pt" ? "LOCAL" : idioma === "en" ? "VENUE" : "LUGAR",
    visitas: idioma === "pt" ? "VISITAS" : idioma === "en" ? "VISITS" : "VISITAS",
    inclui:
      idioma === "pt"
        ? "A VISITA INCLUI"
        : idioma === "en"
          ? "THE VISIT INCLUDES"
          : "LA VISITA INCLUYE",
    reservas: idioma === "pt" ? "RESERVAS" : idioma === "en" ? "BOOKING" : "RESERVAS",
  };
}

/** A linha do lugar na ficha de visita: nome e morada (ou localidade). */
export function linhaLugar(
  lugar: { nome: string; morada: string | null; localidade: Localizado | null } | null,
  idioma: Idioma,
): string {
  return lugar
    ? [lugar.nome, lugar.morada ?? texto(lugar.localidade, idioma)]
        .filter(Boolean)
        .join(" · ")
    : "";
}

/** A ficha de visita: rótulo pequeno e valor, separados por fios. */
export function FichaVisita({
  linhas,
}: {
  linhas: Array<[string, React.ReactNode]>;
}) {
  return (
    <dl className="flex flex-col">
      {linhas.map(([rotulo, valor], i) => (
        <div
          key={rotulo}
          className={`flex flex-col gap-1.5 border-t border-fio py-[18px] ${
            i === linhas.length - 1 ? "border-b border-b-fio" : ""
          }`}
        >
          <dt className="text-[10px] tracking-[0.22em] text-claro-55">
            {rotulo}
          </dt>
          <dd className="corpo m-0">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Texto curatorial à esquerda, ficha de visita e botões à direita. */
export function TextoExposicao({
  texto: corrido,
  curadoria,
  ficha,
  botoes,
}: {
  texto: string;
  curadoria: string | null;
  ficha: Array<[string, React.ReactNode]>;
  botoes: React.ReactNode;
}) {
  const paragrafos = corrido.split(/\n\s*\n/);
  return (
    <div className="grid gap-14" style={colunas(300)}>
      <div className="flex flex-col gap-[22px]">
        {paragrafos.map((p, i) => (
          <p
            key={i}
            className={
              i === 0
                ? "text-[20px] leading-[1.55] text-papel"
                : "text-[17px] leading-[1.65] text-claro-80"
            }
          >
            {p}
          </p>
        ))}
        {curadoria && (
          <p className="meta tracking-[0.06em] text-claro-55">{curadoria}</p>
        )}
      </div>

      <aside className="flex flex-col self-start">
        <FichaVisita linhas={ficha} />
        <div className="flex flex-wrap gap-3 pt-6">{botoes}</div>
      </aside>
    </div>
  );
}

/** A citação do anfitrião, em bloco claro. */
export function CitacaoExposicao({
  citacao,
  autor,
}: {
  citacao: string;
  autor: string | null;
}) {
  return (
    <>
      <blockquote className="titulo-med mx-auto max-w-[26ch] text-center d-citacao-med">
        {citacao}
      </blockquote>
      {autor && (
        <p className="mt-7 text-center text-[12px] tracking-[0.2em] text-escuro-62">
          {autor}
        </p>
      )}
    </>
  );
}

/** O que a lista de artistas precisa de saber de cada um. */
export type ArtistaEmExposicao = {
  id: string;
  slug: string;
  nome: string;
  nota: Localizado | null;
  retrato: MediaLeve;
};

/** Artistas em exposição: retrato, nome, nota e link. */
export function ArtistasExposicao({
  artistas,
  idioma,
  nivelTitulo = "h2",
  revelar = true,
}: {
  artistas: ArtistaEmExposicao[];
  idioma: Idioma;
  nivelTitulo?: "h2" | "p";
  /** O retrato aparece ao entrar na janela. Na pré-visualização do
   *  backoffice não há quem o revele, e aparece logo. */
  revelar?: boolean;
}) {
  const Titulo = nivelTitulo;
  return (
    <>
      <Titulo className="titulo mb-10 d-apoio tracking-[-0.02em]">
        {idioma === "pt"
          ? "ARTISTAS EM EXPOSIÇÃO"
          : idioma === "en"
            ? "ARTISTS ON SHOW"
            : "ARTISTAS EN EXPOSICIÓN"}
      </Titulo>
      <ul className="grid gap-7" style={colunas(220)}>
        {artistas.map((a) => (
          <li key={a.id}>
            <Link
              href={caminho(idioma, `/artistas/${a.slug}`)}
              className="group flex flex-col gap-3.5 text-papel"
            >
              <Imagem
                media={a.retrato}
                alt={`Retrato de ${a.nome}`}
                proporcao="4/5"
                legenda={a.nome}
                sizes="(max-width: 700px) 50vw, 22vw"
                revelar={revelar}
              />
              <span className="titulo-med text-[17px] uppercase transition-colors group-hover:text-ouro">
                {a.nome}
              </span>
              {texto(a.nota, idioma) && (
                <span className="meta text-claro-65">{texto(a.nota, idioma)}</span>
              )}
              <span className="meta tracking-[0.14em] text-ouro">
                {t("acao.ver_artista", idioma)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
