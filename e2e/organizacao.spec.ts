import { expect, test } from "@playwright/test";

/**
 * A ferramenta tem de mostrar o efeito enquanto se mexe nos controlos.
 *
 * Medido antes de a pré-visualização ficar presa: no telemóvel a imagem
 * estava a y=440 e o selector de moldura a y=1735. Mudava-se a moldura
 * e o resultado acontecia fora do ecrã, que é o mesmo que não acontecer.
 */

const VISTAS = [
  { nome: "desktop 1440", w: 1440, h: 900 },
  { nome: "portátil 1280", w: 1280, h: 800 },
  { nome: "tablet 834", w: 834, h: 1112 },
  { nome: "telemóvel 390", w: 390, h: 844 },
];

test("a imagem continua à vista enquanto se mexe nos controlos", async ({ page }) => {
  for (const v of VISTAS) {
    await page.setViewportSize({ width: v.w, height: v.h });
    await page.goto("/ver-na-parede");
    await page.waitForTimeout(600);
    console.log(`\n### ${v.nome}`);

    const controlos = ["Largura da obra", "Largura da parede", "Passe|Margem|Mount", "Moldura|Frame"];
    for (const nome of controlos) {
      const alvo = page.locator("aside").getByText(new RegExp(nome, "i")).first();
      await alvo.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(350);
      const r = await page.evaluate(() => {
        const p = document.querySelector('[class*="min-h-[260px]"]')!.getBoundingClientRect();
        const visivel = Math.max(0, Math.min(p.bottom, innerHeight) - Math.max(p.top, 0));
        return { pct: Math.round((visivel / p.height) * 100), altura: Math.round(p.height) };
      });
      console.log(`   ${nome.split("|")[0].padEnd(20)} imagem visível: ${String(r.pct).padStart(3)}%`);
      expect(
        r.pct,
        `${v.nome}: com "${nome.split("|")[0]}" à vista, a imagem só mostra ${r.pct}%`,
      ).toBeGreaterThan(70);
    }
  }
});
