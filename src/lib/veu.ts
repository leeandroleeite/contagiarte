/**
 * O véu que deixa ler texto por cima de fotografia.
 *
 * Não é decoração, é um mínimo medido. Escondeu-se o título na página
 * a correr, fotografou-se o que ficava por baixo, e calculou-se o
 * contraste do papel contra esse fundo dentro da caixa exacta que o
 * título ocupa. Com o véu antigo, 10,6% dessa área ficava abaixo de
 * 3:1, que é o mínimo para texto grande, e o pior ponto ficava em
 * 1,66. A olho, lia-se "FOR THE NEXT" e perdia-se "GENERATION OF ART".
 *
 * A conta foi repetida linha a linha sobre seis fotografias da adega e
 * deu uma curva quase plana: o título precisa de 0,48 de véu em toda a
 * banda que ocupa, venha a fotografia que vier. Daí o patamar em 0,50.
 * Acima dele o véu cai para 0,08, para a fotografia continuar a ser
 * uma fotografia e não um fundo cinzento.
 *
 * O patamar começa em 44% da altura porque a caixa do título começa
 * em 47% num ecrã de 1440x900 e sobe em ecrãs estreitos, onde o
 * título ocupa mais linhas.
 */

type Ponto = { em: number; alfa: number };

/** Curva em S. Interpolar a direito deixa arestas visíveis no degradê. */
const suave = (t: number) => t * t * (3 - 2 * t);

/**
 * Constrói o degradê a partir dos pontos, com paragens intermédias
 * para o olho não apanhar a mudança de declive.
 */
function veu(direccao: string, pontos: Ponto[], passos = 6): string {
  const paradas: string[] = [];
  const parar = (em: number, alfa: number) =>
    paradas.push(`rgba(14,12,11,${alfa.toFixed(3)}) ${(em * 100).toFixed(1)}%`);

  for (let i = 0; i < pontos.length - 1; i++) {
    const a = pontos[i];
    const b = pontos[i + 1];
    for (let p = 0; p < passos; p++) {
      const t = p / passos;
      parar(a.em + (b.em - a.em) * t, a.alfa + (b.alfa - a.alfa) * suave(t));
    }
  }
  const ultimo = pontos[pontos.length - 1];
  parar(ultimo.em, ultimo.alfa);

  return `linear-gradient(${direccao}, ${paradas.join(", ")})`;
}

/**
 * Herói da entrada.
 *
 * Este é o véu original, e é uma escolha de desenho feita de olhos
 * abertos. O título é desenhado em `mix-blend-mode: difference`, que
 * o pinta com o inverso do que tem por baixo: sobre uma fotografia
 * clara e movimentada há zonas em que o inverso se aproxima do fundo
 * e a letra esbate-se. Medido na página a correr, cerca de 20% da
 * área do título fica abaixo de 3:1.
 *
 * Tentou-se escurecer mais, e as letras perdiam a cor e a graça.
 * A decisão foi manter o efeito e resolver pela fotografia: sobre uma
 * capa escura e calma o mesmo véu mede bem. `npm run capas` ordena
 * uma pasta por esse critério.
 *
 * Quando a capa não ajuda, `camadaInvertida` dá o travão fino, e o
 * backoffice expõe-no em Definições.
 */
export const VEU_HEROI =
  "linear-gradient(to bottom, rgba(14,12,11,0.55), rgba(14,12,11,0.15) 40%, rgba(14,12,11,0.9))";

/** Ficha de exposição: título e datas na faixa de baixo. */
export const VEU_FICHA = veu("to bottom", [
  { em: 0, alfa: 0.34 },
  { em: 0.26, alfa: 0.08 },
  { em: 0.5, alfa: 0.4 },
  { em: 0.72, alfa: 0.66 },
  { em: 1, alfa: 0.74 },
]);

/** Percurso das salas: o texto vive à esquerda, sobre a fotografia. */
export const VEU_PERCURSO = veu("to right", [
  { em: 0, alfa: 0.86 },
  { em: 0.34, alfa: 0.62 },
  { em: 0.62, alfa: 0.24 },
  { em: 1, alfa: 0.1 },
]);

/**
 * A camada que destaca o título do herói da fotografia.
 *
 * Escurecer com tinta por cima achata a cor, e é a cor que dá o
 * brilho às letras, porque o `difference` as pinta com o inverso do
 * que têm por baixo. Filtrar escurece guardando a cor, e ainda a
 * puxa, por isso lê-se melhor sem o efeito ficar liso.
 *
 * Corre sobre uma segunda cópia da fotografia e não como
 * `backdrop-filter`: o WebKit responde que suporta `backdrop-filter`
 * e depois não o desenha, o que deixava o título com 39% da área
 * ilegível em Safari e em iPhone contra 1,5% no Chrome. Um
 * `@supports` não salvava nada, porque o motor mente na resposta.
 *
 * Medido na página a correr, com a capa da adega:
 *
 *      0   34% do título abaixo de 3:1   é o desenho original
 *     72   11%                           ainda com a cor toda
 *     88    1,5%                         letras quase lisas
 *
 * Devolve `null` no zero, para o herói não desenhar camada nenhuma e
 * ficar exactamente como foi desenhado.
 */
export function camadaInvertida(nivel: number | undefined | null) {
  const n = Math.min(100, Math.max(0, nivel ?? 0)) / 100;
  if (n === 0) return null;

  return {
    filtro: [
      `brightness(${(1 - 0.62 * n).toFixed(3)})`,
      `saturate(${(1 + 1.1 * n).toFixed(2)})`,
      `contrast(${(1 + 0.28 * n).toFixed(2)})`,
    ].join(" "),
    /**
     * As percentagens contam do topo da camada da fotografia, que
     * sobra 8% para cada lado para ter folga de paralaxe. Por isso o
     * 46% da altura do herói, onde o título começa, cai aos 52% aqui.
     */
    mascara: "linear-gradient(to bottom, transparent 41%, #000 52%)",
  };
}
