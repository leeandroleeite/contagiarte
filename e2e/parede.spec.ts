import { expect, test } from "@playwright/test";

/**
 * O simulador de moldura, na parte que tem de estar certa.
 *
 * A auditoria de agosto de 2026 apanhou dois defeitos que nenhuma demo
 * rápida mostrava: escolher moldura encolhia a obra em vez de aumentar
 * o conjunto, e todas as obras apareciam quadradas porque a proporção
 * caía para 1 quando faltavam medidas. A medida errada seguia dentro da
 * mensagem de WhatsApp para a galeria.
 */

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHElEQVQI12P8//8/AzbAxIAHjEqOSo5KjkoSkgQAWm4EFaQ2s8sAAAAASUVORK5CYII=",
  "base64",
);

async function comParede(page: import("@playwright/test").Page) {
  await page.goto("/ver-na-parede");
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({ name: "parede.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText(/× \d+ cm/)).toBeVisible({ timeout: 15000 });
}

test("a moldura acrescenta-se por fora e não come a obra", async ({ page }) => {
  await comParede(page);

  const largura = async () =>
    page.evaluate(() => {
      const p = document.querySelector('[role="img"][aria-label*="parede"]');
      return +(p!.getBoundingClientRect().width).toFixed(1);
    });

  const sem = await largura();
  await page.getByRole("button", { name: /madeira/i }).click();
  await page.waitForTimeout(300);
  const com = await largura();

  expect(com, "o conjunto tem de crescer com a moldura").toBeGreaterThan(sem);
  await expect(page.getByText(/com moldura \d+ × \d+ cm/)).toBeVisible();
});

test("cada obra mantém a sua forma", async ({ page }) => {
  await comParede(page);

  const formas = await page.evaluate(async () => {
    const out: number[] = [];
    const bts = [...document.querySelectorAll("button[aria-pressed]")].filter(
      (b) => b.className.includes("aspect-square"),
    );
    for (const b of bts) {
      (b as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 250));
      const arte = document.querySelector('[role="img"] > div > div');
      const r = arte!.getBoundingClientRect();
      out.push(+(r.height / r.width).toFixed(2));
    }
    return out;
  });

  expect(
    new Set(formas).size,
    `todas com a mesma forma seria o defeito antigo: ${formas.join(", ")}`,
  ).toBeGreaterThan(1);
});

test("um ficheiro que não é imagem diz-se, em vez de dar ecrã preto", async ({
  page,
}) => {
  await page.goto("/ver-na-parede");
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "notas.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("isto não é uma fotografia"),
    });
  // O Next tem um anunciador de rotas que também é role=alert.
  await expect(
    page.getByRole("alert").filter({ hasText: /ficheiro|file|archivo/i }),
  ).toBeVisible({ timeout: 10000 });
});

test("o dedo pode deslizar a página por cima da pré-visualização", async ({
  page,
}) => {
  await comParede(page);
  const palco = await page.evaluate(() => {
    const p = document.querySelector('[class*="min-h-[260px]"]')!;
    const peca = p.querySelector('[role="img"]')!;
    return {
      palco: getComputedStyle(p).touchAction,
      peca: getComputedStyle(peca).touchAction,
    };
  });
  expect(palco.palco).not.toBe("none");
  expect(palco.peca).toBe("none");
});
