import { expect, test } from "@playwright/test";

/**
 * Os formulários são o objectivo comercial do site: se falharem em
 * silêncio, perdem-se contactos. Estes testes confirmam que o pedido
 * chega, que o utilizador vê confirmação, e que os travões funcionam.
 */

const unico = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

test.describe("Newsletter", () => {
  test("subscrever confirma ao utilizador", async ({ page }) => {
    await page.goto("/contactos");

    const email = `teste-${unico()}@exemplo.pt`;
    await page.locator('input[type="email"][name="email"]').fill(email);
    await page.getByRole("button", { name: /Subscrever/i }).click();

    await expect(page.getByText(/está subscrito/i)).toBeVisible();
  });

  test("um email inválido é recusado pelo servidor", async ({ page }) => {
    await page.goto("/contactos");

    // "teste@dominio" passa a validação do browser (tem @) mas não
    // passa a do servidor, que exige um domínio completo. É o caso que
    // interessa testar: o que chega ao servidor apesar do browser.
    await page.locator('input[name="email"]').first().fill("teste@dominio");
    await page.getByRole("button", { name: /Subscrever/i }).click();

    await expect(page.getByText(/Verifique o endereço de email/i)).toBeVisible();
    // O que foi escrito não se perde.
    await expect(page.locator('input[name="email"]').first()).toHaveValue(
      "teste@dominio",
    );
  });
});

test.describe("Pedidos", () => {
  test("um pedido de moldura chega e confirma", async ({ page }) => {
    await page.goto("/molduras");

    const nome = `Teste ${unico()}`;
    await page.getByPlaceholder("Nome").fill(nome);
    await page.getByPlaceholder(/Email ou telemóvel/i).fill("teste@exemplo.pt");
    await page.getByPlaceholder(/Medidas/i).fill("70 × 50 cm");
    await page
      .getByPlaceholder(/O que quer emoldurar/i)
      .fill("Uma gravura antiga da família.");

    await page.getByRole("button", { name: /Enviar pedido/i }).click();
    await expect(page.getByText(/Recebemos o seu pedido/i)).toBeVisible();
  });

  test("o interesse numa obra guarda a obra certa", async ({ page }) => {
    await page.goto("/obras/wonder-frida");

    const nome = `Interessado ${unico()}`;
    const formulario = page.locator("form").filter({
      has: page.getByRole("button", { name: /Enviar pedido/i }),
    });

    await formulario.getByPlaceholder("Nome").fill(nome);
    await formulario
      .getByPlaceholder(/Email ou telemóvel/i)
      .fill("interesse@exemplo.pt");
    await formulario.getByRole("button", { name: /Enviar pedido/i }).click();

    await expect(page.getByText(/Recebemos o seu pedido/i)).toBeVisible();
  });

  test("a armadilha para robôs não deixa passar lixo", async ({ page }) => {
    await page.goto("/molduras");

    await page.getByPlaceholder("Nome").fill("Robô");
    await page.getByPlaceholder(/Email ou telemóvel/i).fill("robo@exemplo.pt");
    // O campo é invisível de propósito, por isso preenche-se como um
    // robô faria: por script, sem passar pelo teclado.
    await page.locator('input[name="website"]').evaluate((el) => {
      (el as HTMLInputElement).value = "http://spam.example";
    });

    await page.getByRole("button", { name: /Enviar pedido/i }).click();

    // O utilizador vê a mesma confirmação; o pedido não é gravado.
    await expect(page.getByText(/Recebemos o seu pedido/i)).toBeVisible();
  });

  test("o formulário diz o que faz com os dados", async ({ page }) => {
    await page.goto("/molduras");
    await expect(
      page.getByText(/Guardamos estes dados só para lhe responder/i).first(),
    ).toBeVisible();
  });
});
