"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

/**
 * A barra do backoffice: lateral em ecrã largo, de topo no telemóvel.
 *
 * Abaixo de `lg`, a barra lateral empilhava-se inteira por cima do
 * conteúdo, com as doze secções e a sessão: em cada página era preciso
 * descer um ecrã para chegar ao que lá estava. No telemóvel fica só o
 * logótipo, o nome da secção e um botão que abre o resto por cima.
 */
export function BarraAdmin({
  seccaoActual,
  children,
}: {
  /** O nome da secção onde se está, para a barra fechada dizer onde. */
  seccaoActual: Record<string, string>;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname() ?? "";

  // Mudar de página fecha o menu: o layout não desmonta ao navegar.
  const [paginaDoMenu, setPaginaDoMenu] = useState(pathname);
  if (pathname !== paginaDoMenu) {
    setPaginaDoMenu(pathname);
    setAberto(false);
  }

  // Passar a ecrã largo com o menu aberto deixava o scroll travado.
  useEffect(() => {
    const largo = window.matchMedia("(min-width: 1024px)");
    const aoMudar = () => {
      if (largo.matches) setAberto(false);
    };
    largo.addEventListener("change", aoMudar);
    return () => largo.removeEventListener("change", aoMudar);
  }, []);

  // No mesmo commit em que o menu abre ou fecha, como no cabeçalho do
  // site: com um `useEffect`, uma navegação podia pintar a página nova
  // ainda com o scroll travado.
  useLayoutEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  const botao = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAberto(false);
      botao.current?.focus();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const seccao =
    Object.entries(seccaoActual)
      .sort(([a], [b]) => b.length - a.length)
      .find(([href]) => (href === "/admin" ? pathname === href : pathname.startsWith(href)))?.[1] ??
    "";

  return (
    <aside
      className={cx(
        // Em ecrã largo a barra tem a altura do ecrã, e as doze secções
        // mais a sessão não cabem num de 800px: faz scroll por dentro em
        // vez de cortar a sessão ou de espremer o logótipo.
        "sticky top-0 z-40 flex flex-none flex-col bg-tinta text-papel lg:h-dvh lg:w-[246px] lg:gap-7 lg:overflow-y-auto lg:px-[18px] lg:py-6",
        aberto && "h-dvh overflow-y-auto",
      )}
    >
      <div className="flex min-h-14 flex-none items-center justify-between gap-4 px-5 lg:min-h-0 lg:px-1.5">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href="/admin"
            className="titulo text-[13px] tracking-[0.2em] text-papel no-underline hover:text-ouro"
            style={{ lineHeight: 1.2 }}
          >
            CONTAGIARTE®
          </Link>
          <span className="hidden text-[11px] tracking-[0.16em] text-[rgba(242,237,228,0.55)] lg:block">
            GESTÃO DE CONTEÚDO
          </span>
          {/* Fechado, no telemóvel, é a única pista de onde se está. */}
          {!aberto && seccao && (
            <span className="truncate text-[12px] tracking-[0.1em] text-[rgba(242,237,228,0.62)] lg:hidden">
              {seccao}
            </span>
          )}
        </div>
        <button
          ref={botao}
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls="menu-admin"
          className="-mr-2 min-h-11 cursor-pointer border-0 bg-transparent px-2 text-[12px] tracking-[0.16em] text-papel uppercase lg:hidden"
        >
          {aberto ? "Fechar" : "Menu"}
        </button>
      </div>

      <div
        id="menu-admin"
        className={cx(
          "flex-1 flex-col gap-7 px-5 pb-6 lg:flex lg:px-0 lg:pb-0",
          aberto ? "flex" : "hidden",
        )}
      >
        {children}
      </div>
    </aside>
  );
}
