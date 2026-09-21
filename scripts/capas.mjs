/**
 * Ordena uma pasta de fotografias pela qualidade que dão como capa.
 *
 *   npm run capas -- <pasta> [quantas]
 *
 * O título do herói é desenhado em `mix-blend-mode: difference`, que o
 * pinta com o inverso do que tem por baixo. Sobre pedra ao sol o
 * inverso aproxima-se do fundo e a letra esbate-se; sobre uma parede
 * escura sai quase branca e lê-se. Por isso a capa não se escolhe só
 * pela fotografia: escolhe-se também pelo que ela faz às letras.
 *
 * Aqui recorta-se cada fotografia como o `object-cover` a recorta num
 * ecrã de 1440x900, aplica-se o mesmo véu da página, e mede-se dentro
 * da caixa exacta que o título ocupa (x 28..1412, y 423..795, medida
 * no browser):
 *
 *   falha%   quanto da área do título fica abaixo de 3:1
 *   textura  quanto o fundo "treme" debaixo das letras, que estraga
 *            tipo de display mesmo quando o contraste passa
 *
 * Ordena pela falha e desempata pela textura. A escolha final é de
 * quem conhece o espólio: isto diz quais é que não dão trabalho.
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PAPEL = [0xf2, 0xed, 0xe4];
const TINTA = [0x0e, 0x0c, 0x0b];

const rl = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * rl(r) + 0.7152 * rl(g) + 0.0722 * rl(b);
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const LARG = 1440;
const ALT = 900;
const CAIXA = { x0: 28, x1: 1412, y0: 423, y1: 795 };

/** O véu do herói, tal como `src/lib/veu.ts` o declara. */
function alfa(y) {
  const f = y / ALT;
  return f <= 0.4 ? 0.55 + (0.15 - 0.55) * (f / 0.4) : 0.15 + (0.9 - 0.15) * ((f - 0.4) / 0.6);
}

const EXTENSOES = /\.(jpe?g|png|webp)$/i;

async function medir(ficheiro) {
  const { data, info } = await sharp(ficheiro)
    .resize(LARG, ALT, { fit: "cover", position: "centre" })
    .raw().toBuffer({ resolveWithObject: true });

  const em = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
  const fundo = (x, y) => { const a = alfa(y), p = em(x, y); return [0, 1, 2].map((k) => p[k] * (1 - a) + TINTA[k] * a); };

  let abaixo = 0, conta = 0, textura = 0, vizinhos = 0;
  for (let y = CAIXA.y0; y < CAIXA.y1; y += 3) {
    for (let x = CAIXA.x0; x < CAIXA.x1; x += 3) {
      const b = fundo(x, y);
      // A letra é o inverso do fundo, que é o que o `difference` faz.
      const letra = [0, 1, 2].map((k) => Math.abs(PAPEL[k] - b[k]));
      if (contraste(letra, b) < 3) abaixo++;
      conta++;
      if (x > CAIXA.x0 + 6 && y > CAIXA.y0 + 6) {
        const l = lum(b);
        textura += Math.abs(l - lum(fundo(x - 6, y))) + Math.abs(l - lum(fundo(x, y - 6)));
        vizinhos++;
      }
    }
  }
  return { falha: (abaixo / conta) * 100, textura: (textura / vizinhos) * 1000 };
}

const [pasta, quantas = "20"] = process.argv.slice(2);
if (!pasta) {
  console.error("Falta a pasta. npm run capas -- <pasta> [quantas]");
  process.exit(1);
}

const raiz = path.resolve(pasta);
const ficheiros = readdirSync(raiz).filter((n) => EXTENSOES.test(n)).sort();
if (ficheiros.length === 0) {
  console.error(`Nenhuma fotografia em ${raiz}`);
  process.exit(1);
}

const linhas = [];
for (const f of ficheiros) {
  try {
    linhas.push({ f, ...(await medir(path.join(raiz, f))) });
  } catch (erro) {
    console.error(`  ${f}: ${String(erro).slice(0, 80)}`);
  }
}
linhas.sort((a, b) => a.falha - b.falha || a.textura - b.textura);

console.log(`${linhas.length} fotografias, as ${quantas} melhores para capa:\n`);
console.log("     ficheiro                                  falha%  textura");
for (const [i, l] of linhas.slice(0, +quantas).entries()) {
  console.log(
    `${String(i + 1).padStart(4)} ${l.f.padEnd(42)} ${l.falha.toFixed(1).padStart(6)} ${l.textura.toFixed(1).padStart(8)}`,
  );
}
console.log("\nfalha% é quanto da área do título fica por ler. Abaixo de 5% não dá trabalho.");
