/**
 * As fichas de cor para os sítios onde o CSS não chega: a imagem de
 * partilha (desenhada no servidor), o manifesto, a cor da barra do
 * browser e a página de erro fatal, que não carrega a folha de estilo.
 *
 * Os valores são os de `@theme` em `src/app/globals.css`. Mudar a
 * marca é mudar os dois ficheiros, e o teste `fichas.spec.ts` falha se
 * divergirem.
 */
export const FICHAS = {
  tinta: "#0e0c0b",
  papel: "#f2ede4",
  ouro: "#b4884a",
  claro80: "rgba(242, 237, 228, 0.8)",
  claro65: "rgba(242, 237, 228, 0.65)",
  claro55: "rgba(242, 237, 228, 0.55)",
  fioControlo: "rgba(242, 237, 228, 0.35)",
} as const;
