"use client";

import { useEffect } from "react";
import { Botao } from "@/components/Botao";

/**
 * Quando uma página rebenta a sério.
 *
 * Sem isto, o Next mostrava o seu ecrã de erro cru: fundo branco, uma
 * frase em inglês sobre uma excepção do servidor, e nenhuma saída. Um
 * visitante que apanhe uma falha da base de dados merece a mesma
 * cortesia que o 404 já lhe dava, e a galeria merece que o erro não
 * pareça um site abandonado.
 *
 * É cliente por obrigação do Next, e por isso não lê a base nem sabe o
 * idioma: os três textos vêm escritos à mão. Uma página de erro que
 * depende da base é uma página de erro que também falha.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // O `digest` é o que liga este ecrã à linha certa nos registos do
    // servidor. Sem ele, um relato de "deu erro" não se investiga.
    console.error("Erro na página:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[80dvh] flex-col justify-center gap-8 px-7 pt-[140px] pb-16">
      <span className="text-[11px] tracking-[0.2em] text-[rgba(242,237,228,0.55)] uppercase">
        Erro
      </span>

      <h1 className="titulo max-w-[16ch] text-[clamp(40px,9vw,150px)] leading-[0.84]">
        ALGO CORREU MAL
      </h1>

      <p className="max-w-[46ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.75)]">
        Esta página não conseguiu carregar. Tente outra vez; se voltar a
        acontecer, fale connosco e resolvemos.
        <br />
        This page failed to load. Please try again.
      </p>

      <div className="flex flex-wrap gap-3.5">
        <Botao aoClicar={reset}>Tentar outra vez</Botao>
        <Botao variante="linha" href="/">
          Voltar ao início
        </Botao>
      </div>

      {error.digest && (
        <p className="text-[12px] tracking-[0.1em] text-[rgba(242,237,228,0.4)]">
          Referência {error.digest}
        </p>
      )}
    </div>
  );
}
