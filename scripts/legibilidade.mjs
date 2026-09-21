/**
 * Mede a legibilidade do texto sobre fotografia, na página real.
 *
 *   npm run legibilidade -- <endereço> [selector] [webkit] [largura] [altura]
 *
 * O teste de contraste do e2e compara cores declaradas, e por isso não
 * vê nada quando o fundo é uma fotografia. Foi assim que o título da
 * entrada esteve com 20% da área por baixo do mínimo sem ninguém dar
 * por isso: a cor dizia papel sobre tinta, e o que lá estava era
 * pedra ao sol.
 *
 * Fotografa duas vezes, com e sem o texto. Onde os dois retratos
 * diferem está a letra; o que lá estava antes é o fundo dela. Compara
 * a cor que o browser desenhou com a cor de trás, o que apanha o
 * gradiente, a fotografia e o modo de mistura, em vez de os supor.
 */
import { chromium, webkit } from "@playwright/test";
import sharp from "sharp";

const rl = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * rl(r) + 0.7152 * rl(g) + 0.0722 * rl(b);
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const URL = process.argv[2] ?? "http://localhost:3100/pt";
const SEC = process.argv[3] ?? "#topo";
const MOTOR = process.argv[4] === "webkit" ? webkit : chromium;
const LARGURA = +(process.argv[5] ?? 1440);
const ALTURA = +(process.argv[6] ?? 900);
const LARG = LARGURA, ALT = ALTURA;

const navegador = await MOTOR.launch();
const pagina = await navegador.newPage({ viewport: { width: LARG, height: ALT } });
await pagina.goto(URL, { waitUntil: "networkidle" });
await pagina.waitForTimeout(1500);

const alvos = await pagina.evaluate((SEC) => {
  const heroi = document.querySelector(SEC);
  const fora = [];
  for (const e of heroi.querySelectorAll("h1, h2, span")) {
    const r = e.getBoundingClientRect();
    if (r.width < 40 || r.height < 8 || !e.textContent.trim()) continue;
    fora.push({ nome: /^H[12]$/.test(e.tagName) ? "titulo" : e.textContent.trim().slice(0, 22),
      corpo: parseFloat(getComputedStyle(e).fontSize), cor: getComputedStyle(e).color,
      mistura: getComputedStyle(e).mixBlendMode, x: r.x, y: r.y, w: r.width, h: r.height });
  }
  return fora;
}, SEC);

const comTexto = await pagina.screenshot({ clip: { x: 0, y: 0, width: LARG, height: ALT } });
await pagina.evaluate((SEC) => {
  for (const e of document.querySelector(SEC).querySelectorAll("h1, h2, span")) e.style.visibility = "hidden";
}, SEC);
await pagina.waitForTimeout(300);
const semTexto = await pagina.screenshot({ clip: { x: 0, y: 0, width: LARG, height: ALT } });
await navegador.close();

const A = await sharp(comTexto).raw().toBuffer({ resolveWithObject: true });
const B = await sharp(semTexto).raw().toBuffer({ resolveWithObject: true });
const px = (o, x, y) => { const i = (y * o.info.width + x) * o.info.channels; return [o.data[i], o.data[i + 1], o.data[i + 2]]; };

/** Força do efeito: quanta cor e quanta variação as letras guardam. */
function forca(cores) {
  if (cores.length === 0) return "-";
  const croma = cores.map((c) => Math.max(...c) - Math.min(...c));
  const l = cores.map(lum);
  const m = l.reduce((a, b) => a + b) / l.length;
  const dp = Math.sqrt(l.reduce((a, b) => a + (b - m) ** 2, 0) / l.length);
  return `croma ${(croma.reduce((a, b) => a + b) / croma.length).toFixed(1)}, variação ${(dp * 100).toFixed(1)}`;
}

console.log(`${URL}  ${MOTOR.name()} ${LARG}x${ALT}\n`);
console.log("alvo                    corpo  minimo  pior   p01    p05   mediana  falha%  letra%  efeito");
for (const a of alvos) {
  const limite = a.corpo >= 24 ? 3.0 : 4.5;
  const v = [];
  const cores = [];
  let total = 0;
  for (let y = Math.max(1, Math.round(a.y)); y < Math.min(ALT - 1, a.y + a.h); y++) {
    for (let x = Math.max(1, Math.round(a.x)); x < Math.min(LARG - 1, a.x + a.w); x++) {
      total++;
      const letra = px(A, x, y), fundo = px(B, x, y);
      // Só o miolo da letra. As bordas são meio-tons do anti-aliasing:
      // exige-se que os quatro vizinhos também sejam letra, senão
      // mede-se a transição e não o que se lê.
      const dif = (u, v) => Math.abs(u[0] - v[0]) + Math.abs(u[1] - v[1]) + Math.abs(u[2] - v[2]);
      if (dif(letra, fundo) < 90) continue;
      const miolo = [[-1, 0], [1, 0], [0, -1], [0, 1]].every(([dx, dy]) =>
        dif(px(A, x + dx, y + dy), px(B, x + dx, y + dy)) >= 90);
      if (!miolo) continue;
      // O fundo certo é o que está por baixo da letra, que o retrato
      // sem texto mostra no mesmo pixel. A 4px de distância ainda se
      // está dentro do traço.
      v.push(contraste(letra, fundo));
      cores.push(letra);
    }
  }
  // Texto fino quase não tem miolo: o traço é todo anti-aliasing. Aí
  // a medida honesta é a cor declarada contra o fundo.
  if (v.length < total * 0.02) {
    const c = a.cor.match(/[\d.]+/g).slice(0, 3).map(Number);
    const f = [];
    for (let y = Math.round(a.y); y < Math.min(ALT, a.y + a.h); y++)
      for (let x = Math.round(a.x); x < Math.min(LARG, a.x + a.w); x++) f.push(contraste(c, px(B, x, y)));
    f.sort((p, q) => p - q);
    console.log(a.nome.padEnd(23), String(a.corpo).padEnd(6), String(limite).padEnd(7),
      f[0].toFixed(2).padEnd(6), f[Math.floor(f.length * 0.01)].toFixed(2).padEnd(6),
      f[Math.floor(f.length * 0.05)].toFixed(2).padEnd(6), f[Math.floor(f.length * 0.5)].toFixed(2).padEnd(8),
      ((f.filter((x) => x < limite).length / f.length) * 100).toFixed(1).padEnd(7), "cor declarada");
    continue;
  }
  v.sort((p, q) => p - q);
  const q = (p) => v[Math.floor(v.length * p)].toFixed(2);
  console.log(
    a.nome.padEnd(23), String(a.corpo).padEnd(6), String(limite).padEnd(7),
    v[0].toFixed(2).padEnd(6), q(0.01).padEnd(6), q(0.05).padEnd(6), q(0.5).padEnd(8),
    ((v.filter((c) => c < limite).length / v.length) * 100).toFixed(1).padEnd(7),
    ((v.length / total) * 100).toFixed(0).padEnd(6),
    forca(cores),
  );
}
