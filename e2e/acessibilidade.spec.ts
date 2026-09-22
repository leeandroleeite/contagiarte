import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarNoBackoffice } from "./ajudas";

/**
 * Acessibilidade medida por máquina, com o axe.
 *
 * O `contraste.spec.ts` já cobria a cor, que era a falha conhecida.
 * Isto é o resto: nomes em botões e links, rótulos em campos, papéis
 * correctos, regiões marcadas, ordem dos títulos. Nenhuma ferramenta
 * automática apanha tudo, mas o que ela apanha não se discute.
 */

const PAGINAS = [
  "/",
  "/exposicoes",
  "/obras",
  "/artistas",
  "/lugares",
  "/molduras",
  "/descarregar",
  "/contactos",
  "/a-galeria",
  "/ver-na-parede",
];

const ADMIN = ["/admin", "/admin/obras", "/admin/media", "/admin/definicoes"];

/** As regras que valem a pena, sem as experimentais. */
const NORMAS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];

async function analisar(page: import("@playwright/test").Page, caminho: string) {
  await page.goto(caminho, { waitUntil: "domcontentloaded" });

  // A cortina da entrada é decoração: tapa a página, pisca o
  // logótipo e sai. Medir enquanto ela lá está é medir o que ninguém
  // lê, e o piscar fazia o contraste falhar a meio da animação.
  const cortina = page.locator("[data-cortina]");
  if ((await cortina.count()) > 0) {
    await cortina.waitFor({ state: "hidden", timeout: 6000 }).catch(() => {});
  }
  await page.waitForTimeout(400);

  const r = await new AxeBuilder({ page }).withTags(NORMAS).analyze();

  const falhas = r.violations.map((v) => ({
    regra: v.id,
    impacto: v.impact,
    onde: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
    porque: v.help,
  }));

  expect(
    falhas,
    `${caminho}:\n${falhas.map((f) => `  ${f.impacto} · ${f.regra} · ${f.porque}\n    ${f.onde.join("\n    ")}`).join("\n")}`,
  ).toEqual([]);
}

test.describe("Acessibilidade do site", () => {
  for (const caminho of PAGINAS) {
    test(`a página ${caminho} passa o axe`, async ({ page }) => {
      await analisar(page, caminho);
    });
  }
});

test.describe("Acessibilidade do backoffice", () => {
  test.skip(({ isMobile }) => Boolean(isMobile), "o backoffice é para ecrã grande");

  test("as páginas do backoffice passam o axe", async ({ page }) => {
    await entrarNoBackoffice(page);
    for (const caminho of ADMIN) {
      await analisar(page, caminho);
    }
  });
});
