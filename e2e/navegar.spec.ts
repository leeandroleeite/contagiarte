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
