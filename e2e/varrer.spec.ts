import { expect, test, type Page } from "@playwright/test";
import { entrarNoBackoffice, semScrollHorizontal } from "./ajudas";

/**
 * Abrir todas as páginas e contar o que ninguém pensou em testar.
 *
 * Os outros ficheiros provam comportamentos escolhidos, um a um. Este
 * é a outra metade: passa por tudo e falha se alguma página deixar um
 * erro na consola, pedir um ficheiro que não existe, ficar sem título
 * ou empurrar a página para o lado.
 *
 * Corre nos dois tamanhos, porque são dois projectos do Playwright.
 */

const PUBLICAS = [
  "/",
  "/exposicoes",
  "/obras",
  "/artistas",
  "/lugares",
  "/arquivo",
  "/molduras",
  "/descarregar",
  "/contactos",
  "/a-galeria",
  "/a-obra-como-ativo",
  "/privacidade",
  "/ver-na-parede",
];

const ADMIN = [
  "/admin",
  "/admin/obras",
  "/admin/artistas",
  "/admin/exposicoes",
  "/admin/lugares",
  "/admin/percurso",
  "/admin/textos",
  "/admin/descarregaveis",
  "/admin/media",
  "/admin/pedidos",
  "/admin/definicoes",
  "/admin/utilizadores",
];

/** Liga as escutas e devolve o que a página deixou cair. */
function vigiar(pagina: Page) {
  const consola: string[] = [];
  const rede: string[] = [];
  pagina.on("console", (m) => {
    if (m.type() === "error") consola.push(m.text().slice(0, 140));
  });
  pagina.on("pageerror", (e) => consola.push(`pageerror: ${String(e).slice(0, 140)}`));
  pagina.on("response", (r) => {
    // O 401 da parede de acesso não conta: em teste não está ligada,
    // e um 404 de favicon também não é defeito de conteúdo.
    if (r.status() >= 400 && !/favicon/.test(r.url())) {
      rede.push(`${r.status()} ${r.url().split("/").slice(3).join("/").slice(0, 70)}`);
    }
  });
  return { consola, rede };
}

async function conferir(pagina: Page, caminho: string) {
  const { consola, rede } = vigiar(pagina);
  const resposta = await pagina.goto(caminho, { waitUntil: "domcontentloaded" });

  expect(resposta?.status(), `${caminho} respondeu ${resposta?.status()}`).toBeLessThan(400);
  await expect(pagina).toHaveTitle(/.+/);

  const medidas = await pagina.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    semAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
    texto: document.body.innerText.trim().length,
  }));

  expect(medidas.h1, `${caminho} tem ${medidas.h1} títulos h1`).toBe(1);
  expect(medidas.semAlt, `${caminho} tem imagens sem alt`).toBe(0);
  expect(medidas.texto, `${caminho} veio quase vazia`).toBeGreaterThan(120);
  expect(consola, `${caminho} deixou erros na consola`).toEqual([]);
  expect(rede, `${caminho} pediu coisas que não existem`).toEqual([]);

  await semScrollHorizontal(pagina);
}

test.describe("Varrer o site", () => {
  for (const caminho of PUBLICAS) {
    test(`a página ${caminho} abre limpa`, async ({ page }) => {
      await conferir(page, caminho);
    });
  }

  test("um endereço que não existe dá 404 e não rebenta", async ({ page }) => {
    const { consola } = vigiar(page);
    const r = await page.goto("/nao-existe-de-certeza", { waitUntil: "domcontentloaded" });
    expect(r?.status()).toBe(404);

    // A página de erro é uma página como as outras: tem título, tem
    // texto, e leva o visitante de volta a algum sítio.
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main a, body a").first()).toBeVisible();

    // O browser regista o próprio 404 na consola, e isso é o esperado.
    // O que não pode haver é erro de código.
    const reais = consola.filter(
      (m) => !/status of 404|Failed to load resource/.test(m),
    );
    expect(reais, "a página de erro deixou erros de código").toEqual([]);
  });
});

test.describe("Varrer o backoffice", () => {
  test.skip(({ isMobile }) => Boolean(isMobile), "o backoffice tem projecto próprio");

  test("todas as páginas do backoffice abrem limpas", async ({ page }) => {
    await entrarNoBackoffice(page);
    for (const caminho of ADMIN) {
      await conferir(page, caminho);
    }
  });
});
