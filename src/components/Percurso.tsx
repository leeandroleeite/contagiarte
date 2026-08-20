"use client";

import { useEffect, useRef, useState } from "react";
import { Imagem, type MediaLeve } from "@/components/Imagem";

export type Sala = {
  id: string;
  nome: string;
  texto: string;
  fotografia: MediaLeve;
  obras: string[];
};

/**
 * Percurso pelas salas de uma exposição.
 *
 * O HTML traz sempre as salas em lista, uma a seguir à outra: é o que
 * vê quem não tem JavaScript e quem pediu movimento reduzido. Com as
 * duas condições reunidas, o efeito marca `data-modo="palco"` e o CSS
 * troca para o palco preso ao ecrã, onde as salas se substituem
 * conforme o scroll.
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
        const total = r.height - window.innerHeight;
        const p =
          total > 0 ? Math.min(0.999, Math.max(0, -r.top / total)) : 0;
        setIndice(Math.floor(p * salas.length));
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

  return (
    <div ref={raiz} className="percurso">
      {/* Lista: base semântica, e o que vê quem não tem o palco. */}
      <div className="percurso-lista flex flex-col gap-20 px-7 pb-28">
        {salas.map((s, i) => (
          <article key={s.id} className="flex flex-col gap-6">
            <span className="etiqueta">
              {String(i + 1).padStart(2, "0")} /{" "}
              {String(salas.length).padStart(2, "0")}
            </span>
            <h2 className="titulo d-2">{s.nome}</h2>
            <Imagem
              media={s.fotografia}
              alt={s.nome}
              proporcao="16/9"
              legenda={s.nome}
              sizes="100vw"
            />
            <p className="max-w-[54ch] text-[18px] leading-[1.65] text-[rgba(242,237,228,0.8)]">
              {s.texto}
            </p>
            {s.obras.length > 0 && (
              <p className="text-[14px] text-claro-55">{s.obras.join(" · ")}</p>
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
          {salas.map((s, i) => (
            <div
              key={s.id}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === indice ? 1 : 0 }}
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

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(14,12,11,0.55), rgba(14,12,11,0.1) 40%, rgba(14,12,11,0.95))",
            }}
          />

          <div className="absolute inset-x-7 bottom-16 flex flex-col gap-5">
            <span className="etiqueta">
              {String(indice + 1).padStart(2, "0")} /{" "}
              {String(salas.length).padStart(2, "0")}
            </span>
            <h2 className="titulo d-1">{actual.nome}</h2>
            <p className="max-w-[52ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.85)]">
              {actual.texto}
            </p>
            {actual.obras.length > 0 && (
              <p className="text-[14px] text-claro-55">
                {actual.obras.join(" · ")}
              </p>
            )}

            <div className="mt-2 flex gap-2">
              {salas.map((s, i) => (
                <span
                  key={s.id}
                  className="h-[2px] flex-1 transition-colors"
                  style={{
                    background: i <= indice ? "#B4884A" : "rgba(242,237,228,0.2)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
