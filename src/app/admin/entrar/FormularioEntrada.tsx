"use client";

import { useActionState } from "react";
import { autenticar, type EstadoEntrada } from "./accoes";

export function FormularioEntrada({ destino }: { destino?: string }) {
  const [estado, accao, aEnviar] = useActionState<EstadoEntrada, FormData>(
    autenticar,
    { erro: null },
  );

  return (
    <form action={accao} className="flex flex-col gap-4">
      <input type="hidden" name="destino" value={destino ?? "/admin"} />

      <div>
        <label htmlFor="email" className="adm-rotulo">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="palavraPasse" className="adm-rotulo">
          Palavra-passe
        </label>
        <input
          id="palavraPasse"
          name="palavraPasse"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      {estado.erro && (
        <p role="alert" className="text-[14px] text-[#9B3226]">
          {estado.erro}
        </p>
      )}

      <button type="submit" className="adm-botao mt-2" disabled={aEnviar}>
        {aEnviar ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}
