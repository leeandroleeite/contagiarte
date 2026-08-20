import { expect, type Page } from "@playwright/test";

export const ADMIN_EMAIL = "galeria@contagiarte.pt";
export const ADMIN_PALAVRA_PASSE =
  process.env.E2E_ADMIN_PASSWORD ?? "teste-e2e-12345";

/** Entra no backoffice e deixa a página no painel. */
export async function entrarNoBackoffice(page: Page) {
  await page.goto("/admin/entrar");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Palavra-passe").fill(ADMIN_PALAVRA_PASSE);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/**
 * Falha se a página tiver scroll horizontal. É o defeito mais comum e
 * mais irritante num telemóvel, e não se vê num teste de conteúdo.
 */
export async function semScrollHorizontal(page: Page) {
  const medida = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    janela: window.innerWidth,
  }));
  expect(
    medida.scroll,
    `a página tem ${medida.scroll - medida.janela}px a mais do que a janela`,
  ).toBeLessThanOrEqual(medida.janela + 1);
}

/** Devolve a mensagem já descodificada de um link de WhatsApp. */
export async function mensagemWhatsApp(
  page: Page,
  seletor: string,
): Promise<{ numero: string; texto: string }> {
  const href = await page.locator(seletor).first().getAttribute("href");
  if (!href) throw new Error(`sem href em ${seletor}`);
  const url = new URL(href);
  return {
    numero: url.pathname.replace("/", ""),
    texto: url.searchParams.get("text") ?? "",
  };
}

/** Espera que a cortina de abertura saia da frente. */
export async function esperarCortina(page: Page) {
  await page
    .locator("text=CONTAGIARTE")
    .first()
    .waitFor({ state: "attached", timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(2800);
}
