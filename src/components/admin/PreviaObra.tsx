"use client";

import { useEffect, useRef } from "react";
import {
  FichaObra,
  type ObraFicha,
  type ParteFicha,
} from "@/components/FichaObra";
import { caminho, type Idioma } from "@/lib/i18n/config";
import { cx } from "@/lib/utils";

/**
 * A obra como o visitante a vê, ao lado do formulário. Desenha-a a
 * própria `FichaObra` do site, e não uma imitação: o que aqui se vê é
 * o que lá fica.
 *
 * Os links e botões estão lá, mas não se carregam (`inert`): um clique
 * num "Pedir o preço" a meio da edição saía do backoffice.
 */
export function PreviaObra({
  obra,
  idioma,
  whatsapp,
  email,
  nota,
  marcado,
  publicada,
  className,
}: {
  obra: ObraFicha;
  idioma: Idioma;
  whatsapp: string;
  email: string;
  nota: string;
  marcado: ParteFicha | null;
  /** Se a versão guardada já está no site. */
  publicada: boolean;
  className?: string;
}) {
  const caixa = useRef<HTMLDivElement>(null);

  // Em ecrã largo a pré-visualização tem a altura da janela e faz scroll
  // por dentro. Ao escrever na descrição, que fica lá em baixo, a parte
  // marcada vem até à vista, num salto e sem animação.
  useEffect(() => {
    const c = caixa.current;
    if (!c || !marcado) return;
    // O contorno dourado é a única marca que a ficha põe na parte em
    // edição, e é por ele que se encontra.
    const alvo = c.querySelector<HTMLElement>('[class*="outline-ouro"]');
    if (!alvo) return;
    const fora = c.getBoundingClientRect();
    const dentro = alvo.getBoundingClientRect();
    if (dentro.top < fora.top || dentro.bottom > fora.bottom) {
      c.scrollTop += dentro.top - fora.top - 24;
    }
  }, [marcado, idioma]);

  return (
    <aside
      aria-label="Pré-visualização da página da obra"
      className={cx("flex min-w-0 flex-col gap-3", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[11px] tracking-[0.16em] text-adm-suave uppercase">
        <span>
          {publicada ? "Assim está no site" : "Assim vai ficar no site"} ·{" "}
          {idioma}
        </span>
        <span className="tracking-normal normal-case">
          {caminho(idioma, `/obras/${obra.slug || "…"}`)}
        </span>
      </div>

      <div
        ref={caixa}
        className="previa-site @container border border-adm-fio bg-tinta p-6 text-papel lg:max-h-[calc(100dvh-250px)] lg:overflow-y-auto"
      >
        <div inert>
          <FichaObra
            obra={obra}
            idioma={idioma}
            whatsapp={whatsapp}
            email={email}
            nota={nota}
            marcado={marcado}
            nivelTitulo="p"
            classeTitulo="text-[length:clamp(36px,9cqi,112px)] leading-[0.88]"
          />
        </div>
      </div>

      <p className="text-[13px] text-adm-suave">
        O campo em que está a escrever fica marcado a dourado.
      </p>
    </aside>
  );
}
