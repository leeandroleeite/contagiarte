import Link from "next/link";
import { cx } from "@/lib/utils";

/** Cabeçalho de página do backoffice, com acção principal à direita. */
export function Titulo({
  children,
  nota,
  accao,
}: {
  children: React.ReactNode;
  nota?: string;
  accao?: { href: string; rotulo: string };
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="titulo text-[clamp(28px,4vw,44px)] leading-none">
          {children}
        </h1>
        {nota && <p className="mt-2 text-[14px] text-adm-suave">{nota}</p>}
      </div>
      {accao && (
        <Link href={accao.href} className="adm-botao no-underline">
          {accao.rotulo}
        </Link>
      )}
    </header>
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
        tom === "bom" && "border-l-[#4C7A4C] bg-[rgba(76,122,76,0.08)]",
        tom === "erro" && "border-l-[#9B3226] bg-[rgba(155,50,38,0.08)]",
        tom === "nota" && "border-l-ouro bg-[rgba(180,136,74,0.1)]",
      )}
    >
      {children}
    </p>
  );
}

/** Etiqueta de estado de um registo. */
export function Estado({ valor }: { valor: string }) {
  const rotulos: Record<string, string> = {
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
  };

  const forte = ["publicado", "disponivel", "activo"].includes(valor);
  const alerta = ["rascunho", "novo", "pendente"].includes(valor);

  return (
    <span
      className={cx(
        "inline-block border px-2 py-1 text-[10px] tracking-[0.16em] uppercase",
        forte && "border-[#4C7A4C] text-[#3D633D]",
        alerta && "border-ouro text-[#8A6636]",
        !forte && !alerta && "border-adm-fio-forte text-adm-suave",
      )}
    >
      {rotulos[valor] ?? valor}
    </span>
  );
}

/** Tabela simples com cabeçalho fixo de estilo. */
export function Tabela({
  colunas,
  children,
}: {
  colunas: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto border border-adm-fio bg-adm-cartao">
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr>
            {colunas.map((c) => (
              <th
                key={c}
                scope="col"
                className="border-b border-adm-fio px-4 py-3 text-left text-[10px] tracking-[0.2em] text-adm-suave uppercase"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Celula({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cx("border-b border-adm-fio px-4 py-3 align-middle", className)}>
      {children}
    </td>
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
