/**
 * Passa por todas as páginas do site e diz o que está partido.
 *
 * O e2e prova comportamentos escolhidos, um a um. Isto é a outra
 * metade: abre tudo, nos idiomas todos e nos dois tamanhos, e conta o
 * que ninguém pensou em testar. Erros na consola, pedidos que falham,
 * imagens sem alternativa, títulos repetidos, scroll na horizontal.
 *
 *   npm run varrer -- [endereço] [webkit]
 */
import { chromium, webkit } from "@playwright/test";

const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const MOTOR = process.argv[3] === "webkit" ? webkit : chromium;

const CAMINHOS = [
  "/", "/exposicoes", "/obras", "/artistas", "/lugares", "/arquivo",
  "/molduras", "/descarregar", "/contactos", "/a-galeria",
  "/a-obra-como-ativo", "/privacidade", "/ver-na-parede",
  "/nao-existe-de-certeza",
];

const IDIOMAS = ["pt", "en", "es"];
const ECRAS = [
  { nome: "grande", width: 1440, height: 900 },
  { nome: "telemóvel", width: 390, height: 844 },
];

const problemas = [];

async function descobrirFichas(pagina) {
  const extra = [];
  for (const [lista, padrao] of [
    ["/obras", /\/obras\/[^/]+$/],
    ["/artistas", /\/artistas\/[^/]+$/],
    ["/exposicoes", /\/exposicoes\/[^/]+$/],
  ]) {
    await pagina.goto(`${BASE}/pt${lista}`, { waitUntil: "domcontentloaded" });
    const hrefs = await pagina.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
    const primeira = hrefs.find((h) => h && padrao.test(h.replace(/^\/pt/, "")));
    if (primeira) extra.push(primeira.replace(/^\/pt/, ""));
  }
  // O percurso vive debaixo de uma exposição.
  const expo = extra.find((c) => c.startsWith("/exposicoes/"));
  if (expo) extra.push(`${expo}/percurso`);
  return extra;
}

const navegador = await MOTOR.launch();
const contexto = await navegador.newContext({ locale: "pt-PT" });
const sonda = await contexto.newPage();
const FICHAS = await descobrirFichas(sonda);
await sonda.close();
console.log(`${CAMINHOS.length + FICHAS.length} páginas, ${IDIOMAS.length} idiomas, ${ECRAS.length} tamanhos\n`);

for (const ecra of ECRAS) {
  const ctx = await navegador.newContext({
    viewport: { width: ecra.width, height: ecra.height },
    locale: "pt-PT",
    isMobile: ecra.width < 500,
    hasTouch: ecra.width < 500,
  });
  process.stdout.write(`${ecra.nome}: `);
  for (const idioma of IDIOMAS) {
    for (const caminho of [...CAMINHOS, ...FICHAS]) {
      const url = `${BASE}/${idioma}${caminho === "/" ? "" : caminho}`;
      const pagina = await ctx.newPage();
      const consola = [];
      const rede = [];
      pagina.on("console", (m) => { if (m.type() === "error") consola.push(m.text().slice(0, 120)); });
      pagina.on("pageerror", (e) => consola.push("pageerror: " + String(e).slice(0, 120)));
      pagina.on("response", (r) => {
        if (r.status() >= 400) rede.push(`${r.status()} ${r.url().replace(BASE, "").slice(0, 70)}`);
      });

      let estado = 0;
      try {
        // `domcontentloaded` e não `networkidle`: a entrada tem
        // paralaxe e imagens grandes, e a rede nunca assenta de todo.
        const r = await pagina.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
        estado = r?.status() ?? 0;
        await pagina.waitForTimeout(700);
      } catch (e) {
        problemas.push({ url, ecra: ecra.nome, tipo: "não carregou", detalhe: String(e).slice(0, 90) });
        await pagina.close();
        continue;
      }

      const esperado404 = caminho === "/nao-existe-de-certeza";
      if (esperado404 ? estado !== 404 : estado >= 400) {
        problemas.push({ url, ecra: ecra.nome, tipo: "estado", detalhe: String(estado) });
      }

      const medidas = await pagina.evaluate(() => {
        const doc = document.documentElement;
        const imgs = [...document.querySelectorAll("img")];
        return {
          transbordo: doc.scrollWidth - window.innerWidth,
          semAlt: imgs.filter((i) => !i.hasAttribute("alt")).length,
          h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim().slice(0, 40)),
          titulo: document.title,
          semTexto: document.body.innerText.trim().length < 120,
          linksVazios: [...document.querySelectorAll("a[href]")].filter(
            (a) => !a.textContent.trim() && !a.getAttribute("aria-label") && !a.querySelector("img[alt]:not([alt=''])"),
          ).length,
        };
      });

      if (medidas.transbordo > 1) problemas.push({ url, ecra: ecra.nome, tipo: "transbordo", detalhe: `${medidas.transbordo}px` });
      if (medidas.semAlt > 0) problemas.push({ url, ecra: ecra.nome, tipo: "img sem alt", detalhe: String(medidas.semAlt) });
      if (medidas.h1.length !== 1 && !esperado404) problemas.push({ url, ecra: ecra.nome, tipo: "h1", detalhe: `${medidas.h1.length}: ${medidas.h1.join(" / ")}` });
      if (!medidas.titulo) problemas.push({ url, ecra: ecra.nome, tipo: "sem <title>", detalhe: "" });
      if (medidas.semTexto && !esperado404) problemas.push({ url, ecra: ecra.nome, tipo: "página vazia", detalhe: "" });
      if (medidas.linksVazios > 0) problemas.push({ url, ecra: ecra.nome, tipo: "link sem nome", detalhe: String(medidas.linksVazios) });
      for (const c of consola) problemas.push({ url, ecra: ecra.nome, tipo: "consola", detalhe: c });
      for (const r of rede) problemas.push({ url, ecra: ecra.nome, tipo: "pedido", detalhe: r });

      await pagina.close();
      process.stdout.write(".");
    }
  }
  process.stdout.write("\n");
  await ctx.close();
}
await navegador.close();

if (problemas.length === 0) {
  console.log("Nada a apontar.");
} else {
  const porTipo = new Map();
  for (const p of problemas) porTipo.set(p.tipo, [...(porTipo.get(p.tipo) ?? []), p]);
  for (const [tipo, lista] of [...porTipo.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n${tipo} · ${lista.length}`);
    for (const p of lista.slice(0, 8)) {
      console.log(`   ${p.ecra.padEnd(10)} ${p.url.replace(BASE, "").padEnd(42)} ${p.detalhe}`);
    }
    if (lista.length > 8) console.log(`   … e mais ${lista.length - 8}`);
  }
  console.log(`\n${problemas.length} apontamentos.`);
}
