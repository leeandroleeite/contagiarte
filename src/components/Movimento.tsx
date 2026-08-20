"use client";

import { useEffect } from "react";

/**
 * Toda a camada de movimento do site num só sítio: cursor, barra de
 * progresso, paralaxe, entradas em scroll e revelação das imagens.
 *
 * O design original corria isto num único `requestAnimationFrame`, e
 * mantém-se assim: um loop só, em vez de um observador por secção.
 *
 * Regras herdadas do handoff:
 *  - `prefers-reduced-motion` desliga tudo e mostra o conteúdo já visível;
 *  - o cursor só existe em ponteiros finos com hover;
 *  - há uma rede de segurança de 5s que revela tudo, para o conteúdo
 *    nunca ficar invisível se um observador falhar.
 */
export function Movimento({ cursor = true }: { cursor?: boolean }) {
  useEffect(() => {
    const semMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const revelaveis = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-surge],[data-revelar]"),
      );

    if (semMovimento) {
      revelaveis().forEach((n) => {
        if (n.hasAttribute("data-surge")) n.setAttribute("data-surge", "visivel");
        if (n.hasAttribute("data-revelar"))
          n.setAttribute("data-revelar", "visivel");
      });
      return;
    }

    // --- Entradas em scroll -------------------------------------------
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          const alvo = e.target as HTMLElement;
          if (alvo.hasAttribute("data-surge"))
            alvo.setAttribute("data-surge", "visivel");
          if (alvo.hasAttribute("data-revelar"))
            alvo.setAttribute("data-revelar", "visivel");
          observador.unobserve(alvo);
        });
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    revelaveis().forEach((n) => observador.observe(n));

    // Rede de segurança: ao fim de 5s nada fica escondido.
    const seguranca = window.setTimeout(() => {
      revelaveis().forEach((n) => {
        if (n.hasAttribute("data-surge")) n.setAttribute("data-surge", "visivel");
        if (n.hasAttribute("data-revelar"))
          n.setAttribute("data-revelar", "visivel");
      });
    }, 5000);

    // --- Cursor --------------------------------------------------------
    const ratoFino = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const ponto = cursor && ratoFino ? criarPonto() : null;

    let px = window.innerWidth / 2;
    let py = window.innerHeight / 2;
    let cx = px;
    let cy = py;

    const aoMover = (e: MouseEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!ponto) return;
      const alvo =
        e.target instanceof Element ? e.target.closest("a,button") : null;
      const tamanho = alvo ? 54 : 14;
      ponto.style.width = `${tamanho}px`;
      ponto.style.height = `${tamanho}px`;
      ponto.style.margin = `${-tamanho / 2}px 0 0 ${-tamanho / 2}px`;
    };
    if (ponto) window.addEventListener("mousemove", aoMover, { passive: true });

    // --- Loop de animação ---------------------------------------------
    const barra = document.getElementById("barra-progresso");
    const paralaxes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-paralaxe]"),
    );

    let raf = 0;
    const laco = () => {
      if (ponto) {
        cx += (px - cx) * 0.16;
        cy += (py - cy) * 0.16;
        ponto.style.transform = `translate(${cx}px,${cy}px)`;
      }

      const y = window.scrollY || 0;

      if (barra) {
        const total = document.body.scrollHeight - window.innerHeight;
        barra.style.width = `${total > 0 ? Math.min(100, (y / total) * 100) : 0}%`;
      }

      for (const el of paralaxes) {
        const modo = el.dataset.paralaxe;
        if (modo === "scroll") {
          // Herói: desliza com a página, sempre para baixo.
          const factor = Number(el.dataset.factor ?? "0.22");
          el.style.transform = `translateY(${y * factor}px)`;
        } else {
          // Restantes: deslocam-se conforme a distância ao centro do ecrã.
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
          const amplitude = Number(el.dataset.factor ?? "-38");
          const d =
            (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
          el.style.transform = `translateY(${d * amplitude}px)`;
        }
      }

      raf = requestAnimationFrame(laco);
    };
    raf = requestAnimationFrame(laco);

    return () => {
      observador.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(seguranca);
      window.removeEventListener("mousemove", aoMover);
      ponto?.remove();
    };
  }, [cursor]);

  return null;
}

function criarPonto(): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed",
    top: "0",
    left: "0",
    zIndex: "150",
    width: "14px",
    height: "14px",
    margin: "-7px 0 0 -7px",
    background: "#B4884A",
    borderRadius: "50%",
    pointerEvents: "none",
    mixBlendMode: "difference",
    transition: "width .25s, height .25s, margin .25s",
    willChange: "transform",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(el);
  return el;
}
