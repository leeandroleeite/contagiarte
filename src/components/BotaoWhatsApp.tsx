"use client";

import { useEffect, useRef, useState } from "react";
import { linkWhatsApp } from "@/lib/utils";

/**
 * Botão flutuante permanente. É o canal preferido da galeria.
 *
 * Recolhe enquanto se desce e volta quando se pára ou se sobe. Fixo e
 * sempre visível, tapava conteúdo: na simulação de moldura ficava por
 * cima do botão de alumínio, que é uma opção que ninguém conseguia
 * escolher, e na ficha de obra em telemóvel escondia a linha do ano.
 *
 * Quem pede menos movimento não perde o botão: fica quieto e visível.
 */
export function BotaoWhatsApp({
  numero,
  rotulo,
  mensagem,
}: {
  numero: string;
  rotulo: string;
  mensagem: string;
}) {
  const [recolhido, setRecolhido] = useState(false);
  const ultimo = useRef(0);
  const parado = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const semMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (semMovimento) return;

    ultimo.current = window.scrollY;

    const aoRolar = () => {
      const agora = window.scrollY;
      const desceu = agora > ultimo.current;
      // A margem evita que o botão pisque com o balanço do scroll.
      if (Math.abs(agora - ultimo.current) > 6) {
        setRecolhido(desceu && agora > 240);
        ultimo.current = agora;
      }
      if (parado.current) clearTimeout(parado.current);
      parado.current = setTimeout(() => setRecolhido(false), 700);
    };

    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      if (parado.current) clearTimeout(parado.current);
    };
  }, []);

  return (
    <a
      href={linkWhatsApp(numero, mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 z-[110] inline-flex min-h-12 items-center bg-ouro px-[22px] py-4 text-[12px] tracking-[0.16em] text-tinta uppercase transition-[background-color,transform,opacity] duration-300 hover:bg-papel"
      style={{
        boxShadow: "0 14px 44px rgba(0,0,0,0.5)",
        transform: recolhido ? "translateY(calc(100% + 1rem))" : "none",
        opacity: recolhido ? 0 : 1,
        pointerEvents: recolhido ? "none" : "auto",
      }}
    >
      {rotulo}
    </a>
  );
}
