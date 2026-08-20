"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";

const SECCOES = [
  { href: "/admin", rotulo: "Painel", exacto: true },
  { href: "/admin/obras", rotulo: "Obras" },
  { href: "/admin/artistas", rotulo: "Artistas" },
  { href: "/admin/exposicoes", rotulo: "Exposições" },
  { href: "/admin/lugares", rotulo: "Lugares" },
  { href: "/admin/percurso", rotulo: "Percurso da adega" },
  { href: "/admin/textos", rotulo: "Textos do site" },
  { href: "/admin/descarregaveis", rotulo: "Descarregáveis" },
  { href: "/admin/media", rotulo: "Media" },
  { href: "/admin/pedidos", rotulo: "Pedidos" },
  { href: "/admin/definicoes", rotulo: "Definições" },
];

export function NavAdmin({ papel }: { papel: "administrador" | "editor" }) {
  const pathname = usePathname() ?? "";

  const lista =
    papel === "administrador"
      ? [...SECCOES, { href: "/admin/utilizadores", rotulo: "Utilizadores" }]
      : SECCOES;

  return (
    <nav aria-label="Secções do backoffice">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col lg:gap-0">
        {lista.map((s) => {
          const activo = s.exacto
            ? pathname === s.href
            : pathname.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={activo ? "page" : undefined}
                className={cx(
                  "block py-2 text-[15px] no-underline lg:border-b lg:border-adm-fio",
                  activo ? "font-medium text-tinta" : "text-adm-suave",
                )}
              >
                {s.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
