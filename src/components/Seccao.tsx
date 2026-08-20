import { cx } from "@/lib/utils";

/** Secção padrão do site: 120px verticais, 28px laterais, fio em baixo. */
export function Seccao({
  id,
  children,
  className,
  claro = false,
  semFio = false,
  semPadding = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  claro?: boolean;
  semFio?: boolean;
  semPadding?: boolean;
}) {
  return (
    <section
      id={id}
      className={cx(
        semPadding ? "py-[120px]" : "px-7 py-[120px]",
        claro && "bg-papel text-tinta",
        !semFio && !claro && "border-b border-[rgba(242,237,228,0.14)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * Cabeçalho de secção: título grande à esquerda, nota à direita.
 *
 * Por omissão é o `h1` da página, porque é assim que é usado nas
 * páginas de índice. Nas secções interiores de uma página que já tem
 * `h1` (a homepage, por exemplo) passa-se `nivel={2}`: cada página tem
 * de ter um `h1`, e só um.
 */
export function TituloSeccao({
  children,
  nota,
  className,
  nivel = 1,
}: {
  children: React.ReactNode;
  nota?: React.ReactNode;
  className?: string;
  nivel?: 1 | 2;
}) {
  const Titulo = nivel === 1 ? "h1" : "h2";
  return (
    <div
      className={cx(
        "mb-12 flex flex-wrap items-baseline justify-between gap-5",
        className,
      )}
      data-surge=""
    >
      <Titulo className="titulo d-2">{children}</Titulo>
      {nota && <span className="etiqueta">{nota}</span>}
    </div>
  );
}
