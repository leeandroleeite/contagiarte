"use client";

import { useEffect, useRef } from "react";

const CHAVE = "contagiarte-cortina";

/**
 * Decisão tomada uma única vez por carregamento de página.
 *
 * O React corre os efeitos duas vezes em desenvolvimento, e o efeito
 * marca a cortina como vista. Sem esta memória ao nível do módulo, a
 * segunda passagem lia a marca que a primeira acabara de escrever e
 * escondia a cortina antes de ela chegar a aparecer.
 */
let mostrarNestaPagina: boolean | null = null;

function deveMostrar(): boolean {
  if (mostrarNestaPagina !== null) return mostrarNestaPagina;

  const semMovimento = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let jaViu = false;
  try {
    jaViu = sessionStorage.getItem(CHAVE) === "1";
    sessionStorage.setItem(CHAVE, "1");
  } catch {
    // Sessão sem storage: mostra a cortina, sem memória entre páginas.
  }

  mostrarNestaPagina = !semMovimento && !jaViu;
  return mostrarNestaPagina;
}

/**
 * Cortina de abertura da homepage. Fica parada 0.9s com a palavra
 * CONTAGIARTE a pulsar e sobe em 1.1s, com origem no topo.
 *
 * A cortina vem no HTML servido, para estar lá no primeiro pixel
 * pintado. Depois de subir fica escondida por `display:none`.
 *
 * IMPORTANTE: nunca tirar este elemento do DOM com `remove()`. É um nó
 * que o React desenhou; se o arrancarmos por baixo dele, a próxima
 * reconciliação rebenta com `removeChild` e leva atrás a árvore toda
 * do lado do cliente. Na prática, os links deixam de navegar. Só se
 * mexe no estilo, que o React não disputa.
 */
export function Cortina() {
  const elemento = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const no = elemento.current;
    if (!no) return;

    if (!deveMostrar()) {
      no.style.display = "none";
      return;
    }

    // 0.9s de espera mais 1.1s a subir. Depois sai da frente, mas
    // continua a pertencer ao React.
    const fim = window.setTimeout(() => {
      if (elemento.current) elemento.current.style.display = "none";
    }, 2200);

    return () => window.clearTimeout(fim);
  }, []);

  return (
    <div
      ref={elemento}
      aria-hidden="true"
      data-cortina=""
      className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-tinta"
      style={{
        transformOrigin: "top",
        animation: "cortina 1.1s cubic-bezier(.76,0,.24,1) 0.9s forwards",
      }}
    >
      <span
        className="titulo text-[clamp(18px,2.4vw,32px)] tracking-[0.5em] text-claro-75"
        style={{ animation: "pisca 1.6s ease-in-out infinite" }}
      >
        CONTAGIARTE
      </span>
    </div>
  );
}
