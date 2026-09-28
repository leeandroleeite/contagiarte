"use client";

import { useEffect, useRef, useState } from "react";
import { FICHAS } from "@/lib/fichas";
import { t, type Idioma } from "@/lib/i18n";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

let consolaDita = false;

/**
 * Três coisas para quem repara. Nenhuma é precisa para usar o site, e
 * nenhuma prende, assusta ou mexe em preços, formulários ou dados.
 *
 * 1. Quem abre a consola do browser encontra um bilhete da galeria.
 * 2. Quem muda de separador vê o título dizer que a obra fica à espera.
 * 3. Quem escreve o código Konami (↑↑↓↓←→←→BA) vê as obras ficarem
 *    tortas nos pregos, e um nível de ouro passar e endireitá-las. É a
 *    obsessão de quem pendura. Com movimento reduzido não há rotação:
 *    só o aviso, lido também por leitores de ecrã.
 */
export function Segredos({ idioma }: { idioma: Idioma }) {
  const [aviso, setAviso] = useState("");
  const aDecorrer = useRef(false);

  // 1. A consola, uma vez por carregamento.
  useEffect(() => {
    if (consolaDita) return;
    consolaDita = true;
    console.log(
      `%cCONTAGIARTE®%c\n\n${t("segredo.consola", idioma)}\n`,
      `font: 800 28px/1 system-ui, sans-serif; letter-spacing: 0.2em; color: ${FICHAS.ouro};`,
      "font: 14px/1.6 system-ui, sans-serif; color: inherit;",
    );
  }, [idioma]);

  // 2. O título do separador quando se sai.
  useEffect(() => {
    let original = "";
    const aoMudar = () => {
      if (document.hidden) {
        original = document.title;
        document.title = t("segredo.separador", idioma);
      } else if (original) {
        document.title = original;
        original = "";
      }
    };
    document.addEventListener("visibilitychange", aoMudar);
    return () => {
      document.removeEventListener("visibilitychange", aoMudar);
      if (original) document.title = original;
    };
  }, [idioma]);

  // 3. Konami.
  useEffect(() => {
    let posicao = 0;
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo?.closest("input, textarea, select, [contenteditable]")) return;
      const tecla = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      posicao = tecla === KONAMI[posicao] ? posicao + 1 : tecla === KONAMI[0] ? 1 : 0;
      if (posicao < KONAMI.length) return;
      posicao = 0;
      if (aDecorrer.current) return;
      aDecorrer.current = true;
      entortar(() => {
        aDecorrer.current = false;
        setAviso(t("segredo.direito", idioma));
      });
      setAviso(t("segredo.torto", idioma));
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [idioma]);

  return (
    <p role="status" aria-live="polite" className="so-leitor">
      {aviso}
    </p>
  );
}

/**
 * Entorta cada obra à vista num ângulo ao acaso, espera, e passa um
 * nível de ouro pelo ecrã que as endireita à medida que passa.
 */
function entortar(fim: () => void) {
  const semMovimento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (semMovimento) {
    window.setTimeout(fim, 1200);
    return;
  }

  const obras = Array.from(
    document.querySelectorAll<HTMLElement>(".obra-moldura, main [data-revelar]"),
  ).filter((el) => {
    // A imagem dentro de uma moldura roda com ela; não roda duas vezes.
    if (el.parentElement?.closest(".obra-moldura")) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  });

  obras.forEach((el, i) => {
    const angulo = (Math.random() * 5 + 1.5) * (Math.random() < 0.5 ? -1 : 1);
    el.animate(
      [{ rotate: "0deg" }, { rotate: `${angulo * 1.4}deg` }, { rotate: `${angulo}deg` }],
      {
        duration: 700,
        delay: i * 40,
        easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
        fill: "forwards",
      },
    );
    el.style.transformOrigin = "50% 0";
  });

  // O nível atravessa o ecrã de cima a baixo; cada obra endireita
  // quando ele lhe chega ao centro.
  const nivel = document.createElement("div");
  nivel.className = "segredo-nivel";
  nivel.setAttribute("aria-hidden", "true");
  document.body.appendChild(nivel);

  const DURACAO = 1600;
  const ESPERA = 1400;
  nivel.animate(
    [{ transform: "translateY(0)" }, { transform: `translateY(${window.innerHeight}px)` }],
    { duration: DURACAO, delay: ESPERA, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "both" },
  ).finished.then(() => {
    nivel.remove();
    obras.forEach((el) => {
      el.getAnimations().forEach((a) => a.cancel());
      el.style.transformOrigin = "";
    });
    fim();
  });

  obras.forEach((el) => {
    const r = el.getBoundingClientRect();
    const quando = ESPERA + DURACAO * Math.min(1, Math.max(0, (r.top + r.height / 2) / window.innerHeight));
    window.setTimeout(() => {
      el.animate([{ rotate: getComputedStyle(el).rotate }, { rotate: "0deg" }], {
        duration: 500,
        easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
        fill: "forwards",
      });
    }, quando);
  });
}
