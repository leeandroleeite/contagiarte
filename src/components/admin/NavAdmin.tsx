"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";

export type ContagensAdmin = Partial<Record<string, number>>;

const SECCOES = [
  { id: "painel", href: "/admin", rotulo: "Painel", exacto: true },
  { id: "obras", href: "/admin/obras", rotulo: "Obras" },
  { id: "artistas", href: "/admin/artistas", rotulo: "Artistas" },
  { id: "exposicoes", href: "/admin/exposicoes", rotulo: "Exposições" },
  { id: "lugares", href: "/admin/lugares", rotulo: "Lugares" },
  { id: "percurso", href: "/admin/percurso", rotulo: "Percurso da adega" },
  { id: "textos", href: "/admin/textos", rotulo: "Textos do site" },
  { id: "descarregaveis", href: "/admin/descarregaveis", rotulo: "Descarregáveis" },
  { id: "media", href: "/admin/media", rotulo: "Media" },
  { id: "pedidos", href: "/admin/pedidos", rotulo: "Pedidos" },
  { id: "definicoes", href: "/admin/definicoes", rotulo: "Definições" },
];

/**
 * Navegação do backoffice, com a contagem de registos ao lado de cada
 * secção, como no desenho. A contagem poupa um clique: vê-se logo onde
 * há trabalho por fazer.
 */
export function NavAdmin({
  papel,
  contagens,
}: {
  papel: "administrador" | "editor";
  contagens: ContagensAdmin;
}) {
  const pathname = usePathname() ?? "";

  const lista =
    papel === "administrador"
      ? [
          ...SECCOES,
          {
            id: "utilizadores",
            href: "/admin/utilizadores",
            rotulo: "Utilizadores",
          },
        ]
      : SECCOES;

  return (
    <nav aria-label="Secções do backoffice">
      <ul className="flex flex-col gap-0.5">
        {lista.map((s) => {
          const activo = s.exacto
            ? pathname === s.href
            : pathname.startsWith(s.href);
          const n = contagens[s.id];

          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={activo ? "page" : undefined}
                className={cx(
                  "flex min-h-11 w-full items-center justify-between gap-2.5 px-3 py-3 text-[15px] no-underline transition-colors",
                  activo
                    ? "bg-[rgba(242,237,228,0.12)] text-papel"
                    : "text-[rgba(242,237,228,0.62)] hover:text-papel",
                )}
              >
                <span>{s.rotulo}</span>
                {n !== undefined && (
                  <span
                    className={cx(
                      "text-[12px]",
                      activo ? "text-ouro" : "text-[rgba(242,237,228,0.55)]",
                    )}
                  >
                    {n}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
