"use server";

import { redirect } from "next/navigation";
import { entrar } from "@/lib/auth";
import { env } from "@/lib/env";

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

  // Com o Google ligado, a palavra-passe deixa de ser uma porta. O
  // formulário já não aparece, mas a acção continuava a responder a
  // quem a chamasse à mão.
  if (env.google.configurado) {
    return { erro: "Entre com o Google." };
  }

  if (!email || !palavraPasse) {
    return { erro: "Preencha o email e a palavra-passe." };
  }

  const resultado = await entrar(email, palavraPasse);
  if (!resultado.ok) return { erro: resultado.erro };

  redirect(destino);
}
