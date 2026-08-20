"use server";

import { redirect } from "next/navigation";
import { entrar } from "@/lib/auth";

export type EstadoEntrada = { erro: string | null };

export async function autenticar(
  _anterior: EstadoEntrada,
  dados: FormData,
): Promise<EstadoEntrada> {
  const email = String(dados.get("email") ?? "");
  const palavraPasse = String(dados.get("palavraPasse") ?? "");
  const destinoBruto = String(dados.get("destino") ?? "/admin");

  // Só aceita destinos internos: um "destino" absoluto seria um vector
  // de redireccionamento para fora do site.
  const destino =
    destinoBruto.startsWith("/") && !destinoBruto.startsWith("//")
      ? destinoBruto
      : "/admin";

  if (!email || !palavraPasse) {
    return { erro: "Preencha o email e a palavra-passe." };
  }

  const resultado = await entrar(email, palavraPasse);
  if (!resultado.ok) return { erro: resultado.erro };

  redirect(destino);
}
