import { expect, test } from "@playwright/test";
import { entrarNoBackoffice } from "./ajudas";

/**
 * O backoffice promete 25 MB por ficheiro e valida-os, mas o Next corta
 * o corpo de uma server action nos 1 MB por omissão. Durante meses
 * qualquer fotografia de máquina ou catálogo em PDF morreu com um erro
 * de servidor sem explicação, e ninguém deu por isso porque os testes
 * só carregavam PNG de quatro pixéis.
 */

/** Um PDF de mentira com o tamanho que se pedir. */
function pdfDe(megabytes: number): Buffer {
  const cabecalho = Buffer.from("%PDF-1.4\n% documento de teste\n");
  const enchimento = Buffer.alloc(
    Math.round(megabytes * 1024 * 1024) - cabecalho.length,
    0x20,
  );
  return Buffer.concat([cabecalho, enchimento, Buffer.from("\n%%EOF\n")]);
}

/**
 * Há dois limites diferentes e ambos devolviam o mesmo erro mudo: o do
 * corpo de uma server action, que era 1 MB, e o do corpo que o Next
 * entrega ao `proxy.ts`, que era 10. O primeiro apanhou-se com uma
 * fotografia de máquina, o segundo com o catálogo de 17,6 MB.
 */
test("um ficheiro de 3 MB entra na mediateca", async ({ page }) => {
  test.setTimeout(3 * 60 * 1000);
  await entrarNoBackoffice(page);
  await page.goto("/admin/media");

  const nome = `grande-${Date.now().toString(36)}.pdf`;
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({ name: nome, mimeType: "application/pdf", buffer: pdfDe(3) });

  await expect(page.getByText(nome)).toBeVisible({ timeout: 120000 });

  // Limpar, para não deixar três megabytes por cada corrida.
  page.once("dialog", (d) => d.accept());
  await page
    .locator("main li")
    .filter({ hasText: nome })
    .getByRole("button", { name: "Apagar" })
    .click();
  await expect(page.getByText(nome)).toHaveCount(0, { timeout: 30000 });
});

test("um ficheiro de 18 MB também entra", async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);
  await entrarNoBackoffice(page);
  await page.goto("/admin/media");

  const nome = `enorme-${Date.now().toString(36)}.pdf`;
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({ name: nome, mimeType: "application/pdf", buffer: pdfDe(18) });

  await expect(page.getByText(nome)).toBeVisible({ timeout: 180000 });

  page.once("dialog", (d) => d.accept());
  await page
    .locator("main li")
    .filter({ hasText: nome })
    .getByRole("button", { name: "Apagar" })
    .click();
  await expect(page.getByText(nome)).toHaveCount(0, { timeout: 60000 });
});
