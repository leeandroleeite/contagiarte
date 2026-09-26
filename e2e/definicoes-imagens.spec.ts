import { expect, test } from "@playwright/test";
import { entrarNoBackoffice } from "./ajudas";

/**
 * Escolher uma fotografia de página nas Definições e vê-la aparecer.
 *
 * As páginas fixas mostravam um marcador vazio porque a fotografia
 * estava escrita como `media={null}`. Agora escolhe-se no backoffice, e
 * uma escolha serve dois sítios: a moldura aparece na entrada e em
 * /molduras, o retrato na entrada e em /a-galeria.
 *
 * O que este teste guarda é a ponte inteira: o campo no formulário, o
 * `lerRelacao` que o lê, o JSON das definições que o guarda, e o
 * `obterImagensDoSite` que o resolve em media para a página desenhar.
 * Cada uma dessas peças já existia isolada; nenhuma estava provada em
 * conjunto.
 */
test.describe("Fotografias das páginas fixas", () => {
  test.skip(({ isMobile }) => Boolean(isMobile), "o backoffice tem projecto próprio");

  test("escolher a fotografia das molduras põe-na na entrada e em /molduras", async ({
    page,
  }) => {
    // Antes: as duas páginas mostram o marcador, não uma fotografia.
    for (const caminho of ["/molduras", "/"]) {
      await page.goto(caminho);
      await expect(
        page.locator('[role="img"][aria-label*="MOLDARTPÓVOA"]'),
      ).toBeVisible();
    }

    await entrarNoBackoffice(page);
    await page.goto("/admin/definicoes");

    // O campo existe e está vazio.
    const campo = page.locator('input[name="molduraImagemId"]');
    await expect(campo).toHaveCount(1);
    await expect(campo).toHaveValue("");

    // Escolher a primeira imagem da biblioteca. O campo é o bloco que
    // contém o input escondido com este nome.
    const bloco = page.locator("div").filter({
      has: page.locator('input[name="molduraImagemId"]'),
    }).last();
    await bloco
      .getByRole("button", { name: "Escolher da biblioteca" })
      .click();
    await bloco.locator("ul button").first().click();
    await expect(campo).not.toHaveValue("");

    await page.getByRole("button", { name: /Guardar/ }).first().click();
    await expect(page.getByText("Definições guardadas.")).toBeVisible();

    // Depois: os dois sítios mostram a fotografia e o marcador saiu.
    for (const caminho of ["/molduras", "/"]) {
      await page.goto(caminho);
      await expect(
        page.locator('[role="img"][aria-label*="MOLDARTPÓVOA"]'),
      ).toHaveCount(0);
      await expect(
        page.locator('img[alt*="MOLDARTPÓVOA"]').first(),
      ).toBeVisible();
    }
  });
});
