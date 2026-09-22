import { expect, test } from "@playwright/test";
import { mensagemWhatsApp, semScrollHorizontal } from "./ajudas";

const NUMERO = "351914152451";

test.describe("Navegação e estrutura", () => {
  test("a homepage abre com o herói e a faixa em movimento", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /FOR THE NEXT GENERATION OF ART LOVERS/i,
        level: 1,
      }),
    ).toBeVisible();

    // A faixa existe e tem as quatro palavras da marca.
    await expect(page.getByText("DISRUPÇÃO", { exact: false }).first()).toBeAttached();

    await semScrollHorizontal(page);
  });

  test("a cortina de abertura aparece e sai da frente", async ({ page }) => {
    await page.goto("/");

    // Está no HTML servido, antes de qualquer JavaScript correr.
    const cortina = page.locator("[data-cortina]");
    await expect(cortina).toBeAttached();
    await expect(cortina).toBeVisible();

    // 0.9s parada mais 1.1s a subir. Continua no DOM: é um nó que o
    // React desenhou, e arrancá-lo partia a árvore do lado do cliente.
    await expect(cortina).toBeHidden({ timeout: 6000 });
    await expect(cortina).toBeAttached();
  });

  test("as páginas todas respondem", async ({ page }) => {
    const caminhos = [
      "/",
      "/exposicoes",
      "/exposicoes/a-pele-da-terra",
      "/exposicoes/a-pele-da-terra/percurso",
      "/obras",
      "/obras/wonder-frida",
      "/artistas",
      "/artistas/mario-ferreira",
      "/arquivo",
      "/lugares",
      "/molduras",
      "/a-galeria",
      "/descarregar",
      "/contactos",
      "/ver-na-parede",
      "/a-obra-como-ativo",
      "/privacidade",
    ];

    for (const caminho of caminhos) {
      const resposta = await page.goto(caminho);
      expect(resposta?.status(), `${caminho} devolveu erro`).toBe(200);
      await semScrollHorizontal(page);
    }
  });

  test("um endereço que não existe dá 404 com saídas", async ({ page }) => {
    const resposta = await page.goto("/isto-nao-existe");
    expect(resposta?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: /ESTA OBRA JÁ NÃO ESTÁ AQUI/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Voltar ao início/i }),
    ).toBeVisible();
  });

  test("o rodapé dá acesso às páginas que não estão na barra de topo", async ({
    page,
  }) => {
    await page.goto("/");
    const rodape = page.locator("footer");
    for (const nome of [
      "Ver na parede",
      "A obra como ativo",
      "Lugares",
      "A galeria",
    ]) {
      await expect(
        rodape.getByRole("link", { name: new RegExp(nome, "i") }),
      ).toBeAttached();
    }
  });
});

test.describe("Idiomas", () => {
  test("o português vive na raiz, e /pt manda para lá", async ({
    page,
    baseURL,
  }) => {
    // Ter `/pt` a responder não era só uma duplicação para os motores
    // de busca: a entrada aberta em `/pt` pedia os links do cabeçalho
    // cerca de oitocentas vezes por segundo, sem parar, porque o
    // router recebia uma árvore com outro caminho e nunca a guardava.
    const resposta = await page.goto("/pt/obras");
    expect(resposta?.status()).toBe(200);
    expect(page.url()).toBe(`${baseURL}/obras`);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${baseURL}/obras`,
    );

    // A raiz serve português sem prefixo nenhum, e não entra em ciclo.
    await page.goto("/obras");
    await expect(page.getByRole("heading", { name: "OBRAS" })).toBeVisible();
  });

  test("uma página aberta não fica a pedir coisas ao servidor", async ({
    page,
  }) => {
    let pedidos = 0;
    page.on("request", (r) => {
      if (r.url().includes("_rsc=")) pedidos++;
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    pedidos = 0;
    await page.waitForTimeout(2500);

    // Alguns prefetch são normais e bem-vindos. Centenas por segundo,
    // para sempre, é uma fuga: foi o que `/pt` fazia.
    expect(
      pedidos,
      `a entrada pediu ${pedidos} vezes em 2,5s sem ninguém lhe tocar`,
    ).toBeLessThan(30);
  });

  test("inglês e espanhol têm prefixo e traduzem o conteúdo", async ({
    page,
  }) => {
    await page.goto("/en/obras");
    await expect(page.getByRole("heading", { name: "WORKS" })).toBeVisible();

    await page.goto("/es/obras");
    await expect(page.getByRole("heading", { name: "OBRAS" })).toBeVisible();
  });

  test("a página declara alternativos para os três idiomas", async ({
    page,
  }) => {
    await page.goto("/obras");
    for (const lang of ["pt-PT", "en", "es"]) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${lang}"]`),
      ).toBeAttached();
    }
  });
});

