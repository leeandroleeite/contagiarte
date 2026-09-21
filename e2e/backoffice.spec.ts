import { expect, test, type Page } from "@playwright/test";
import { entrarNoBackoffice } from "./ajudas";

/**
 * O backoffice a sério, secção a secção.
 *
 * Cada teste faz o percurso completo de quem gere a galeria: criar,
 * carregar uma fotografia, traduzir, publicar, confirmar no site, e
 * apagar. Se alguma destas coisas falhar em produção, a galeria fica
 * outra vez dependente de um programador, que é precisamente o que
 * este backoffice existe para evitar.
 */

/** PNG de 4x4, suficiente para exercitar todo o caminho do upload. */
const PNG_TESTE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHElEQVQI12P8//8/AzbAxIAHjEqOSo5KjkoSkgQAWm4EFaQ2s8sAAAAASUVORK5CYII=",
  "base64",
);

const marca = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

/** Carrega um ficheiro no campo de media de um formulário. */
async function carregarImagem(page: Page, nome = `teste-${marca()}.png`) {
  await page
    .locator('input[type="file"][accept*="image"]')
    .first()
    .setInputFiles({ name: nome, mimeType: "image/png", buffer: PNG_TESTE });

  // O carregamento é uma server action: espera-se pelo nome do ficheiro.
  await expect(page.getByText(nome)).toBeVisible({ timeout: 20000 });
  return nome;
}

async function guardar(page: Page) {
  await page.getByRole("button", { name: /^Guardar$/ }).click();
}

/** Muda o separador de idioma de um campo traduzível concreto. */
async function idiomaDoCampo(page: Page, campo: string, idioma: string) {
  await page
    .locator(`[data-campo="${campo}"]`)
    .getByRole("button", { name: idioma, exact: true })
    .click();
}

test.describe("Media", () => {
  test("carregar, dar texto alternativo e apagar uma imagem", async ({
    page,
  }) => {
    await entrarNoBackoffice(page);
    await page.goto("/admin/media");

    // O total que a página anuncia, que é o da base e não o da página
    // visível: a mediateca mostra sessenta de cada vez.
    const contagem = async () =>
      Number(
        /(\d+) ficheiro/.exec(await page.locator("main form").innerText())?.[1] ??
          "0",
      );
    const antes = await contagem();
    const nome = `media-${marca()}.png`;

    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({ name: nome, mimeType: "image/png", buffer: PNG_TESTE });

    await expect(page.getByText(nome)).toBeVisible({ timeout: 20000 });
    expect(await contagem()).toBe(antes + 1);

    // O cartão da imagem nova é o primeiro: a lista vem por data.
    const cartao = page.locator("main li").filter({ hasText: nome });
    const alt = `Descrição de teste ${marca()}`;
    await cartao.locator('input[id^="alt-"]').fill(alt);
    await cartao.getByRole("button", { name: /^Guardar$/ }).click();
    await expect(cartao.getByText("guardado")).toBeVisible();

    // Recarregar confirma que ficou gravado, e não só no ecrã.
    await page.reload();
    await expect(
      page.locator("main li").filter({ hasText: nome }).locator("input"),
    ).toHaveValue(alt);

    page.once("dialog", (d) => d.accept());
    await page
      .locator("main li")
      .filter({ hasText: nome })
      .getByRole("button", { name: "Apagar" })
      .click();

    await expect(page.getByText(nome)).toHaveCount(0, { timeout: 15000 });
  });

  test("a mediateca diz onde é que cada ficheiro está a ser usado", async ({
    page,
  }) => {
    await entrarNoBackoffice(page);

    const m = marca();
    const titulo = `Obra de teste ${m}`;
    const slug = `obra-de-teste-${m}`;

    await page.goto("/admin/obras/novo");
    await page.locator('input[name="titulo.pt"]').fill(titulo);
    await page.locator('input[name="slug"]').fill(slug);
    const nome = await carregarImagem(page);
    await guardar(page);
    await expect(page.getByText("Obra guardada.")).toBeVisible();

    // O cartão da imagem passa a dizer a que obra pertence. Sem isto,
    // apagar da mediateca era às cegas.
    await page.goto("/admin/media");
    const cartao = page.locator("main li").filter({ hasText: nome });
    await expect(cartao).toContainText(titulo);

    // E a obra apagada devolve-a ao monte das que ninguém usa.
    await page.goto("/admin/obras");
    await page.getByRole("link", { name: titulo }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar obra/i }).click();
    await expect(page).toHaveURL(/\/admin\/obras$/);

    await page.goto("/admin/media");
    await expect(
      page.locator("main li").filter({ hasText: nome }),
    ).toContainText("Não está a ser usado");

    page.once("dialog", (d) => d.accept());
    await page
      .locator("main li")
      .filter({ hasText: nome })
      .getByRole("button", { name: "Apagar" })
      .click();
    await expect(page.getByText(nome)).toHaveCount(0, { timeout: 15000 });
  });
});

