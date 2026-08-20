import { expect, test } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PALAVRA_PASSE,
  entrarNoBackoffice,
} from "./ajudas";

/**
 * O backoffice é a razão de existir da base de dados: se a galeria não
 * conseguir publicar sozinha, o site volta a depender de programador.
 * Estes testes seguem o percurso real: entrar, criar, ver no site,
 * alterar, apagar.
 */

test.describe("Acesso", () => {
  test("o backoffice não é acessível sem sessão", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/entrar/);
  });

  test("não há botão de login no site público", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /entrar|login|backoffice/i }),
    ).toHaveCount(0);
  });

  test("credenciais erradas são recusadas", async ({ page }) => {
    await page.goto("/admin/entrar");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Palavra-passe").fill("palavra-passe-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText(/Credenciais inválidas/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/entrar/);
  });

  test("entrar leva ao painel com o estado do site", async ({ page }) => {
    await entrarNoBackoffice(page);
    await expect(
      page.getByRole("heading", { name: "Painel", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Obras publicadas")).toBeVisible();
  });

  test("terminar sessão fecha o acesso", async ({ page }) => {
    await entrarNoBackoffice(page);
    await page.getByRole("button", { name: /Terminar sessão/i }).click();
    await expect(page).toHaveURL(/\/admin\/entrar/);

    await page.goto("/admin/obras");
    await expect(page).toHaveURL(/\/admin\/entrar/);
  });
});

test.describe("Gerir conteúdo", () => {
  test("criar uma obra publica-a no site, e apagá-la remove-a", async ({
    page,
  }) => {
    await entrarNoBackoffice(page);

    const marca = Date.now().toString(36);
    const titulo = `Obra de teste ${marca}`;
    const slug = `obra-de-teste-${marca}`;

    // --- criar ---
    await page.goto("/admin/obras/novo");
    await page.locator('input[name="titulo.pt"]').fill(titulo);
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('input[name="dimensoes"]').fill("40 × 30 cm");
    await page.locator('select[name="estado"]').selectOption("publicado");
    await page.getByRole("button", { name: /^Guardar$/ }).click();

    await expect(page).toHaveURL(/\/admin\/obras\?guardado=/);
    await expect(page.getByText("Obra guardada.")).toBeVisible();
    await expect(page.getByRole("link", { name: titulo })).toBeVisible();

    // --- aparece no site ---
    const resposta = await page.goto(`/obras/${slug}`);
    expect(resposta?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: titulo, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("40 × 30 cm")).toBeVisible();

    // --- alterar ---
    await page.goto("/admin/obras");
    await page.getByRole("link", { name: titulo }).click();
    await page.locator('input[name="dimensoes"]').fill("80 × 60 cm");
    await page.getByRole("button", { name: /^Guardar$/ }).click();
    await expect(page.getByText("Obra guardada.")).toBeVisible();

    await page.goto(`/obras/${slug}`);
    await expect(page.getByText("80 × 60 cm")).toBeVisible();

    // --- apagar ---
    await page.goto("/admin/obras");
    await page.getByRole("link", { name: titulo }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar obra/i }).click();
    await expect(page).toHaveURL(/\/admin\/obras$/);
    await expect(page.getByRole("link", { name: titulo })).toHaveCount(0);

    const depois = await page.goto(`/obras/${slug}`);
    expect(depois?.status()).toBe(404);
  });

  test("um rascunho não aparece no site", async ({ page }) => {
    await entrarNoBackoffice(page);

    const marca = Date.now().toString(36);
    const slug = `rascunho-${marca}`;

    await page.goto("/admin/obras/novo");
    await page.locator('input[name="titulo.pt"]').fill(`Rascunho ${marca}`);
    await page.locator('input[name="slug"]').fill(slug);
    // O estado por omissão é rascunho: não se toca.
    await page.getByRole("button", { name: /^Guardar$/ }).click();
    await expect(page.getByText("Obra guardada.")).toBeVisible();

    const resposta = await page.goto(`/obras/${slug}`);
    expect(resposta?.status(), "um rascunho não pode estar no ar").toBe(404);

    // Limpar.
    await page.goto("/admin/obras");
    await page.getByRole("link", { name: `Rascunho ${marca}` }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar obra/i }).click();
  });

  test("os filtros das obras funcionam", async ({ page }) => {
    await entrarNoBackoffice(page);
    await page.goto("/admin/obras");

    const linhas = () => page.locator('main a[href^="/admin/obras/"]');
    const total = await linhas().count();
    expect(total).toBeGreaterThan(0);

    await page.getByRole("link", { name: "Vendidas" }).click();
    await page.waitForURL(/filtro=vendida/);
    const vendidas = await linhas().count();

    expect(vendidas).toBeLessThan(total);

    await page.getByRole("link", { name: "Todas" }).click();
    await page.waitForURL(/\/admin\/obras$/);
    expect(await linhas().count()).toBe(total);
  });
});

