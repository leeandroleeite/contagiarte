import "server-only";

import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Entrar com o Google, sem Firebase nem biblioteca de autenticação.
 *
 * O botão do backoffice manda o browser para a Google com
 * `response_type=id_token` e `response_mode=form_post`: a Google
 * devolve-o com um POST para `/api/auth/google`, que traz um token
 * assinado a dizer quem a pessoa é. O servidor confere a assinatura com
 * as chaves públicas da Google, e o resto é o que já existia: quem não
 * estiver em Utilizadores não entra.
 *
 * Não há segredo de cliente nenhum, porque o servidor só verifica
 * tokens, nunca os pede. O Client ID não é secreto.
 */

export const COOKIE_GOOGLE = "contagiarte_google";

/** Onde a Google devolve o browser. Tem de estar registado na consola. */
export const CAMINHO_GOOGLE = "/api/auth/google";

const EMISSORES = ["https://accounts.google.com", "accounts.google.com"];

// O `jose` guarda as chaves em memória e só as volta a pedir quando a
// Google as roda, por isso isto é um pedido de longe a longe.
const chavesGoogle = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export function enderecoGoogle(opcoes: {
  clienteId: string;
  regresso: string;
  nonce: string;
}): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: opcoes.clienteId,
    redirect_uri: opcoes.regresso,
    response_type: "id_token",
    response_mode: "form_post",
    scope: "openid email profile",
    nonce: opcoes.nonce,
    // Quem tem várias contas Google escolhe com qual entra, em vez de
    // entrar calado com a que estiver aberta.
    prompt: "select_account",
  }).toString();
  return url.toString();
}

export type PessoaGoogle = { email: string; nome: string };

/**
 * Confere o token e devolve quem é, ou null.
 *
 * O `nonce` é o que liga este token ao clique que o pediu: vem num
 * cookie posto antes de ir para a Google, e um token roubado de outra
 * sessão não o traz.
 */
export async function conferirTokenGoogle(
  token: string,
  clienteId: string,
  nonce: string,
): Promise<PessoaGoogle | null> {
  try {
    const { payload } = await jwtVerify(token, chavesGoogle, {
      issuer: EMISSORES,
      audience: clienteId,
    });
    if (payload.nonce !== nonce) return null;
    // Um email por confirmar é um email que qualquer um podia ter
    // escrito numa conta Google.
    if (payload.email_verified !== true) return null;
    if (typeof payload.email !== "string") return null;
    return {
      email: payload.email.trim().toLowerCase(),
      nome: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}
