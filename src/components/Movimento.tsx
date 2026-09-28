"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    /** Posto pelo Movimento; o script inicial espera por ele. */
    __movimento?: boolean;
  }
}

/**
 * Toda a camada de movimento do site num só sítio: entradas em scroll,
 * revelação das imagens, cursor, barra de progresso, paralaxe e faixa.
 *
 * Regras:
 *  - `prefers-reduced-motion` desliga tudo e mostra o conteúdo já visível;
 *  - o cursor só existe em ponteiros finos com hover;
 *  - cada lote de elementos a revelar tem uma rede de segurança de 5s;
 *  - um loop só, e que dorme: só corre enquanto há scroll, rato ou uma
 *    animação por assentar. Antes corria 120 vezes por segundo com a
 *    página parada, também no telemóvel.
 */
export function Movimento({ cursor = true }: { cursor?: boolean }) {
  useEffect(() => {
    window.__movimento = true;
    document.documentElement.classList.add("js");

    const semMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const SELECTOR = "[data-surge],[data-revelar]";
    const revelar = (n: Element) => {
      if (n.hasAttribute("data-surge")) n.setAttribute("data-surge", "visivel");
      if (n.hasAttribute("data-revelar"))
        n.setAttribute("data-revelar", "visivel");
    };
    const porRevelar = (raiz: ParentNode): Element[] =>
      Array.from(raiz.querySelectorAll(SELECTOR)).filter(
        (n) =>
          n.getAttribute("data-surge") !== "visivel" &&
          n.getAttribute("data-revelar") !== "visivel",
      );

    if (semMovimento) {
      porRevelar(document).forEach(revelar);
      // Também o que entra depois, numa página nova ou ao filtrar.
      const vigia = new MutationObserver(() =>
        porRevelar(document).forEach(revelar),
      );
      vigia.observe(document.body, { childList: true, subtree: true });
      return () => vigia.disconnect();
    }

    // --- Entradas em scroll -------------------------------------------
    // O que entra no ecrã no mesmo momento recebe um índice, e o CSS
    // atrasa cada um 60ms: uma grelha pendura-se peça a peça.
    const observador = new IntersectionObserver(
      (entradas) => {
        const visiveis = entradas
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top ||
              a.boundingClientRect.left - b.boundingClientRect.left,
          );
        visiveis.forEach((e, i) => {
          (e.target as HTMLElement).style.setProperty("--i", String(Math.min(i, 6)));
          revelar(e.target);
          observador.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    const redes = new Set<number>();
    const vistos = new WeakSet<Element>();
    const novos = () => {
      const lote = porRevelar(document).filter((n) => !vistos.has(n));
      if (lote.length === 0) return;
      lote.forEach((n) => {
        vistos.add(n);
        observador.observe(n);
      });
      const rede = window.setTimeout(() => {
        lote.forEach(revelar);
        redes.delete(rede);
      }, 5000);
      redes.add(rede);
    };
    novos();

    // O layout não volta a montar ao navegar, e os filtros trocam a
    // lista sem mudar de página: o que entra no DOM depois também tem
    // de ser observado, senão fica escondido para sempre.
    const recolher = () => ({
      paralaxes: Array.from(
        document.querySelectorAll<HTMLElement>("[data-paralaxe]"),
      ),
      faixas: Array.from(document.querySelectorAll<HTMLElement>("[data-faixa]")),
    });
    let { paralaxes, faixas } = recolher();
    const vigia = new MutationObserver(() => {
      novos();
      ({ paralaxes, faixas } = recolher());
      acordar();
    });
    vigia.observe(document.body, { childList: true, subtree: true });

    // --- Cursor --------------------------------------------------------
    const ratoFino = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const ponto = cursor && ratoFino ? criarCursor() : null;
    const rotulo = ponto?.querySelector<HTMLElement>(".cursor-rotulo") ?? null;

    let px = -100;
    let py = -100;
    let cx = px;
    let cy = py;

    const aoMover = (e: MouseEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (ponto) {
        const alvo = e.target instanceof Element ? e.target : null;
        const comRotulo = alvo?.closest<HTMLElement>("[data-cursor-rotulo]");
        const link = alvo?.closest("a,button,[role=button],label,select");
        const estado = comRotulo ? "rotulo" : link ? "link" : "";
        if (ponto.dataset.estado !== estado) ponto.dataset.estado = estado;
        const texto = comRotulo?.dataset.cursorRotulo ?? "";
        if (comRotulo && rotulo && rotulo.textContent !== texto) {
          rotulo.textContent = texto;
        }
      }
      acordar();
    };
    const aoSair = () => {
      px = -100;
      py = -100;
      acordar();
    };
    if (ponto) {
      window.addEventListener("mousemove", aoMover, { passive: true });
      document.documentElement.addEventListener("mouseleave", aoSair);
    }

    // --- Loop de animação ---------------------------------------------
    const barra = document.getElementById("barra-progresso");
    let yAnterior = window.scrollY;
    let velocidade = 0;
    let raf = 0;

    const laco = () => {
      raf = 0;
      let continuar = false;

      if (ponto) {
        cx += (px - cx) * 0.18;
        cy += (py - cy) * 0.18;
        ponto.style.transform = `translate3d(${cx}px,${cy}px,0)`;
        if (Math.abs(px - cx) > 0.3 || Math.abs(py - cy) > 0.3) continuar = true;
      }

      const y = window.scrollY || 0;
      // Velocidade do scroll, amortecida: é ela que empurra a faixa.
      velocidade += (y - yAnterior - velocidade) * 0.2;
      yAnterior = y;
      if (Math.abs(velocidade) > 0.05) continuar = true;

      if (barra) {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        barra.style.transform = `scaleX(${total > 0 ? Math.min(1, y / total) : 0})`;
      }

      for (const el of paralaxes) {
        const r = el.getBoundingClientRect();
        if (el.dataset.paralaxe === "scroll") {
          // Herói: desliza com a página enquanto está à vista.
          if (r.bottom < -400) continue;
          const factor = Number(el.dataset.factor ?? "0.22");
          el.style.transform = `translate3d(0,${y * factor}px,0)`;
        } else {
          // Restantes: deslocam-se conforme a distância ao centro do ecrã.
          if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
          const amplitude = Number(el.dataset.factor ?? "-38");
          const d =
            (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
          el.style.transform = `translate3d(0,${d * amplitude}px,0)`;
        }
      }

      // A faixa corre ao ritmo de quem lê: acelera com o scroll, vira
      // de sentido quando se sobe, e volta devagar à velocidade de
      // cruzeiro quando a página pára.
      for (const el of faixas) {
        const animacao = el.getAnimations()[0];
        if (!animacao) continue;
        const alvo = 1 + Math.max(-7, Math.min(7, velocidade * 0.35));
        const actual = animacao.playbackRate;
        const nova = actual + (alvo - actual) * 0.12;
        animacao.playbackRate = Math.abs(nova - 1) < 0.01 ? 1 : nova;
        if (animacao.playbackRate !== 1) continuar = true;
      }

      if (continuar) acordar();
    };

    function acordar() {
      if (!raf) raf = requestAnimationFrame(laco);
    }

    window.addEventListener("scroll", acordar, { passive: true });
    window.addEventListener("resize", acordar, { passive: true });
    acordar();

    return () => {
      observador.disconnect();
      vigia.disconnect();
      if (raf) cancelAnimationFrame(raf);
      redes.forEach((r) => window.clearTimeout(r));
      window.removeEventListener("mousemove", aoMover);
      window.removeEventListener("scroll", acordar);
      window.removeEventListener("resize", acordar);
      document.documentElement.removeEventListener("mouseleave", aoSair);
      ponto?.remove();
    };
  }, [cursor]);

  return null;
}

function criarCursor(): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.className = "cursor";
  el.innerHTML =
    '<div class="cursor-corpo"><span class="cursor-rotulo"></span></div>';
  document.body.appendChild(el);
  return el;
}
