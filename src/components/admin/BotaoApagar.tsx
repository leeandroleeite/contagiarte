"use client";

import { useTransition } from "react";

/**
 * Apagar com confirmação. O `confirm` do navegador chega para o que
 * isto é: uma travagem antes de uma acção sem volta atrás.
 */
export function BotaoApagar({
  accao,
  rotulo = "Apagar",
  pergunta = "Apagar este registo? Não há forma de o recuperar.",
}: {
  accao: () => Promise<void>;
  rotulo?: string;
  pergunta?: string;
}) {
  const [aApagar, iniciar] = useTransition();

  return (
    <button
      type="button"
      disabled={aApagar}
      className="adm-botao adm-botao-perigo"
      onClick={() => {
        if (!window.confirm(pergunta)) return;
        iniciar(async () => {
          await accao();
        });
      }}
    >
      {aApagar ? "A apagar…" : rotulo}
    </button>
  );
}
