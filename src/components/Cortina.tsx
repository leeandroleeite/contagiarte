"use client";

import { useEffect, useRef } from "react";

const CHAVE = "contagiarte-cortina";

/**
 * Cortina de abertura da homepage. Sobe 0.9s depois de a página
 * aparecer e só corre uma vez por sessão: quem volta ao início a meio
 * da visita não leva com a animação outra vez.
 *
 * A cortina é sempre desenhada no HTML, e o efeito limita-se a
 * removê-la quando não deve aparecer. Assim não há estado de React a
 * decidir o que renderizar, nem um piscar entre servidor e cliente.
 */
export function Cortina() {
  const elemento = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    if (semMovimento || jaViu) {
      elemento.current?.remove();
      return;
    }

    // Depois de subir não faz falta nenhuma; sai do DOM.
    const fim = window.setTimeout(() => elemento.current?.remove(), 2400);
    return () => window.clearTimeout(fim);
  }, []);

  return (
    <div
      ref={elemento}
      aria-hidden="true"
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