test.describe("Obras", () => {
  test("criar com fotografia, ver no site, trocar a fotografia e apagar", async ({
    page,
  }) => {
    await entrarNoBackoffice(page);

    const m = marca();
    const titulo = `Obra de teste ${m}`;
    const slug = `obra-de-teste-${m}`;

    await page.goto("/admin/obras/novo");
    await page.locator('input[name="titulo.pt"]').fill(titulo);
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('input[name="dimensoes"]').fill("30 × 20 cm");
    await page.locator('input[name="larguraCm"]').fill("30");
    await page.locator('input[name="alturaCm"]').fill("20");
    await page.locator('select[name="estado"]').selectOption("publicado");

    const primeira = await carregarImagem(page);
    await guardar(page);
    await expect(page.getByText("Obra guardada.")).toBeVisible();

    // --- no site, com a fotografia ---
    await page.goto(`/obras/${slug}`);
    await expect(page.getByRole("heading", { name: titulo })).toBeVisible();
    await expect(page.locator("main img").first()).toBeVisible();
    const src1 = await page.locator("main img").first().getAttribute("src");
    expect(src1).toContain("_next/image");

    // --- trocar a fotografia ---
    await page.goto("/admin/obras");
    await page.getByRole("link", { name: titulo }).click();
    await expect(page.getByText(primeira)).toBeVisible();
    const segunda = await carregarImagem(page);
    expect(segunda).not.toBe(primeira);
    await guardar(page);
    await expect(page.getByText("Obra guardada.")).toBeVisible();

    await page.goto(`/obras/${slug}`);
    const src2 = await page.locator("main img").first().getAttribute("src");
    expect(src2, "a fotografia devia ter mudado").not.toBe(src1);

    // --- limpar ---
    await page.goto("/admin/obras");
    await page.getByRole("link", { name: titulo }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar obra/i }).click();
    await expect(page).toHaveURL(/\/admin\/obras$/);
  });

  test("marcar como vendida tira os botões de contacto do site", async ({
    page,
  }) => {
    await entrarNoBackoffice(page);

    const m = marca();
    const slug = `obra-de-teste-${m}`;

    await page.goto("/admin/obras/novo");
    await page.locator('input[name="titulo.pt"]').fill(`Vendida ${m}`);
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('select[name="estado"]').selectOption("publicado");
    await page.locator('select[name="disponibilidade"]').selectOption("vendida");
    await guardar(page);
    await expect(page.getByText("Obra guardada.")).toBeVisible();

    await page.goto(`/obras/${slug}`);
    await expect(page.getByText("Vendida").first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Pedir preço por WhatsApp/i }),
    ).toHaveCount(0);

    await page.goto("/admin/obras");
    await page.getByRole("link", { name: `Vendida ${m}` }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar obra/i }).click();
  });
});

