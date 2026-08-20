import "server-only";

import { env } from "@/lib/env";

type Mensagem = {
  para: string;
  assunto: string;
  texto: string;
  responderA?: string;
};

/**
 * Envia email por Resend (HTTP) ou por SMTP, conforme o que estiver
 * configurado. Sem nenhum dos dois, regista na consola e devolve false:
 * o pedido fica sempre guardado na base de dados, por isso um email que
 * não sai nunca faz perder um contacto.
 */
export async function enviarEmail(m: Mensagem): Promise<boolean> {
  if (env.email.resend) return porResend(m);
  if (env.email.smtp) return porSmtp(m);

  console.warn(
    `[email] sem serviço configurado. Assunto: ${m.assunto} (para ${m.para})`,
  );
  return false;
}

async function porResend(m: Mensagem): Promise<boolean> {
  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.email.resend}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.email.de,
        to: [m.para],
        subject: m.assunto,
        text: m.texto,
        ...(m.responderA ? { reply_to: m.responderA } : {}),
      }),
    });
    if (!resposta.ok) {
      console.error("[email] Resend recusou:", await resposta.text());
      return false;
    }
    return true;
  } catch (erro) {
    console.error("[email] Resend falhou:", erro);
    return false;
  }
}

async function porSmtp(m: Mensagem): Promise<boolean> {
  try {
    const { createTransport } = await import("nodemailer");
    const transporte = createTransport(env.email.smtp);
    await transporte.sendMail({
      from: env.email.de,
      to: m.para,
      subject: m.assunto,
      text: m.texto,
      replyTo: m.responderA,
    });
    return true;
  } catch (erro) {
    console.error("[email] SMTP falhou:", erro);
    return false;
  }
}

/** Aviso interno de um pedido novo, com tudo o que a galeria precisa. */
export function corpoPedido(campos: Record<string, string | undefined>): string {
  const linhas = Object.entries(campos)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v}`);
  return [
    "Chegou um pedido novo pelo site.",
    "",
    ...linhas,
    "",
    `Ver no backoffice: ${env.urlPublico}/admin/pedidos`,
  ].join("\n");
}
