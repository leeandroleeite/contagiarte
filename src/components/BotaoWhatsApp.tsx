"use client";

import { usePathname } from "next/navigation";
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
 *
 * Sai também do caminho quando há um formulário no ecrã. Voltava
 * sempre que o scroll parava, que é exactamente o momento em que se
 * toca em "Enviar pedido", e no telemóvel ficava por cima dele: medido,
 * tocar na metade direita do botão de envio abria o WhatsApp.
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
  // Onde a página já tem o seu próprio botão, e melhor, este só
  // atrapalha: em "a obra na sua parede" o CTA da página leva a obra, as
  // medidas e a moldura escolhidas, e este tapava o botão da moldura.
  const caminho = usePathname();
  const escondido = /\/ver-na-parede$/.test(caminho ?? "");

  const [recolhido, setRecolhido] = useState(false);
  const [formularioAVista, setFormularioAVista] = useState(false);
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

  // Um formulário (ou algo marcado com data-sem-whatsapp) no ecrã
  // manda o botão sair. Recomeça a cada página.
  useEffect(() => {
    const aVista = new Set<Element>();
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) =>
        e.isIntersecting ? aVista.add(e.target) : aVista.delete(e.target),
      );
      setFormularioAVista(aVista.size > 0);
    });
    document
      .querySelectorAll("main form, [data-sem-whatsapp]")
      .forEach((n) => observador.observe(n));
    return () => {
      observador.disconnect();
      setFormularioAVista(false);
    };
  }, [caminho]);

  if (escondido) return null;

  const fora = recolhido || formularioAVista;

  return (
    // Numa região com nome, e não solto no `body`: sem isto o botão
    // era o único conteúdo do site fora de uma marca de página, e quem
    // navega por regiões com leitor de ecrã nunca dava com ele.
    <aside aria-label={rotulo}>
      <a
        href={linkWhatsApp(numero, mensagem)}
        // Fora do ecrã, fora do Tab: um link invisível não recebe foco.
        tabIndex={fora ? -1 : undefined}
        aria-hidden={fora || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="botao-whatsapp etiqueta fixed right-4 bottom-4 z-[110] inline-flex min-h-12 items-center bg-ouro px-[22px] py-4 text-tinta transition-[background-color,transform,opacity] duration-300 hover:bg-papel"
        style={{
          boxShadow: "0 14px 44px rgba(0,0,0,0.5)",
          transform: fora ? "translateY(calc(100% + 1rem))" : "none",
          opacity: fora ? 0 : 1,
          pointerEvents: fora ? "none" : "auto",
        }}
      >
        {rotulo}
      </a>
    </aside>
  );
}