test.describe("Obras", () => {
  test("a lista filtra por artista", async ({ page }) => {
    await page.goto("/obras");
    const antes = await page.locator("main ul > li").count();
    expect(antes).toBeGreaterThan(0);

    await page.goto("/obras?artista=pant");
    const depois = await page.locator("main ul > li").count();
    expect(depois).toBeGreaterThan(0);
    expect(depois).toBeLessThan(antes);
  });

  test("a ficha da obra tem a ficha técnica e o contacto certo", async ({
    page,
  }) => {
    await page.goto("/obras/wonder-frida");

    await expect(
      page.getByRole("heading", { name: "Wonder Frida", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Técnica mista sobre tela")).toBeVisible();
    await expect(page.getByText("100 × 100 cm")).toBeVisible();
    await expect(page.getByText("2024")).toBeVisible();
    await expect(page.getByText("Sob consulta")).toBeVisible();

    const { numero, texto } = await mensagemWhatsApp(
      page,
      'a[href*="wa.me"][href*="interesse"]',
    );
    expect(numero).toBe(NUMERO);
    expect(texto).toContain("Wonder Frida");
    // O nome do artista tem de sair em caixa natural na mensagem.
    expect(texto).toContain("Mário Ferreira");
    expect(texto).not.toContain("MÁRIO FERREIRA");
  });

  test("a obra liga ao artista e à exposição", async ({ page }) => {
    await page.goto("/obras/wonder-frida");
    await expect(
      page.getByRole("link", { name: /Mário Ferreira/i }).first(),
    ).toHaveAttribute("href", "/artistas/mario-ferreira");
    await expect(
      page.getByRole("link", { name: /A Pele da Terra/i }).first(),
    ).toHaveAttribute("href", "/exposicoes/a-pele-da-terra");
  });
});

test.describe("Artistas e exposições", () => {
  test("a página do artista mostra biografia, citação e obras", async ({
    page,
  }) => {
    await page.goto("/artistas/mario-ferreira");

    await expect(
      page.getByRole("heading", { name: /MÁRIO FERREIRA/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/Artista plástico portuense/)).toBeVisible();
    await expect(page.getByText(/força silenciosa/)).toBeVisible();
    await expect(page.getByText("MÁRIO FERREIRA, SOBRE EXPOR NO DOURO")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Wonder Frida/i }).first(),
    ).toBeVisible();
  });

  test("a exposição mostra o texto curatorial e a ficha de visita", async ({
    page,
  }) => {
    await page.goto("/exposicoes/a-pele-da-terra");

    await expect(
      page.getByRole("heading", { name: /A PELE DA TERRA/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/No coração do Douro Vinhateiro/)).toBeVisible();
    await expect(
      page.getByText("Rua da Casa do Douro S/N, Favaios, Alijó", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(page.getByText(/Quarta a domingo/)).toBeVisible();
    await expect(page.getByText(/prova de vinhos/)).toBeVisible();
    await expect(page.getByText(/\+351 93 590 75 57/)).toBeVisible();

    // Os quatro artistas convidados estão listados.
    for (const nome of ["Mário Ferreira", "Ana+Betânia", "Vanessa Teodoro", "Pant."]) {
      await expect(page.getByText(nome, { exact: false }).first()).toBeVisible();
    }
  });

  test("o percurso da adega tem as quatro salas", async ({ page }) => {
    await page.goto("/exposicoes/a-pele-da-terra/percurso");
    await expect(
      page.getByRole("heading", { name: /O PERCURSO DA ADEGA/i, level: 1 }),
    ).toBeVisible();

    const lista = page.locator(".percurso-lista article");
    await expect(lista).toHaveCount(4);
    await expect(lista.first()).toContainText(/A CHEGADA/i);
  });
});

test.describe("Ver na parede", () => {
  test("a combinação escolhida entra na mensagem de WhatsApp", async ({
    page,
  }) => {
    await page.goto("/ver-na-parede");

    await expect(
      page.getByRole("heading", { name: /A OBRA NA SUA PAREDE/i }),
    ).toBeVisible();

    // Escolher a moldura de alumínio. A largura não se escolhe: a
    // Wonder Frida tem medidas na ficha e o cursor não existe para ela.
    await page.getByRole("button", { name: /Alumínio/i }).click();
    await page.waitForTimeout(300);

    const { numero, texto } = await mensagemWhatsApp(
      page,
      'a[href*="wa.me"][href*="experimentei"]',
    );
    expect(numero).toBe(NUMERO);
    // As medidas que a mensagem leva têm de ser as que estão no ecrã,
    // e não um número inventado por um cursor.
    const naLegenda = await page
      .getByText(/·.*× \d+ cm/)
      .first()
      .innerText();
    const medida = /(\d+) × (\d+) cm/.exec(naLegenda);
    expect(medida, `legenda sem medidas: ${naLegenda}`).not.toBeNull();
    expect(texto).toContain(`${medida![1]} × ${medida![2]} cm`);
    expect(texto).toContain("alumínio");
  });

  test("sem medidas na ficha, o tamanho diz-se escolhido", async ({ page }) => {
    await page.goto("/ver-na-parede");

    // A Egg não tem medidas na ficha, como 22 das 25 obras. Aí aparece
    // um cursor, e o número que dele sai não é o tamanho da peça: é o
    // que o visitante escolheu para a imaginar na parede. Sem o dizer,
    // a galeria recebia um número com ar de medida verdadeira.
    await page.getByRole("button", { name: "Egg", exact: true }).click();
    await expect(page.locator("#largura-obra")).toBeVisible();
    await expect(page.getByText(/ainda não estão na ficha/)).toBeVisible();

    const { texto } = await mensagemWhatsApp(
      page,
      'a[href*="wa.me"][href*="experimentei"]',
    );
    expect(texto).toContain("tamanho que escolhi para simular");
  });

  test("a fotografia da parede não é enviada para o servidor", async ({
    page,
  }) => {
    const envios: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST") envios.push(r.url());
    });

    await page.goto("/ver-na-parede");
    await page.setInputFiles('input[type="file"]', {
      name: "parede.png",
      mimeType: "image/png",
      // PNG mínimo de 1x1.
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
    await page.waitForTimeout(800);

    expect(envios, "a fotografia da parede não pode sair do navegador").toHaveLength(0);
  });
});
