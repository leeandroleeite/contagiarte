import Link from "next/link";
import { cx } from "@/lib/utils";

/**
 * Cabeçalho de secção: barra clara a toda a largura, com o título, uma
 * linha que explica para que serve a secção, e a acção principal à
 * direita. É o que o desenho tem no topo de cada ecrã do backoffice.
 */
export function CabecalhoSeccao({
  children,
  descricao,
  accao,
}: {
  children: React.ReactNode;
  descricao?: string;
  accao?: { href: string; rotulo: string };
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-adm-fio bg-adm-cartao px-6 py-[26px] lg:px-8">
      <div className="flex flex-col gap-1.5">
        <h1
          className="titulo text-[clamp(24px,3vw,30px)]"
          style={{ fontStretch: "112%" }}
        >
          {children}
        </h1>
        {descricao && (
          <span className="text-[14px] text-adm-suave">{descricao}</span>
        )}
      </div>
      {accao && (
        <Link href={accao.href} className="adm-botao no-underline">
          {accao.rotulo}
        </Link>
      )}
    </header>
  );
}

/** Corpo da página, com o respiro que o desenho dá. */
export function Conteudo({
  children,
  estreito = false,
}: {
  children: React.ReactNode;
  estreito?: boolean;
}) {
  return (
    <div
      className={cx(
        "px-6 pt-7 pb-16 lg:px-8",
        estreito && "max-w-[900px]",
      )}
    >
      {children}
    </div>
  );
}

/** Aviso curto: confirmação, erro ou nota de contexto. */
export function Aviso({
  tom = "nota",
  children,
}: {
  tom?: "nota" | "bom" | "erro";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tom === "erro" ? "alert" : "status"}
      className={cx(
        "mb-6 border-l-2 px-4 py-3 text-[14px]",
        tom === "bom" && "border-l-[#1F5133] bg-[#DCEBE0]",
        tom === "erro" && "border-l-[#6B2B22] bg-[#F3DCD8]",
        tom === "nota" && "border-l-ouro bg-[rgba(180,136,74,0.12)]",
      )}
    >
      {children}
    </p>
  );
}

/**
 * Etiqueta de estado. As cores vêm do desenho: verde para o que está
 * no ar, âmbar para o que está em suspenso, vermelho para o que já não
 * se vende, cinzento para o que ainda não saiu de rascunho.
 */
const CORES: Record<string, [string, string]> = {
  publicado: ["#1F5133", "#DCEBE0"],
  disponivel: ["#1F5133", "#DCEBE0"],
  activo: ["#1F5133", "#DCEBE0"],
  em_curso: ["#1F5133", "#DCEBE0"],
  traduzido: ["#1F5133", "#DCEBE0"],
  reservada: ["#7A5410", "#F3E7CE"],
  permanente: ["#7A5410", "#F3E7CE"],
  destaque: ["#7A5410", "#F3E7CE"],
  moldura: ["#7A5410", "#F3E7CE"],
  vendida: ["#6B2B22", "#F3DCD8"],
  parceria: ["#2B3F6B", "#DCE2F0"],
  obra: ["#1F5133", "#DCEBE0"],
};

const ROTULOS: Record<string, string> = {
  publicado: "Publicado",
  rascunho: "Rascunho",
  arquivado: "Arquivado",
  disponivel: "Disponível",
  reservada: "Reservada",
  vendida: "Vendida",
  nao_venal: "Não venal",
  novo: "Novo",
  em_curso: "Em curso",
  fechado: "Fechado",
  pendente: "Pendente",
  activo: "Activo",
  removido: "Removido",
  permanente: "Permanente",
  proxima: "Brevemente",
  destaque: "Na homepage",
  traduzido: "Traduzido",
  por_traduzir: "Por traduzir",
};

export function Estado({ valor }: { valor: string }) {
  const [cor, fundo] = CORES[valor] ?? ["rgba(14,12,11,0.6)", "rgba(14,12,11,0.08)"];
  return (
    <span
      className="inline-block max-w-full overflow-hidden px-2.5 py-1.5 text-[12px] text-ellipsis whitespace-nowrap"
      style={{ background: fundo, color: cor }}
    >
      {ROTULOS[valor] ?? valor}
    </span>
  );
}

/** Botão de filtro, no estilo do desenho. */
export function Chip({
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
        "inline-flex min-h-[42px] items-center border px-[18px] py-[11px] text-[12px] tracking-[0.12em] no-underline transition-colors",
        activo
          ? "border-tinta bg-tinta text-papel hover:text-papel"
          : "border-adm-fio-forte bg-transparent text-[rgba(14,12,11,0.7)] hover:border-tinta hover:text-tinta",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Linha de listagem em cartão. O desenho não usa tabelas: usa cartões
 * em grelha, que aguentam melhor um ecrã estreito e deixam a miniatura
 * respirar.
 */
export function Linha({
  colunas,
  children,
}: {
  /** Ex. "64px minmax(180px,2fr) 116px". */
  colunas: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid min-w-max items-center gap-4 border border-adm-fio bg-adm-cartao px-4 py-3.5"
      style={{ gridTemplateColumns: colunas }}
    >
      {children}
    </div>
  );
}

/** Cabeçalho de colunas de uma listagem em linhas. */
export function TituloColunas({
  colunas,
  rotulos,
}: {
  colunas: string;
  rotulos: string[];
}) {
  return (
    <div
      className="grid min-w-max gap-4 px-4 pb-3 text-[11px] tracking-[0.08em] whitespace-nowrap text-[rgba(14,12,11,0.45)]"
      style={{ gridTemplateColumns: colunas }}
    >
      {rotulos.map((r, i) => (
        <span key={`${r}-${i}`}>{r}</span>
      ))}
    </div>
  );
}

/** Miniatura quadrada de uma imagem, ou marcador quando não há. */
export function Miniatura({
  url,
  tamanho = 64,
}: {
  url: string | null;
  tamanho?: number;
}) {
  return (
    <div
      className="flex items-center justify-center border border-adm-fio bg-[rgba(14,12,11,0.06)]"
      style={{
        width: tamanho,
        height: tamanho,
        ...(url
          ? {
              backgroundImage: `url(${url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { borderStyle: "dashed" }),
      }}
      aria-hidden="true"
    />
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-adm-fio-forte px-6 py-12 text-center text-[15px] text-adm-suave">
      {children}
    </div>
  );
}

/** Grelha de campos de um formulário de edição. */
export function Grelha({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">{children}</div>
  );
}

/** Cartão claro que agrupa campos, como nas Definições do desenho. */
export function Cartao({
  titulo,
  children,
}: {
  titulo?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3.5 border border-adm-fio bg-adm-cartao p-5">
      {titulo && (
        <span className="text-[11px] tracking-[0.16em] text-[rgba(14,12,11,0.45)]">
          {titulo}
        </span>
      )}
      {children}
    </section>
  );
}
