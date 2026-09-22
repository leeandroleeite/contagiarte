import Link from "next/link";
import { cx } from "@/lib/utils";

type Variante = "ouro" | "linha" | "claro";

const BASE =
  "inline-flex items-center justify-center px-8 py-[18px] min-h-12 text-[12px] tracking-[0.18em] uppercase transition-colors";

const VARIANTES: Record<Variante, string> = {
  ouro: "bg-ouro text-tinta border border-ouro hover:bg-papel hover:border-papel hover:text-tinta",
  linha:
    "bg-transparent text-papel border border-[rgba(242,237,228,0.35)] hover:border-ouro hover:text-ouro",
  claro:
    "bg-tinta text-papel border border-tinta hover:bg-ouro hover:border-ouro hover:text-tinta",
};

type Props = {
  /** Para onde vai. Com `aoClicar`, desenha um botão e dispensa-se. */
  href?: string;
  children: React.ReactNode;
  variante?: Variante;
  externo?: boolean;
  className?: string;
  download?: boolean;
  /** Quando é uma acção e não um destino, como recarregar a página. */
  aoClicar?: () => void;
};

export function Botao({
  href,
  children,
  variante = "ouro",
  externo = false,
  className,
  download,
  aoClicar,
}: Props) {
  const classe = cx(BASE, VARIANTES[variante], className);

  // Uma acção é um botão. Um link que não navega para lado nenhum não
  // se anuncia como link a quem usa leitor de ecrã, e não funciona com
  // o teclado da mesma maneira.
  if (aoClicar) {
    return (
      <button type="button" onClick={aoClicar} className={classe}>
        {children}
      </button>
    );
  }

  if (!href) return null;

  if (externo || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a
        href={href}
        className={classe}
        {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...(download ? { download: "" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classe}>
      {children}
    </Link>
  );
}
