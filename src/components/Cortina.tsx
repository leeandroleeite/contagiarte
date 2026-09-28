"use client";

import { useEffect, useRef } from "react";

const CHAVE = "contagiarte-cortina";
const PALAVRA = "CONTAGIARTE";
/** Quanto tempo a palavra fica à vista antes de o pano subir. */
const SUBIDA_MS = 1100;

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
 * Cortina de abertura da página inicial, uma vez por sessão.
 *
 * As letras de CONTAGIARTE chegam uma a uma, e ao fim de 1,1s o pano
 * sobe por máscara, sem esmagar a palavra como fazia o scaleY. Quem
 * não quer esperar não espera: qualquer tecla, clique, toque ou scroll
 * levanta-a logo. Antes, o Tab andava por baixo dela sem se ver.
 *
 * A cortina vem no HTML servido, para estar lá no primeiro pixel. Quem
 * já a viu nesta sessão não a chega a ver pintada: o ScriptInicial põe
 * a marca no `<html>` antes da primeira pintura.
 *
 * IMPORTANTE: nunca tirar este elemento do DOM com `remove()`. É um nó
 * que o React desenhou; se o arrancarmos por baixo dele, a próxima
 * reconciliação rebenta com `removeChild` e leva atrás a árvore toda
 * do lado do cliente. Só se mexe no estilo, que o React não disputa.
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

    const esconder = () => {
      if (elemento.current) elemento.current.style.display = "none";
    };
    // A subida vem no CSS servido, e por isso acontece mesmo sem
    // JavaScript; aqui só se tira o elemento do caminho no fim.
    let fim = window.setTimeout(esconder, SUBIDA_MS + 1200);

    const pressa = () => {
      window.clearTimeout(fim);
      no.style.animation = "cortina var(--duracao-rapida) var(--ease-sair) forwards";
      fim = window.setTimeout(esconder, 400);
      tirarOuvintes();
    };
    const eventos = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    const tirarOuvintes = () =>
      eventos.forEach((e) => window.removeEventListener(e, pressa));
    eventos.forEach((e) =>
      window.addEventListener(e, pressa, { passive: true, once: true }),
    );

    return () => {
      window.clearTimeout(fim);
      tirarOuvintes();
    };
  }, []);

  return (
    <div
      ref={elemento}
      aria-hidden="true"
      data-cortina=""
      className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-tinta"
      style={{
        animation: `cortina var(--duracao-cena) var(--ease-cortina) ${SUBIDA_MS}ms forwards`,
      }}
    >
      <span className="titulo flex text-[clamp(18px,2.4vw,32px)] tracking-[0.5em] text-claro-80">
        {PALAVRA.split("").map((letra, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              animation: `letra var(--duracao-media) var(--ease-chegar) ${120 + i * 45}ms both`,
            }}
          >
            {letra}
          </span>
        ))}
      </span>
    </div>
  );
}
