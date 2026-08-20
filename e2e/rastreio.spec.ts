import { expect, test, type Page } from "@playwright/test";

/**
 * Rastreio recursivo do site.
 *
 * Parte da homepage, segue todos os links internos que encontrar, e
 * repete até não haver endereços novos. Confirma que nenhuma página
 * responde com erro, que nenhum link interno aponta para o vazio, e que
 * nenhuma página tem scroll horizontal.
 *
 * É o teste que apanha o que os testes escritos à mão não apanham: um
 * link esquecido para uma rota que já não existe, uma página órfã, um
 * endereço que ficou para trás depois de mudar um slug.
 */

const IGNORAR = [
  /^mailto:/,
  /^tel:/,
  /^https?:\/\/(?!127\.0\.0\.1|localhost)/, // sítios de outras pessoas
  /^\/api\//, // descargas e media: verificadas à parte
  /^\/admin/, // exige sessão, tem os seus próprios testes
  /^#/,
];

function eInterno(href: string): boolean {
  return !IGNORAR.some((r) => r.test(href));
}

/** Normaliza para comparar: sem âncora, sem barra final. */
function normalizar(href: string, base: string): string | null {
  try {
    const url = new URL(href, base);
    if (url.origin !== new URL(base).origin) return null;
    const caminho = url.pathname.replace(/\/$/, "") || "/";
    return caminho + url.search;
  } catch {
    return null;
  }
}

async function linksDaPagina(page: Page, base: string): Promise<string[]> {
  const brutos = await page.locator("a[href]").evaluateAll((els) =>
    els.map((e) => (e as HTMLAnchorElement).getAttribute("href") ?? ""),
  );
  const vistos = new Set<string>();
  for (const href of brutos) {
    if (!href || !eInterno(href)) continue;
    const norm = normalizar(href, base);
    if (norm) vistos.add(norm);
  }
  return [...vistos];
}

test.describe("Rastreio do site", () => {
  test("todos os links internos levam a páginas que existem", async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(300_000);

    const base = baseURL!;
    const porVisitar = ["/"];
    const visitados = new Set<string>();
    const problemas: string[] = [];
    const proveniencia = new Map<string, string>();

    // Um site desta dimensão não deve passar das poucas dezenas de
    // páginas. O limite existe só para o teste não correr para sempre
    // se algum dia aparecer uma armadilha de paginação.
    const LIMITE = 120;

    while (porVisitar.length > 0 && visitados.size < LIMITE) {
      const caminho = porVisitar.shift()!;
      if (visitados.has(caminho)) continue;
      visitados.add(caminho);

      const resposta = await page.goto(caminho, { waitUntil: "domcontentloaded" });
      const estado = resposta?.status() ?? 0;

      if (estado >= 400) {
        const veioDe = proveniencia.get(caminho) ?? "(início)";
        problemas.push(`${caminho} devolveu ${estado}, encontrado em ${veioDe}`);
        continue;
      }

      // Nenhuma página pode ficar sem título nem sem h1.
      const titulo = await page.title();
      expect(titulo, `${caminho} não tem título`).not.toBe("");

      const h1 = await page.locator("h1").count();
      if (h1 === 0) problemas.push(`${caminho} não tem h1`);
      if (h1 > 1) problemas.push(`${caminho} tem ${h1} elementos h1`);

      // Nem scroll lateral.
      const medida = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        janela: window.innerWidth,
      }));
      if (medida.scroll > medida.janela + 1) {
        problemas.push(
          `${caminho} tem ${medida.scroll - medida.janela}px de scroll lateral`,
        );
      }

      for (const seguinte of await linksDaPagina(page, base)) {
        if (!visitados.has(seguinte)) {
          if (!proveniencia.has(seguinte)) proveniencia.set(seguinte, caminho);
          porVisitar.push(seguinte);
        }
      }
    }

    console.log(`Rastreadas ${visitados.size} páginas:`);
    for (const p of [...visitados].sort()) console.log(`  ${p}`);

    expect(problemas, problemas.join("\n")).toEqual([]);
    // Se o rastreio só encontrou meia dúzia de páginas, alguma coisa
    // partiu a navegação.
    expect(visitados.size).toBeGreaterThan(14);
  });

  test("o rastreio chega às páginas em inglês e espanhol", async ({ page }) => {
    for (const prefixo of ["/en", "/es"]) {
      const resposta = await page.goto(prefixo);
      expect(resposta?.status(), `${prefixo} não abre`).toBe(200);

      const links = await page.locator("header a[href]").evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute("href") ?? ""),
      );
      // A navegação tem de manter o idioma escolhido.
      const internos = links.filter((h) => h.startsWith("/") && h !== "/");
      const noIdioma = internos.filter((h) => h.startsWith(`${prefixo}/`));
      expect(
        noIdioma.length,
        `os links do cabeçalho em ${prefixo} perdem o idioma`,
      ).toBeGreaterThan(3);
    }
  });

  test("voltar atrás no browser devolve o visitante ao sítio certo", async ({
    page,
  }) => {
    await page.goto("/");

    // Em ecrãs estreitos a navegação vive atrás do botão de menu.
    const menu = page.getByRole("button", { name: /Menu ☰/i });
    if (await menu.isVisible()) await menu.click();

    await page.getByRole("link", { name: "Obras", exact: true }).first().click();
    await expect(page).toHaveURL(/\/obras$/);

    const primeira = page.locator("main ul > li a").first();
    const destino = await primeira.getAttribute("href");
    await primeira.click();
    await expect(page).toHaveURL(new RegExp(`${destino}$`));

    await page.goBack();
    await expect(page).toHaveURL(/\/obras$/);
    await expect(page.getByRole("heading", { name: "OBRAS" })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /ART LOVERS/i }),
    ).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(/\/obras$/);
  });

  test("os descarregáveis por publicar não deixam links partidos", async ({
    page,
    request,
  }) => {
    await page.goto("/descarregar");

    const links = await page.locator('a[href^="/api/descarregar/"]').evaluateAll(
      (els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!),
    );

    for (const href of links) {
      const resposta = await request.get(href, { maxRedirects: 0 });
      // Ou encaminha para o ficheiro, ou não devia estar visível.
      expect(
        [302, 307].includes(resposta.status()),
        `${href} devolveu ${resposta.status()}: um cartão visível tem de descarregar`,
      ).toBe(true);
    }
  });
});
