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

/** Cabeçalho de secção: título grande à esquerda, nota à direita. */
export function TituloSeccao({
  children,
  nota,
  className,
}: {
  children: React.ReactNode;
  nota?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "mb-12 flex flex-wrap items-baseline justify-between gap-5",
        className,
      )}
      data-surge=""
    >
      <h2 className="titulo d-2">{children}</h2>
      {nota && <span className="etiqueta">{nota}</span>}
    </div>
  );
}