test.describe("Artistas", () => {
  test("criar com retrato e tradução, ver nos três idiomas, apagar", async ({
    page,
  }) => {
    await entrarNoBackoffice(page);

    const m = marca();
    const nome = `Artista Teste ${m}`;
    const slug = `artista-teste-${m}`;
    const notaPt = `Nota em português ${m}`;
    const notaEn = `Note in English ${m}`;

    await page.goto("/admin/artistas/novo");
    await page.locator('input[name="nome"]').fill(nome);
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('select[name="disciplina"]').selectOption("escultura");
    await page.locator('select[name="estado"]').selectOption("publicado");

    // Campo traduzível: o separador EN tem de guardar o seu próprio valor.
    await page.locator('[name="nota.pt"]').fill(notaPt);
    await idiomaDoCampo(page, "nota", "en");
    await page.locator('[name="nota.en"]').fill(notaEn);

    await carregarImagem(page);
    await guardar(page);
    await expect(page.getByText("Artista guardado.")).toBeVisible();

    // --- a ficha, com o retrato ---
    await page.goto(`/artistas/${slug}`);
    await expect(
      page.getByRole("heading", { name: new RegExp(nome, "i"), level: 1 }),
    ).toBeVisible();
    await expect(page.locator("main img").first()).toBeVisible();

    // --- a nota curta é a legenda da lista, não da ficha ---
    await page.goto("/artistas");
    await expect(
      page.getByRole("link", { name: new RegExp(nome, "i") }).first(),
    ).toBeVisible();
    await expect(page.getByText(notaPt).first()).toBeVisible();

    // --- em inglês sai a tradução ---
    await page.goto("/en/artistas");
    await expect(page.getByText(notaEn).first()).toBeVisible();

    // --- espanhol ficou por traduzir: cai para o português ---
    await page.goto("/es/artistas");
    await expect(page.getByText(notaPt).first()).toBeVisible();

    await page.goto("/admin/artistas");
    const cartao = page.locator("main li").filter({ hasText: nome });
    await cartao.getByRole("link", { name: "Editar →" }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar artista/i }).click();
    await expect(page).toHaveURL(/\/admin\/artistas$/);
  });
});

