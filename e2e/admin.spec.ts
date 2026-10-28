import { expect, test } from "@playwright/test";
import {
  ADMIN_EMAIL,
  entrarNoBackoffice,
  maisOpcoesDaObra,
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
    await page.locator('input[name="dimensoes"]').fill("40 × 30 cm");
    await maisOpcoesDaObra(page);
    await page.locator('input[name="slug"]').fill(slug);
    await page.getByRole("button", { name: "Guardar e publicar" }).click();

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
    await page.getByRole("button", { name: "Guardar e publicar" }).click();
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
    await maisOpcoesDaObra(page);
    await page.locator('input[name="slug"]').fill(slug);
    // O estado por omissão é rascunho, e há um botão que o mantém.
    await page.getByRole("button", { name: "Guardar sem publicar" }).click();
    await expect(page.getByText("Obra guardada.")).toBeVisible();

    const resposta = await page.goto(`/obras/${slug}`);
    expect(resposta?.status(), "um rascunho não pode estar no ar").toBe(404);

    // Limpar.
    await page.goto("/admin/obras");
    await page.getByRole("link", { name: `Rascunho ${marca}` }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar obra/i }).click();
  });

  test("escrever no título muda a pré-visualização, a barra conta a alteração, e guardar publica", async ({
    page,
  }) => {
    await entrarNoBackoffice(page);

    const marca = Date.now().toString(36);
    const titulo = `Obra de teste ${marca}`;
    const novoTitulo = `Obra revista ${marca}`;
    const slug = `obra-de-teste-${marca}`;

    await page.goto("/admin/obras/novo");
    await page.locator('input[name="titulo.pt"]').fill(titulo);
    await maisOpcoesDaObra(page);
    await page.locator('input[name="slug"]').fill(slug);
    await page.getByRole("button", { name: "Guardar e publicar" }).click();
    await expect(page.getByText("Obra guardada.")).toBeVisible();

    await page.getByRole("link", { name: titulo }).click();
    const previa = page.getByRole("complementary", {
      name: "Pré-visualização da página da obra",
    });
    const barra = page.getByRole("status").filter({ hasText: /guardad|guardar/ });

    // Sem nada mexido, a barra sossega e a ficha é a do site.
    await expect(previa).toContainText(titulo);
    await expect(barra).toContainText("Tudo guardado");

    // Enquanto se escreve, a ficha muda e a barra diz o quê.
    await page.locator('input[name="titulo.pt"]').fill(novoTitulo);
    await expect(previa).toContainText(novoTitulo);
    await expect(barra).toContainText("1 alteração por guardar: Título");

    // Desfazer volta ao que estava.
    await page.getByRole("button", { name: "Desfazer" }).click();
    await expect(previa).toContainText(titulo);
    await expect(barra).toContainText("Tudo guardado");

    // A língua escolhe-se uma vez, e a ficha passa a ela.
    await page
      .getByRole("group", { name: "Língua a editar" })
      .getByRole("button", { name: /^en/i })
      .click();
    await expect(page.getByText(/Ainda sem tradução/)).toBeVisible();
    await expect(previa).toContainText(`/en/obras/${slug}`);
    await page.locator('input[name="titulo.en"]').fill(`${novoTitulo} EN`);
    await expect(previa).toContainText(`${novoTitulo} EN`);
    await expect(barra).toContainText("Título (EN)");
    await page
      .getByRole("group", { name: "Língua a editar" })
      .getByRole("button", { name: /^pt/i })
      .click();

    await page.locator('input[name="titulo.pt"]').fill(novoTitulo);
    await expect(barra).toContainText("2 alterações por guardar: Título, Título (EN)");
    await page.getByRole("button", { name: "Guardar e publicar" }).click();
    await expect(page.getByText("Obra guardada.")).toBeVisible();

    await page.goto(`/obras/${slug}`);
    await expect(
      page.getByRole("heading", { name: novoTitulo, level: 1 }),
    ).toBeVisible();
    await page.goto(`/en/obras/${slug}`);
    await expect(
      page.getByRole("heading", { name: `${novoTitulo} EN`, level: 1 }),
    ).toBeVisible();

    // Limpar.
    await page.goto("/admin/obras");
    await page.getByRole("link", { name: novoTitulo }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar obra/i }).click();
    await expect(page).toHaveURL(/\/admin\/obras$/);
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
  test("o cursor do destaque do título chega à entrada", async ({ page }) => {
    await entrarNoBackoffice(page);

    const definir = async (nivel: string) => {
      await page.goto("/admin/definicoes");
      await page
        .locator('input[name="inversaoHeroi"]')
        .fill(nivel);
      await page.getByRole("button", { name: /^Guardar$/ }).click();
      await expect(page.getByText("Definições guardadas.")).toBeVisible();
    };

    await page.goto("/admin/definicoes");
    const original = await page
      .locator('input[name="inversaoHeroi"]')
      .inputValue();

    const camada = () => page.locator('[data-camada="inversao"]');

    try {
      // Em zero o herói fica como foi desenhado, sem camada nenhuma.
      await definir("0");
      await page.goto("/");
      await expect(camada()).toHaveCount(0);

      await definir("70");
      await page.goto("/");
      await expect(camada()).toHaveCount(1);
      // O filtro é o que separa as letras da fotografia.
      await expect(camada()).toHaveCSS("filter", /brightness/);
    } finally {
      // Repõe sempre: um teste interrompido deixava a entrada com um
      // aspecto que ninguém escolheu.
      await definir(original);
    }

    await page.goto("/");
    if (original === "0") await expect(camada()).toHaveCount(0);
  });

  test("mudar o número de WhatsApp muda os links do site", async ({ page }) => {
    await entrarNoBackoffice(page);
    await page.goto("/admin/definicoes");

    const original = await page.locator('input[name="whatsapp"]').inputValue();
    const teste = "351999888777";

    const definir = async (numero: string) => {
      await page.goto("/admin/definicoes");
      await page.locator('input[name="whatsapp"]').fill(numero);
      await page.getByRole("button", { name: /^Guardar$/ }).click();
      await expect(page.getByText("Definições guardadas.")).toBeVisible();
    };

    try {
      await definir(teste);

      await page.goto("/contactos");
      const href = await page
        .locator('a[href*="wa.me"]')
        .first()
        .getAttribute("href");
      expect(href).toContain(teste);
    } finally {
      // Repõe sempre, mesmo que a verificação acima falhe. Sem isto,
      // um teste interrompido deixava o número de teste na base e
      // envenenava todos os testes seguintes.
      await definir(original);
    }

    await page.goto("/contactos");
    const reposto = await page
      .locator('a[href*="wa.me"]')
      .first()
      .getAttribute("href");
    expect(reposto).toContain(original);
  });

  test("editar um texto do site muda a página", async ({ page }) => {
    await entrarNoBackoffice(page);
    // A morada abre a página e o texto, como faz a procura do editor.
    const editor = "/admin/textos?pagina=lugares&texto=lugares.intro";
    await page.goto(editor);

    const campo = page.locator('[name="t.lugares.intro.pt"]').first();
    const original = await campo.inputValue();
    const novo = `Texto de teste ${Date.now().toString(36)}`;

    const definir = async (valor: string) => {
      await page.goto(editor);
      await page.locator('[name="t.lugares.intro.pt"]').first().fill(valor);
      await page.getByRole("button", { name: /^Guardar e publicar$/ }).click();
      await expect(page.getByText("Textos guardados.")).toBeVisible();
    };

    try {
      await definir(novo);
      await page.goto("/lugares");
      await expect(page.getByText(novo)).toBeVisible();
    } finally {
      await definir(original);
    }
  });

  test("clicar num texto dentro da página abre-o no painel", async ({
    page,
  }) => {
    await entrarNoBackoffice(page);
    await page.goto("/admin/textos?pagina=lugares");

    const painel = page.getByRole("complementary", {
      name: "Editar o texto escolhido",
    });
    const site = page.frameLocator('iframe[title^="Página Lugares"]');
    const marcado = site.locator('[data-texto-chave="lugares.intro"]');

    // A frase está na página, com o contorno de quem se pode editar.
    await expect(marcado).toBeVisible();
    const original = (await marcado.innerText()).trim();
    await marcado.click();

    // O painel diz o nome em linguagem de gente, não a chave.
    await expect(
      painel.getByText("Frase de abertura", { exact: true }),
    ).toBeVisible();
    const campo = painel.locator('[name="t.lugares.intro.pt"]');
    await expect(campo).toHaveValue(original);
    await expect(marcado).toHaveAttribute("data-texto-escolhido", "");

    // Escrever muda a página ao lado antes de guardar...
    const novo = `Ainda por guardar ${Date.now().toString(36)}`;
    await campo.fill(novo);
    await expect(marcado).toHaveText(novo);

    // ...e voltar ao original desfaz, sem nada ter ido para o site.
    await painel.getByRole("button", { name: "Voltar ao original" }).click();
    await expect(campo).toHaveValue(original);
    await expect(marcado).toHaveText(original);
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
