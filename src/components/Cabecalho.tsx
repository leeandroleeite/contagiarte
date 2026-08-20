"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { caminho, IDIOMAS, semPrefixo, type Idioma } from "@/lib/i18n/config";
import { t } from "@/lib/i18n";
import { cx } from "@/lib/utils";

const LIGACOES = [
  { chave: "nav.exposicoes", href: "/exposicoes" },
  { chave: "nav.obras", href: "/obras" },
  { chave: "nav.artistas", href: "/artistas" },
  { chave: "nav.arquivo", href: "/arquivo" },
  { chave: "nav.molduras", href: "/molduras" },
  { chave: "nav.descarregar", href: "/descarregar" },
  { chave: "nav.contactos", href: "/contactos" },
] as const;

const EXTRA = [
  { chave: "nav.parede", href: "/ver-na-parede" },
  { chave: "nav.ativo", href: "/a-obra-como-ativo" },
  { chave: "nav.lugares", href: "/lugares" },
  { chave: "nav.galeria", href: "/a-galeria" },
] as const;

export function Cabecalho({ idioma }: { idioma: Idioma }) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const actual = semPrefixo(pathname ?? "/");

  // Trava o scroll da página enquanto o menu compacto está aberto.
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  return (
    <>
      <a
        href="#conteudo"
        className="link-saltar"
      >
        {t("nav.saltar", idioma)}
      </a>

      <header
        className="fixed top-0 right-0 left-0 z-[120] flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-[18px] backdrop-blur-[6px] sm:px-7 sm:py-[22px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(14,12,11,0.75), rgba(14,12,11,0.35) 60%, transparent)",
        }}
      >
        <Link
          href={caminho(idioma, "/")}
          className="titulo -my-3 flex min-h-11 items-center py-3 text-[12px] tracking-[0.16em] text-papel sm:text-[14px] sm:tracking-[0.2em]"
          style={{ lineHeight: 1 }}
        >
          CONTAGIARTE®
        </Link>

        <nav
          aria-label={t("nav.principal", idioma)}
          className="hidden items-center gap-[26px] text-[11px] tracking-[0.18em] whitespace-nowrap uppercase menu:flex"
        >
          {LIGACOES.map((l) => {
            const activo = actual === l.href || actual.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={caminho(idioma, l.href)}
                aria-current={activo ? "page" : undefined}
                className={cx(
                  "-my-3 flex min-h-11 items-center py-3 transition-colors hover:text-ouro",
                  activo ? "text-ouro" : "text-papel",
                )}
              >
                {t(l.chave, idioma)}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Abaixo de 640px não cabe: os idiomas passam para dentro
              do menu, que é onde há espaço para eles. */}
          <div className="hidden sm:block">
            <SelectorIdioma idioma={idioma} caminhoActual={actual} />
          </div>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-compacto"
            className="-my-3 min-h-11 cursor-pointer border-0 bg-transparent px-1 py-3 text-[11px] tracking-[0.2em] text-papel uppercase menu:hidden"
          >
            {aberto ? t("nav.fechar", idioma) : t("nav.abrir", idioma)}
          </button>
        </div>

        {aberto && (
          <nav
            id="menu-compacto"
            aria-label={t("nav.principal", idioma)}
            className="basis-full pt-4 text-[15px] tracking-[0.14em] uppercase menu:hidden"
          >
            <div className="mb-3 border-b border-[rgba(242,237,228,0.16)] pb-3 sm:hidden">
              <SelectorIdioma idioma={idioma} caminhoActual={actual} />
            </div>
            <ul className="flex max-h-[70dvh] flex-col gap-1 overflow-y-auto">
              {[...LIGACOES, ...EXTRA].map((l) => (
                <li key={l.href}>
                  <Link
                    href={caminho(idioma, l.href)}
                    onClick={() => setAberto(false)}
                    className="block py-2 text-papel hover:text-ouro"
                  >
                    {t(l.chave, idioma)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}

function SelectorIdioma({
  idioma,
  caminhoActual,
}: {
  idioma: Idioma;
  caminhoActual: string;
}) {
  return (
    <div
      className="flex items-center gap-1 text-[11px] tracking-[0.12em] sm:gap-[10px] sm:tracking-[0.16em]"
      role="group"
      aria-label={t("nav.idioma", idioma)}
    >
      {IDIOMAS.map((id) => (
        <Link
          key={id}
          href={caminho(id, caminhoActual)}
          hrefLang={id}
          aria-current={id === idioma ? "true" : undefined}
          className={cx(
            "flex min-h-11 items-center px-2 uppercase transition-colors",
            id === idioma
              ? "text-ouro"
              : "text-[rgba(242,237,228,0.4)] hover:text-papel",
          )}
        >
          {id}
        </Link>
      ))}
    </div>
  );
}
