"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

  // O cabeçalho vive no layout e não desmonta ao mudar de página. Sem
  // isto, o logótipo ou o Voltar do browser levavam a uma página nova
  // com o menu ainda aberto e o scroll travado.
  const [paginaDoMenu, setPaginaDoMenu] = useState(pathname);
  if (pathname !== paginaDoMenu) {
    setPaginaDoMenu(pathname);
    setAberto(false);
  }

  // Rodar o tablet com o menu aberto escondia-o pelo CSS, mas o scroll
  // continuava travado e não havia botão para o fechar.
  useEffect(() => {
    const largo = window.matchMedia("(min-width: 1120px)");
    const aoMudar = () => {
      if (largo.matches) setAberto(false);
    };
    largo.addEventListener("change", aoMudar);
    return () => largo.removeEventListener("change", aoMudar);
  }, []);

  // Com o menu compacto aberto: o scroll trava, e o resto da página
  // fica inerte. Sem o inert, o Tab saía do menu e ia andar por baixo
  // dele, em links que não se viam.
  useEffect(() => {
    const raiz = document.documentElement;
    const resto = document.querySelectorAll("main, footer, aside");
    document.body.style.overflow = aberto ? "hidden" : "";
    raiz.toggleAttribute("data-menu-aberto", aberto);
    resto.forEach((n) => n.toggleAttribute("inert", aberto));
    return () => {
      document.body.style.overflow = "";
      raiz.removeAttribute("data-menu-aberto");
      resto.forEach((n) => n.removeAttribute("inert"));
    };
  }, [aberto]);

  // O Esc fecha e devolve o foco ao botão que abriu, em vez de o
  // deixar cair no fundo da página.
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

  return (
    <>
      <a
        href="#conteudo"
        className="link-saltar"
      >
        {t("nav.saltar", idioma)}
      </a>

      <header
        /* Fundo semi-opaco e não só desfocado: transparente, o
           conteúdo passava por baixo do cabeçalho meio nítido e meio
           desfocado, e o logótipo colidia com os títulos. Parecia um
           erro de renderização. */
        className={cx(
          "fixed top-0 right-0 left-0 z-[120] flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-margem py-[18px] backdrop-blur-[10px] sm:py-[22px]",
          // Aberto, o menu é uma folha opaca da altura do ecrã: sobre o
          // degradê, as últimas entradas liam-se por cima de fotografias.
          aberto && "h-dvh content-start bg-tinta menu:h-auto",
        )}
        style={
          aberto
            ? undefined
            : {
                background:
                  "linear-gradient(to bottom, rgba(14,12,11,0.75), rgba(14,12,11,0.35) 60%, transparent)",
              }
        }
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
            ref={botao}
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-compacto"
            className="etiqueta -my-3 min-h-11 cursor-pointer border-0 bg-transparent px-1 py-3 text-papel menu:hidden"
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
            <div className="mb-3 border-b border-fio pb-3 sm:hidden">
              <SelectorIdioma idioma={idioma} caminhoActual={actual} />
            </div>
            <ul className="flex max-h-[calc(100dvh-160px)] flex-col gap-1 overflow-y-auto">
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
  const router = useRouter();
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
          // Os filtros não têm idioma (o artista e o estado são os
          // mesmos em PT, EN e ES): mudar de língua mantém-nos.
          onClick={(e) => {
            const busca = window.location.search;
            if (!busca || e.metaKey || e.ctrlKey || e.shiftKey) return;
            e.preventDefault();
            router.push(caminho(id, caminhoActual) + busca);
          }}
          className={cx(
            "flex min-h-11 items-center px-2 uppercase transition-colors",
            id === idioma
              ? "text-ouro"
              : "text-claro-55 hover:text-papel",
          )}
        >
          {id}
        </Link>
      ))}
    </div>
  );
}