test.describe("Exposições", () => {
  test("criar, associar artistas e obras, e ver na página", async ({ page }) => {
    await entrarNoBackoffice(page);

    const m = marca();
    const titulo = `Exposição de teste ${m}`;
    const slug = `exposicao-teste-${m}`;

    await page.goto("/admin/exposicoes/novo");
    await page.locator('input[name="titulo.pt"]').fill(titulo);
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('input[name="dataInicio"]').fill("2026-01-01");
    await page.locator('input[name="dataFim"]').fill("2026-06-30");
    await page.locator('input[name="curadoria"]').fill("Curadoria de teste");
    await page
      .locator('[name="texto.pt"]')
      .fill("Primeiro parágrafo do texto.\n\nSegundo parágrafo do texto.");
    await page.locator('[name="horario.pt"]').fill("Todos os dias, das 10h às 18h.");
    await page.locator('select[name="lugarId"]').selectOption({ index: 1 });
    await page.locator('select[name="estado"]').selectOption("publicado");

    // Associar os dois primeiros artistas.
    const caixas = page.locator('input[name="artistas"]');
    await caixas.nth(0).check();
    await caixas.nth(1).check();

    await carregarImagem(page);
    await guardar(page);
    await expect(page.getByText("Exposição guardada.")).toBeVisible();

    // --- na página, com tudo o que foi preenchido ---
    await page.goto(`/exposicoes/${slug}`);
    await expect(
      page.getByRole("heading", { name: new RegExp(titulo, "i"), level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Primeiro parágrafo do texto.")).toBeVisible();
    await expect(page.getByText("Segundo parágrafo do texto.")).toBeVisible();
    await expect(page.getByText("Todos os dias, das 10h às 18h.")).toBeVisible();
    await expect(page.getByText("Curadoria de teste")).toBeVisible();
    // Os dois artistas associados aparecem.
    expect(
      await page.locator('main a[href^="/artistas/"]').count(),
    ).toBeGreaterThanOrEqual(2);

    // --- e no arquivo ---
    await page.goto("/arquivo");
    await expect(page.getByText(titulo)).toBeVisible();

    await page.goto("/admin/exposicoes");
    await page.getByRole("link", { name: titulo }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar exposição/i }).click();
    await expect(page).toHaveURL(/\/admin\/exposicoes$/);
  });

  test("só uma exposição pode abrir a homepage", async ({ page }) => {
    await entrarNoBackoffice(page);

    const m = marca();
    const slug = `exposicao-teste-${m}`;

    await page.goto("/admin/exposicoes/novo");
    await page.locator('input[name="titulo.pt"]').fill(`Destaque ${m}`);
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('select[name="estado"]').selectOption("publicado");
    await page.locator('input[name="destaque"]').check();
    await guardar(page);
    await expect(page.getByText("Exposição guardada.")).toBeVisible();

    // A que estava em destaque deixou de estar.
    const destaques = await page
      .locator("main")
      .getByText("Na homepage")
      .count();
    expect(destaques, "só pode haver uma exposição em destaque").toBe(1);

    // Repor: A Pele da Terra volta a ser a da homepage.
    await page.goto("/admin/exposicoes");
    await page.getByRole("link", { name: `Destaque ${m}` }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar exposição/i }).click();

    await page.goto("/admin/exposicoes");
    await page.getByRole("link", { name: /A Pele da Terra/ }).click();
    await page.locator('input[name="destaque"]').check();
    await guardar(page);
    await expect(page.getByText("Exposição guardada.")).toBeVisible();
  });
});

test.describe("Lugares e percurso", () => {
  test("criar um lugar com fotografia e vê-lo na página", async ({ page }) => {
    await entrarNoBackoffice(page);

    const m = marca();
    const nome = `Lugar de teste ${m}`;
    const slug = `lugar-teste-${m}`;

    await page.goto("/admin/lugares/novo");
    await page.locator('input[name="nome"]').fill(nome);
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('[name="localidade.pt"]').fill("Porto");
    await page.locator('[name="tipo.pt"]').fill("espaço de teste");
    await page.locator('select[name="estado"]').selectOption("publicado");
    await carregarImagem(page);
    await guardar(page);
    await expect(page.getByText("Lugar guardado.")).toBeVisible();

    await page.goto("/lugares");
    await expect(page.getByText(nome.toUpperCase())).toBeVisible();
    await expect(page.getByText("espaço de teste")).toBeVisible();

    await page.goto("/admin/lugares");
    await page
      .locator("main li")
      .filter({ hasText: nome })
      .getByRole("link", { name: "Editar" })
      .click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar lugar/i }).click();
  });

  test("acrescentar uma sala ao percurso muda a página", async ({ page }) => {
    await entrarNoBackoffice(page);
    await page.goto("/admin/percurso");

    const m = marca();
    const nome = `Sala de teste ${m}`;

    // Quantas etapas tem o percurso antes de mexer.
    await page.goto("/exposicoes/a-pele-da-terra/percurso");
    const etapasAntes = Number(
      await page.locator(".percurso").getAttribute("data-etapas"),
    );
    await page.goto("/admin/percurso");

    // O último formulário da página é o de acrescentar.
    const novo = page.locator("main section").last();
    await novo.locator('[name="nome.pt"]').fill(nome);
    await novo.locator('[name="texto.pt"]').fill("Texto da sala de teste.");
    await novo.locator('input[name="ordem"]').fill("99");
    await novo.getByRole("button", { name: /^Guardar$/ }).click();

    await expect(page.getByText(nome)).toBeVisible();

    // No percurso, a sala nova é a última: entra no palco e no contador,
    // mas só se vê depois de descer. Confirma-se que está lá e que o
    // percurso passou a ter mais uma etapa.
    await page.goto("/exposicoes/a-pele-da-terra/percurso");
    await expect(page.getByText(nome, { exact: false }).first()).toBeAttached();
    await expect(page.locator(".percurso")).toHaveAttribute(
      "data-etapas",
      String(etapasAntes + 1),
    );

    // Limpar.
    await page.goto("/admin/percurso");
    const seccao = page.locator("main section").filter({ hasText: nome }).first();
    page.once("dialog", (d) => d.accept());
    await seccao.getByRole("button", { name: /Apagar sala/i }).click();
    await expect(page.getByText(nome)).toHaveCount(0);
  });
});

