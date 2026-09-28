import { expect, test } from "@playwright/test";

/**
 * As entradas em scroll escondem títulos e imagens até o observador os
 * ver. O observador vive no layout, que não volta a montar quando se
 * navega por um link: durante semanas, quem entrava pela página inicial
 * e carregava em "Obras" encontrava a página sem uma única fotografia.
 * Carregar o endereço directamente mostrava tudo, e por isso ninguém
 * dava por isso.
 */
test("a página a que se chega por um link não fica com imagens escondidas", async ({
  page,
}) => {
  await page.goto("/");
  // Ficar mais de cinco segundos: antes disso, a rede de segurança da
  // página inicial ainda por disparar revelava também a página nova, e
  // o defeito escondia-se precisamente de quem clica depressa.
  await page.waitForTimeout(6000);
  // No telemóvel o menu está recolhido: serve qualquer ligação visível.
  await page.locator('a[href="/obras"]:visible').first().click();
  await page.waitForURL("**/obras");

  // Descer devagar, para cada imagem passar pelo ecrã.
  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(150);
  }

  const escondidas = page.locator('main [data-revelar=""], main [data-surge=""]');
  await expect(escondidas).toHaveCount(0);
});

/** Os filtros trocam a lista sem mudar de página, e o Voltar também. */
test("filtrar as obras e voltar não deixa cartões vazios", async ({ page }) => {
  await page.goto("/obras");
  await page.waitForTimeout(6000);

  const filtros = page.locator('main a[href*="artista="]:visible');
  await filtros.nth(1).click();
  await page.waitForURL(/artista=/);
  await page.goBack();
  await page.waitForURL((u) => !u.search.includes("artista="));

  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(150);
  }

  const escondidas = page.locator('main [data-revelar=""], main [data-surge=""]');
  await expect(escondidas).toHaveCount(0);
});

test.describe("menu compacto", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sair pelo logótipo fecha o menu e devolve o scroll", async ({ page }) => {
    await page.goto("/obras");
    await page.getByRole("button", { name: /menu/i }).click();
    await expect(page.locator("#menu-compacto")).toBeVisible();

    await page.getByRole("link", { name: "CONTAGIARTE®" }).click();
    await page.waitForURL((u) => u.pathname === "/");

    await expect(page.locator("#menu-compacto")).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("alargar o ecrã com o menu aberto devolve o scroll", async ({ page }) => {
    await page.goto("/obras");
    await page.getByRole("button", { name: /menu/i }).click();
    await page.setViewportSize({ width: 1280, height: 844 });

    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe("");
  });
});
