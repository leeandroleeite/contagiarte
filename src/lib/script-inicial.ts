import { headers } from "next/headers";
import { CABECALHO_NONCE } from "@/lib/politica-seguranca";

/**
 * Corre antes da primeira pintura, no `<head>`, e decide duas coisas
 * que não podem esperar pelo React.
 *
 * 1. Se há JavaScript. As entradas em scroll escondem títulos e imagens
 *    até o observador os ver; sem JavaScript, ou se o código do site não
 *    chegar a correr, ficavam escondidos para sempre. Agora só se
 *    esconde com `html.js`, e se o Movimento não se anunciar em seis
 *    segundos a classe sai e tudo aparece.
 * 2. Se a cortina da entrada já foi vista nesta sessão. A decisão
 *    vivia num efeito do React, que corre depois de pintar: num
 *    telemóvel lento a cortina voltava a tapar o ecrã a quem regressava
 *    à página inicial.
 *
 * Leva o nonce do pedido, como os blocos de dados estruturados. O
 * <Script> em si vive no layout de raiz, que é onde o Next aceita a
 * estratégia beforeInteractive.
 */
export const CODIGO_INICIAL = `(function(){var h=document.documentElement;h.classList.add("js");try{if(sessionStorage.getItem("contagiarte-cortina")==="1")h.setAttribute("data-cortina-vista","")}catch(e){}setTimeout(function(){if(!window.__movimento)h.classList.remove("js")},6000)})();`;

export async function nonceDoPedido(): Promise<string | undefined> {
  return (await headers()).get(CABECALHO_NONCE) ?? undefined;
}