test.describe("Definições e textos", () => {
  test("mudar o número de WhatsApp muda os links do site", async ({ page }) => {
    await entrarNoBackoffice(page);
    await page.goto("/admin/definicoes");

    const original = await page.locator('input[name="whatsapp"]').inputValue();
    const teste = "351999888777";

    await page.locator('input[name="whatsapp"]').fill(teste);
    await page.getByRole("button", { name: /^Guardar$/ }).click();
    await expect(page.getByText("Definições guardadas.")).toBeVisible();

    await page.goto("/contactos");
    const href = await page
      .locator('a[href*="wa.me"]')
      .first()
      .getAttribute("href");
    expect(href).toContain(teste);

    // Repor, para não deixar o ambiente estragado.
    await page.goto("/admin/definicoes");
    await page.locator('input[name="whatsapp"]').fill(original);
    await page.getByRole("button", { name: /^Guardar$/ }).click();
    await expect(page.getByText("Definições guardadas.")).toBeVisible();

    await page.goto("/contactos");
    const reposto = await page
      .locator('a[href*="wa.me"]')
      .first()
      .getAttribute("href");
    expect(reposto).toContain(original);
  });

  test("editar um texto do site muda a página", async ({ page }) => {
    await entrarNoBackoffice(page);
    await page.goto("/admin/textos");

    const campo = page.locator('[name="t.lugares.intro.pt"]').first();
    const original = await campo.inputValue();
    const novo = `Texto de teste ${Date.now().toString(36)}`;

    await campo.fill(novo);
    await page.getByRole("button", { name: /^Guardar$/ }).click();
    await expect(page.getByText("Textos guardados.")).toBeVisible();

    await page.goto("/lugares");
    await expect(page.getByText(novo)).toBeVisible();

    // Repor.
    await page.goto("/admin/textos");
    await page.locator('[name="t.lugares.intro.pt"]').first().fill(original);
    await page.getByRole("button", { name: /^Guardar$/ }).click();
    await expect(page.getByText("Textos guardados.")).toBeVisible();
  });
});

test.describe("Pedidos", () => {
  test("um pedido enviado pelo site aparece no backoffice", async ({ page }) => {
    const nome = `Visitante ${Date.now().toString(36)}`;

    await page.goto("/molduras");
    await page.getByPlaceholder("Nome").fill(nome);
    await page.getByPlaceholder(/Email ou telemóvel/i).fill("v@exemplo.pt");
    await page.getByPlaceholder(/Medidas/i).fill("50 × 40 cm");
    await page.getByRole("button", { name: /Enviar pedido/i }).click();
    await expect(page.getByText(/Recebemos o seu pedido/i)).toBeVisible();

    await entrarNoBackoffice(page);
    await page.goto("/admin/pedidos");
    await expect(page.getByText(nome)).toBeVisible();
    await expect(page.getByText("50 × 40 cm").first()).toBeVisible();
  });
});
