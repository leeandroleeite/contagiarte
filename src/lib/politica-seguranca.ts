/**
 * A política de segurança de conteúdo do site.
 *
 * Os outros cabeçalhos de segurança vivem no `next.config.ts`, porque
 * são iguais em todos os pedidos. Este não pode: leva um nonce, que é
 * um número usado uma vez, diferente a cada pedido. É ele que separa
 * os scripts que o site pôs na página daqueles que alguém conseguiu lá
 * meter. Por isso nasce no `proxy.ts`, que é o único sítio por onde
 * todos os pedidos passam antes de a página ser desenhada.
 */

/** Cabeçalho onde o nonce viaja do proxy até aos componentes. */
export const CABECALHO_NONCE = "x-nonce";

/**
 * Um nonce novo, 16 bytes de aleatório em base64.
 *
 * O `crypto` global existe no runtime do proxy e no de Node; não é
 * preciso importar nada.
 */
export function novoNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Monta a política para este pedido.
 *
 * Cada linha tem uma razão, e nenhuma delas é "por via das dúvidas":
 *
 * - `script-src` só aceita o nonce. O `'strict-dynamic'` deixa os
 *   scripts assim assinados carregar os seus próprios pedaços, que é
 *   como o Next serve a aplicação, e faz o browser ignorar o `'self'`,
 *   que fica só para os browsers antigos que não percebem a palavra.
 *   Em desenvolvimento entra o `'unsafe-eval'`, que o recarregamento
 *   a quente do Next precisa e a compilação de produção não.
 * - `style-src` leva `'unsafe-inline'` e não nonce. Os estilos inline
 *   do site são atributos `style={{}}` do React, e um atributo não
 *   pode levar nonce: ou se permitem todos, ou se reescreve o site
 *   inteiro. Um estilo injectado muda o aspecto da página, não corre
 *   código.
 * - `img-src` tem `blob:` por causa do simulador de parede, que lê a
 *   fotografia do visitante sem a enviar para lado nenhum, e `data:`
 *   por causa dos desfoques que o Next põe debaixo das imagens
 *   enquanto elas carregam. O domínio do R2 entra quando existe um
 *   configurado, que é quando as imagens deixam de passar por aqui.
 * - `frame-ancestors 'self'` diz o mesmo que o `X-Frame-Options` que
 *   já lá estava, na linguagem que os browsers de hoje lêem. O
 *   `base-uri` e o `form-action` estão aqui porque são as duas regras
 *   que o `default-src` não cobre: sem elas, um `<base>` injectado
 *   muda para onde vão todos os links da página, e um `action`
 *   injectado manda o formulário do backoffice para fora.
 * - As fontes, os pedidos e o manifesto não têm linha própria: o
 *   `default-src 'self'` já diz o que era preciso dizer, e repeti-lo
 *   só faz o cabeçalho crescer. Nada no site abre workers, por isso
 *   também não há `worker-src` a abrir-lhes a porta.
 * - `upgrade-insecure-requests` só quando o pedido entrou por https.
 *   A condição vem do pedido e não do `NODE_ENV`, porque os testes
 *   correm contra a compilação de produção em `http://127.0.0.1`: o
 *   Safari leva a regra à letra, tenta subir também o que é local, e
 *   todas as páginas ficavam com dezenas de erros de TLS na consola.
 */
export function politicaSeguranca(nonce: string, seguro: boolean): string {
  // O `'unsafe-eval'` é só do `next dev`, que recompila no browser; a
  // compilação que vai para o ar não precisa dele.
  const desenvolvimento = process.env.NODE_ENV !== "production";
  // O mesmo valor que o `urlMedia` usa para construir os endereços das
  // imagens, e pela mesma via: é fixado na compilação. Assim a política
  // e os endereços não podem discordar.
  const media = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(
    /\/$/,
    "",
  );

  const script = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    desenvolvimento ? "'unsafe-eval'" : null,
  ].filter(Boolean);

  const imagens = ["'self'", "data:", "blob:", media || null].filter(Boolean);

  return [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imagens.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'self'",
    seguro ? "upgrade-insecure-requests" : null,
  ]
    .filter(Boolean)
    .join("; ");
}
