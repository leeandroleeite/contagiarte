import { expect, test } from "@playwright/test";
import { semScrollHorizontal } from "./ajudas";

/**
 * A página da newsletter e os ícones dos contactos, os dois pedidos da
 * galeria de Outubro. A página tem de existir nas três línguas, chegar
 * pela navegação e pelo rodapé, e subscrever de verdade; os ícones têm
 * de lá estar sem se fazerem ouvir num leitor de ecrã.
 */

const unico = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

test.describe("Página da newsletter", () => {
  for (const [caminho, titulo] of [
    ["/newsletter", /ANTES DE TODOS/],
    ["/en/newsletter", /BEFORE ANYONE/],
    ["/es/newsletter", /ANTES QUE NADIE/],
  ] as const) {
    test(`${caminho} abre com as vantagens e o formulário`, async ({ page }) => {
      await page.goto(caminho);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(titulo);
      await expect(page.locator("main ol > li")).toHaveCount(4);
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await semScrollHorizontal(page);
    });
  }

  test("subscrever na página confirma ao utilizador", async ({ page }) => {
    await page.goto("/newsletter");
    await page
      .locator('input[name="email"]')
      .fill(`teste-${unico()}@exemplo.pt`);
    await page.getByRole("button", { name: /^Subscrever$/i }).click();
    await expect(page.getByText(/está subscrito/i)).toBeVisible();
  });

  test("chega-se lá pela navegação e pelo rodapé", async ({ page, isMobile }) => {
    await page.goto("/contactos");

    const menu = page.getByRole("button", { name: /Menu ☰/i });
    if (isMobile && (await menu.isVisible())) await menu.click();
    await expect(
      page
        .getByRole("navigation", { name: "Navegação principal" })
        .getByRole("link", { name: "Newsletter", exact: true })
        .first(),
    ).toHaveAttribute("href", "/newsletter");
    if (isMobile) await page.keyboard.press("Escape");

    await expect(
      page.locator("footer").getByRole("link", { name: /Newsletter/ }),
    ).toHaveAttribute("href", "/newsletter");
  });
});

test("os contactos levam ícone, escondido dos leitores de ecrã", async ({
  page,
}) => {
  await page.goto("/contactos");
  for (const zona of [page.locator("main"), page.locator("footer")]) {
    for (const link of [
      zona.locator('a[href^="https://wa.me"]').first(),
      zona.locator('a[href^="mailto:"]').first(),
      zona.locator('a[href^="tel:"]').first(),
      zona.locator('a[href^="https://instagram.com"]').first(),
    ]) {
      await expect(link.locator('svg[aria-hidden="true"]')).toHaveCount(1);
    }
  }
});
