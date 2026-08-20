import { expect, test, type Page } from "@playwright/test";

/**
 * Cliques a sério, com o tempo de um visitante real.
 *
 * Estes testes existem por causa de um defeito que passou despercebido:
 * a cortina de abertura arrancava do DOM um nó que o React tinha
 * desenhado, e a reconciliação seguinte rebentava com `removeChild`,
 * matando a árvore do lado do cliente. A partir daí nenhum link
 * navegava.
 *
 * Os testes de então não apanharam porque clicavam de imediato, antes
 * de a cortina sair. Uma pessoa lê a página primeiro. Por isso aqui
 * espera-se sempre que a abertura termine antes de clicar, e qualquer
 * erro por apanhar faz o teste falhar.
 */

const TEMPO_ABERTURA = 3000;

/** Liga a vigilância de erros. Tem de ser antes de navegar. */
function vigiarErros(page: Page) {
  const erros: string[] = [];
  page.on("pageerror", (e) => {
    // O WebKit dá como erro da página um prefetch RSC que ele próprio
    // cancelou porque entretanto se navegou para outro sítio. Ficou
    // verificado que, sem sair da página, esses mesmos pedidos
    // respondem todos 200: é ruído do navegador, não do site.
    if (/_rsc=.*access control checks/.test(e.message)) return;
    erros.push(`pageerror: ${e.message}`);
  });
  page.on("console", (m) => {
    if (m.type() === "error") {
      const texto = m.text();
      // O 404 de uma imagem que ainda não existe não é um defeito do
      // código; a fotografia é conteúdo por carregar.
      if (/favicon|404 \(Not Found\)/i.test(texto)) return;
      erros.push(`console: ${texto}`);
    }
  });
  return erros;
}

test.describe("Cliques com o tempo de quem lê", () => {
  test("a homepage não deixa erros por apanhar depois da abertura", async ({
    page,
  }) => {
    const erros = vigiarErros(page);

    await page.goto("/");
    await page.waitForTimeout(TEMPO_ABERTURA);

    expect(erros, erros.join("\n")).toEqual([]);
  });

  test("depois da cortina sair, os links do cabeçalho continuam a navegar", async ({
    page,
    isMobile,
  }) => {
    const erros = vigiarErros(page);

    await page.goto("/");
    // Deixa a abertura correr até ao fim, como uma pessoa deixaria.
    await page.waitForTimeout(TEMPO_ABERTURA);

    const abrirMenu = async () => {
      const menu = page.getByRole("button", { name: /Menu ☰/i });
      if (isMobile && (await menu.isVisible())) await menu.click();
    };

    for (const [nome, destino] of [
      ["Exposições", "/exposicoes"],
      ["Obras", "/obras"],
      ["Artistas", "/artistas"],
      ["Contactos", "/contactos"],
    ] as const) {
      await page.goto("/");
      await page.waitForTimeout(TEMPO_ABERTURA);
      await abrirMenu();

      await page
        .getByRole("link", { name: nome, exact: true })
        .first()
        .click();

      await expect(
        page,
        `clicar em ${nome} depois da abertura não navegou`,
      ).toHaveURL(new RegExp(`${destino}$`));
    }

    expect(erros, erros.join("\n")).toEqual([]);
  });

  test("a cortina fica no DOM depois de subir, só deixa de ocupar espaço", async ({
    page,
  }) => {
    await page.goto("/");

    const cortina = page.locator("[data-cortina]");
    await expect(cortina).toBeAttached();

    await page.waitForTimeout(TEMPO_ABERTURA);

    // Continua a pertencer ao React: arrancá-la partia a árvore.
    await expect(cortina).toBeAttached();
    await expect(cortina).toBeHidden();
  });

  test("clicar num cartão de obra abre a ficha", async ({ page }) => {
    const erros = vigiarErros(page);

    await page.goto("/");
    await page.waitForTimeout(TEMPO_ABERTURA);

    const cartao = page.locator('main a[href^="/obras/"]').first();
    const destino = await cartao.getAttribute("href");
    await cartao.scrollIntoViewIfNeeded();
    await cartao.click();

    await expect(page).toHaveURL(new RegExp(`${destino}$`));
    await expect(page.locator("h1")).toBeVisible();
    expect(erros, erros.join("\n")).toEqual([]);
  });

  test("navegar por várias páginas seguidas não parte nada", async ({
    page,
    isMobile,
  }) => {
    const erros = vigiarErros(page);

    await page.goto("/");
    await page.waitForTimeout(TEMPO_ABERTURA);

    const percurso = [
      { rodape: "Ver na parede", url: /\/ver-na-parede$/ },
      { rodape: "A obra como ativo", url: /\/a-obra-como-ativo$/ },
      { rodape: "Lugares", url: /\/lugares$/ },
      { rodape: "A galeria", url: /\/a-galeria$/ },
    ];

    for (const passo of percurso) {
      const link = page
        .locator("footer")
        .getByRole("link", { name: new RegExp(passo.rodape, "i") })
        .first();
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(page, `o rodapé não levou a ${passo.rodape}`).toHaveURL(
        passo.url,
      );
    }

    // E o selector de idioma continua a funcionar no fim de tudo.
    if (!isMobile) {
      await page.getByRole("link", { name: "en", exact: true }).click();
      await expect(page).toHaveURL(/\/en\//);
    }

    expect(erros, erros.join("\n")).toEqual([]);
  });
});
