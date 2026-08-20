import { expect, test } from "@playwright/test";

/**
 * Contraste de texto, página a página.
 *
 * A auditoria de agosto de 2026 encontrou 36 falhas só na homepage: o
 * texto secundário a 11px, peso 300, com o creme a 45 por cento de
 * opacidade. Nenhuma delas era visível a olho nu para quem já conhecia
 * a página, e todas contavam contra numa avaliação.
 *
 * Isto mede o que os avaliadores medem: a razão entre a cor do texto,
 * já misturada com o fundo, e o fundo em si.
 */

const PAGINAS = ["/", "/obras", "/artistas", "/exposicoes", "/lugares", "/molduras",
  "/contactos", "/a-galeria", "/descarregar", "/arquivo", "/ver-na-parede",
  "/obras/wonder-frida", "/artistas/mario-ferreira", "/exposicoes/a-pele-da-terra"];

test("nenhuma página tem texto abaixo do contraste mínimo", async ({ page }) => {
  const falhas: string[] = [];
  for (const p of PAGINAS) {
    await page.goto(p);
    await page.waitForTimeout(600);
    const maus = await page.evaluate(() => {
      const lum = (r: number, g: number, b: number) => { const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const rgb = (s: string) => (s.match(/\d+(\.\d+)?/g) || []).map(Number);
      const fundoDe = (el: Element): number[] => { let n: Element | null = el; while (n && n !== document.documentElement) { const p = rgb(getComputedStyle(n).backgroundColor); if (p.length >= 3 && (p[3] === undefined || p[3] > 0.5)) return p; n = n.parentElement; } return [14, 12, 11]; };
      const out: string[] = [];
      document.querySelectorAll("body *").forEach((el) => {
        const t = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent!.trim()).join("");
        if (!t || el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
        const c = getComputedStyle(el);
        if (c.visibility === "hidden" || c.display === "none" || +c.opacity === 0) return;
        const cor = rgb(c.color); const fundo = fundoDe(el);
        const a = cor[3] === undefined ? 1 : cor[3];
        const m = [0, 1, 2].map((i) => Math.round(cor[i] * a + fundo[i] * (1 - a)));
        const l1 = lum(m[0], m[1], m[2]), l2 = lum(fundo[0], fundo[1], fundo[2]);
        const r = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const px = parseFloat(c.fontSize);
        const minimo = px >= 24 || (px >= 18.66 && +c.fontWeight >= 700) ? 3 : 4.5;
        if (r < minimo) out.push(`${r.toFixed(2)}:1 ${Math.round(px)}px "${t.slice(0, 30)}"`);
      });
      return [...new Set(out)];
    });
    if (maus.length) falhas.push(`${p}: ${maus.slice(0, 4).join(" | ")}`);
  }
  expect(falhas, falhas.join("\n")).toEqual([]);
});