test.describe("Descarregáveis", () => {
  test("um PDF carregado fica descarregável no site", async ({
    page,
    request,
  }) => {
    await entrarNoBackoffice(page);

    const m = marca();
    const nome = `Documento de teste ${m}`;
    const slug = `documento-teste-${m}`;

    await page.goto("/admin/descarregaveis/novo");
    await page.locator('[name="nome.pt"]').fill(nome);
    await page.locator('input[name="slug"]').fill(slug);
    await page.locator('[name="descricao.pt"]').fill("PDF de teste");
    await page.locator('select[name="estado"]').selectOption("publicado");

    const ficheiro = `teste-${m}.pdf`;
    await page
      .locator('input[type="file"][accept*="pdf"]')
      .setInputFiles({
        name: ficheiro,
        mimeType: "application/pdf",
        // PDF mínimo válido.
        buffer: Buffer.from(
          "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
          "utf8",
        ),
      });
    await expect(page.getByText(ficheiro)).toBeVisible({ timeout: 20000 });

    await guardar(page);
    await expect(page).toHaveURL(/\/admin\/descarregaveis$/);
    await expect(page.getByRole("link", { name: nome })).toBeVisible();

    // --- no site ---
    await page.goto("/descarregar");
    await expect(page.getByText(nome)).toBeVisible();

    const resposta = await request.get(`/api/descarregar/${slug}`, {
      maxRedirects: 0,
    });
    expect([302, 307]).toContain(resposta.status());

    // Limpar.
    await page.goto("/admin/descarregaveis");
    await page.getByRole("link", { name: nome }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Apagar documento/i }).click();
  });
});

test.describe("Textos e traduções", () => {
  test("traduzir um texto para inglês só muda a versão inglesa", async ({
    page,
  }) => {
    await entrarNoBackoffice(page);
    await page.goto("/admin/textos");

    const campoPt = page.locator('[name="t.lugares.intro.pt"]').first();
    const originalPt = await campoPt.inputValue();
    const novoEn = `Test intro ${marca()}`;

    try {
      await idiomaDoCampo(page, "t.lugares.intro", "en");
      await page.locator('[name="t.lugares.intro.en"]').first().fill(novoEn);
      await guardar(page);
      await expect(page.getByText("Textos guardados.")).toBeVisible();

      await page.goto("/en/lugares");
      await expect(page.getByText(novoEn)).toBeVisible();

      // O português não foi tocado.
      await page.goto("/lugares");
      await expect(page.getByText(originalPt)).toBeVisible();
    } finally {
      await page.goto("/admin/textos");
      await idiomaDoCampo(page, "t.lugares.intro", "en");
      await page.locator('[name="t.lugares.intro.en"]').first().fill("");
      await guardar(page);
      await expect(page.getByText("Textos guardados.")).toBeVisible();
    }
  });
});

test.describe("Utilizadores e permissões", () => {
  test("um editor não chega à gestão de utilizadores", async ({
    page,
    browser,
  }) => {
    await entrarNoBackoffice(page);
    await page.goto("/admin/utilizadores");

    const m = marca();
    const email = `editor-${m}@exemplo.pt`;
    const palavraPasse = `palavra-passe-de-teste-${m}`;

    await page.locator('input[name="nome"]').fill(`Editor ${m}`);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="palavraPasse"]').fill(palavraPasse);
    await page.locator('select[name="papel"]').selectOption("editor");
    await guardar(page);
    await expect(page.getByText("Utilizador guardado.")).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    // Numa sessão limpa, o editor entra mas não vê utilizadores.
    const contexto = await browser.newContext();
    const doEditor = await contexto.newPage();
    await doEditor.goto("/admin/entrar");
    await doEditor.getByLabel("Email").fill(email);
    await doEditor.getByLabel("Palavra-passe").fill(palavraPasse);
    await doEditor.getByRole("button", { name: "Entrar" }).click();
    await expect(doEditor).toHaveURL(/\/admin$/);

    // A secção não aparece na navegação...
    await expect(
      doEditor.getByRole("link", { name: "Utilizadores" }),
    ).toHaveCount(0);

    // ...e escrever o endereço à mão também não serve.
    await doEditor.goto("/admin/utilizadores");
    await expect(doEditor).not.toHaveURL(/\/admin\/utilizadores$/);

    // Mas continua a poder tratar do conteúdo, que é o seu trabalho.
    await doEditor.goto("/admin/obras");
    await expect(
      doEditor.getByRole("heading", { name: "Obras", level: 1 }),
    ).toBeVisible();

    await contexto.close();

    // Limpar.
    await page.goto("/admin/utilizadores");
    page.once("dialog", (d) => d.accept());
    await page
      .locator("main .grid")
      .filter({ hasText: email })
      .getByRole("button", { name: "Apagar" })
      .click();
    await expect(page.getByText(email)).toHaveCount(0);
  });
});
