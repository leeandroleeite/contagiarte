# Sistema de design do site público

As decisões que eliminam decisões. Cada linha diz o que se usa e
porquê. A fonte de verdade é `src/app/globals.css`; este ficheiro
explica-a. O backoffice tem as suas próprias fichas (`adm-*`) e não
entra aqui.

## Cor

A paleta é a do handoff: tinta, tinta da obra, papel, ouro. Não se
inventa cor fora dela. O que se acrescentou são **papéis**, não cores:
alfas das mesmas quatro, com nome e função.

| Ficha | Valor | Para quê |
|---|---|---|
| `claro-80` | papel a 80% | Corpo de leitura sobre tinta (10,8:1) |
| `claro-65` | papel a 65% | Texto secundário (7,3:1) |
| `claro-55` | papel a 55% | Mínimo: etiquetas, meta, notas (5,5:1). Abaixo disto não há texto |
| `escuro-78` | tinta a 78% | Corpo sobre papel |
| `escuro-62` | tinta a 62% | Secundário sobre papel (5,2:1). O backoffice usa o mesmo |
| `fio` | papel a 16% | Linha que separa |
| `fio-forte` | papel a 25% | Linha que contorna |
| `fio-controlo` | papel a 35% | Contorno de controlos: botões de linha, campos |
| `fio-escuro` / `fio-escuro-forte` | tinta a 16% / 35% | As mesmas duas, sobre papel |
| `tinta-elevada` | `#151211` | Fundo de uma imagem que ainda não chegou |
| `veu` | tinta a 82% | Tinta translúcida por cima de fotografia |
| `ouro-lavado` | ouro a 10% | Estado "feito": pedido enviado, zona de largar |
| `erro` / `erro-claro` | `#9b3226` / `#d9705e` | Só erros. O escuro sobre papel, o aclarado sobre tinta (o escuro dava 2,7:1) |

Onde o CSS não chega (imagem de partilha, manifesto, cor da barra do
browser, erro fatal) as cores vêm de `src/lib/fichas.ts`. O teste
`e2e/fichas.spec.ts` falha se os dois ficheiros divergirem.

Valores que ficam em cru, de propósito: as cores do passe-partout e as
sombras do simulador "Ver na parede". Descrevem um objecto físico, não
a interface. A sombra do simulador é a segunda excepção à regra "sem
sombras", a par do botão do WhatsApp.

## Tipografia

Bricolage Grotesque para títulos, Spline Sans para texto. O eixo de
largura da Bricolage vai de 75 a 100: o 118% que estava escrito era
cortado a 100.

| Degrau | Utilidade | Tamanho | Uso |
|---|---|---|---|
| Herói | `d-heroi` | 56 a 200px | Frase da entrada e 404. Um por página, no máximo |
| Página | `d-pagina` | 48 a 128px | h1 de índices e páginas institucionais |
| Ficha | `d-ficha` | 44 a 112px | h1 de obra, artista, exposição |
| Secção | `d-seccao` | 36 a 88px | h2 de secção; fecho do rodapé |
| Apoio | `d-apoio` | 28 a 60px | Secções de apoio, relacionadas, newsletter |
| Linha | `d-linha` | 20 a 34px | Uma entrada numa lista de índice |
| Citação | `d-citacao`, `d-citacao-med` | 30 a 80, 22 a 44px | Manifesto; a voz de alguém |
| Lead | `lead` | 20px | Primeiro parágrafo |
| Corpo | `corpo` | 17px | Prosa |
| Meta | `meta` | 14px, algarismos fixos | Fichas técnicas, legendas |
| Etiqueta | `etiqueta` | 12px, 500, 0,2em, maiúsculas | Rótulos, datas, botões |

Regras:

- **Nenhum título com `clamp()` à mão.** Se nenhum degrau serve, o
  problema é o layout.
- **Maiúsculas por CSS**, nunca com `toUpperCase()`: o texto em
  maiúsculas no DOM muda o que o leitor de ecrã lê e o que se copia.
  Os degraus página, secção e apoio já são maiúsculos.
- Os pisos foram medidos a 390px: a razão entre o maior e o menor
  título é 2 (era 1,5), e "DESCARREGAR" cabe numa linha.
- Os títulos partem palavras com hífen (`hyphens: auto`) e equilibram
  as linhas.
- Algarismos que se alinham (datas, medidas, ordinais): `numeros` ou
  `meta`.

## Espaço

- **Margem lateral única**: `px-margem` (20px no telemóvel, 28px a
  partir de 640px), no cabeçalho, nas secções e nas fichas.
- Base de 4px para o resto. Ritmo de secção: 120px (`Seccao`), 88px
  nas fichas.

## Superfícies e componentes

- **A obra nunca se corta.** `ImagemObra` põe-na inteira, sobre
  passe-partout de tinta da obra, numa moldura de proporção fixa. O
  `Imagem` com `cover` é só para fotografias de lugares e retratos.
- **Um só `CartaoObra`**, `grande` ou `compacto`, com a linha de meta
  escolhida por quem o usa.
- Raio zero e sem sombras. O cursor circular é a única forma redonda,
  herdada do handoff.

## Movimento

Tudo em `src/components/Movimento.tsx` e no CSS, e tudo desliga com
`prefers-reduced-motion`.

| Ficha | Valor | Para quê |
|---|---|---|
| `--duracao-micro` | 150ms | Hover, foco |
| `--duracao-rapida` | 240ms | Cursor, saída de página, cortina apressada |
| `--duracao-media` | 480ms | Texto que entra, hover de obra |
| `--duracao-revelar` | 900ms | Máscaras, voo da obra |
| `--duracao-cena` | 1100ms | Cortina, revelação de imagem |
| `ease-chegar` | `cubic-bezier(.2,.7,.2,1)` | O que chega trava |
| `ease-cortina` | `cubic-bezier(.76,0,.24,1)` | Máscaras e cenas |
| `ease-sair` | `cubic-bezier(.4,0,1,1)` | O que sai acelera |

- Anima-se `transform`, `opacity` e `clip-path`. Nunca `width`.
- O loop dorme quando nada se mexe.
- Grelhas penduram-se peça a peça: 60ms entre itens, no máximo seis.
- A passagem entre páginas é do `<ViewTransition>` do React: a obra voa
  do cartão para a ficha, o resto sai e entra. As relacionadas de uma
  ficha não voam.
- Só se esconde conteúdo com `html.js`: sem JavaScript fica tudo à
  vista.

## Som

Não há. Foi ponderado um só sítio (o percurso da adega, com ambiente
gravado no espaço, desligado por defeito) e fica como ideia: precisa de
gravação real.
