"use client";

import { useEffect, useRef, useState } from "react";
import { Imagem, type MediaLeve } from "@/components/Imagem";

export type Sala = {
  id: string;
  nome: string;
  texto: string;
  notaObras: string;
  fotografia: MediaLeve;
};

/**
 * Percurso pelas salas de uma exposição.
 *
 * O HTML traz sempre as salas em lista, uma a seguir à outra: é o que
 * vê quem não tem JavaScript e quem pediu movimento reduzido. Com as
 * duas condições reunidas, o efeito marca `data-modo="palco"` e o CSS
 * troca para o palco preso ao ecrã, onde as salas se substituem
 * conforme o scroll, como no design.
 */
export function Percurso({ salas }: { salas: Sala[] }) {
  const raiz = useRef<HTMLDivElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const semMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (semMovimento) return;

    // Actualização directa do DOM: é uma capacidade do ambiente, não
    // um estado de que o React precise para renderizar.
    const no = raiz.current;
    no?.setAttribute("data-modo", "palco");

    let raf = 0;
    const medir = () => {
      const el = pista.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const p = Math.min(1, Math.max(0, -r.top / (total || 1)));
        setIndice(
          Math.min(salas.length - 1, Math.floor(p * salas.length)),
        );
      }
      raf = requestAnimationFrame(medir);
    };
    raf = requestAnimationFrame(medir);

    return () => {
      cancelAnimationFrame(raf);
      no?.removeAttribute("data-modo");
    };
  }, [salas.length]);

  const actual = salas[Math.min(indice, salas.length - 1)];
  const numero = (n: number) => String(n).padStart(2, "0");

  return (
    <div ref={raiz} className="percurso">
      {/* Lista: base semântica, e o que vê quem não tem o palco. */}
      <div className="percurso-lista gap-20 px-7 pb-28">
        {salas.map((s, i) => (
          <article key={s.id} className="flex flex-col gap-6">
            <span className="text-[11px] tracking-[0.3em] text-[rgba(242,237,228,0.6)] uppercase">
              {numero(i + 1)} / {numero(salas.length)}
            </span>
            <h2 className="titulo text-[clamp(34px,5.5vw,86px)] leading-[0.88] uppercase">
              {s.nome}
            </h2>
            <Imagem
              media={s.fotografia}
              alt={s.nome}
              proporcao="16/9"
              legenda={s.nome}
              sizes="100vw"
            />
            <p className="max-w-[54ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.82)]">
              {s.texto}
            </p>
            {s.notaObras && (
              <p className="text-[14px] tracking-[0.06em] text-[rgba(242,237,228,0.55)]">
                {s.notaObras}
              </p>
            )}
          </article>
        ))}
      </div>

      {/* Palco: só aparece com JavaScript e sem movimento reduzido. */}
      <div
        ref={pista}
        aria-hidden="true"
        className="percurso-palco relative"
        style={{ height: `${salas.length * 105}vh` }}
      >
        <div className="sticky top-0 h-dvh overflow-hidden">
          <div className="absolute inset-0">
            {salas.map((s, i) => (
              <div
                key={s.id}
                className="absolute inset-0"
                style={{
                  opacity: i === indice ? 1 : 0,
                  transform: `scale(${i === indice ? 1 : 1.06})`,
                  transition: "opacity 1s ease, transform 1.6s ease",
                }}
              >
                <Imagem
                  media={s.fotografia}
                  alt=""
                  legenda={s.nome}
                  revelar={false}
                  prioridade={i === 0}
                  sizes="100vw"
                  className="h-full"
                />
              </div>
            ))}

            {/* Degradê da esquerda para a direita: o texto fica legível
                sem escurecer a fotografia toda. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(14,12,11,0.92) 0%, rgba(14,12,11,0.4) 46%, rgba(14,12,11,0.15) 100%)",
              }}
            />
          </div>

          <div className="pointer-events-none relative flex h-full max-w-[44ch] flex-col justify-center gap-[22px] px-7">
            <span className="text-[11px] tracking-[0.3em] text-[rgba(242,237,228,0.6)]">
              {numero(indice + 1)} / {numero(salas.length)}
            </span>
            <h2 className="titulo text-[clamp(34px,5.5vw,86px)] leading-[0.88] uppercase">
              {actual.nome}
            </h2>
            <p className="text-[18px] leading-[1.6] text-[rgba(242,237,228,0.82)]">
              {actual.texto}
            </p>
            {actual.notaObras && (
              <span className="text-[14px] tracking-[0.06em] text-[rgba(242,237,228,0.55)]">
                {actual.notaObras}
              </span>
            )}
          </div>

          <div className="absolute bottom-9 left-7 flex gap-2">
            {salas.map((s, i) => (
              <span
                key={s.id}
                className="block h-[2px]"
                style={{
                  width: i === indice ? 44 : 20,
                  background:
                    i === indice ? "#B4884A" : "rgba(242,237,228,0.3)",
                  transition: "width .4s ease, background .4s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
