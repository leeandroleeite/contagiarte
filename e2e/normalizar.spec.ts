import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { LADO_MAXIMO, normalizarImagem } from "../src/lib/media/normalizar";

/**
 * O que o backoffice faz a uma fotografia antes de a guardar. Sem
 * browser: é a função, com imagens feitas aqui, como as de um telemóvel.
 */
test.describe("normalizar fotografias carregadas", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop", "basta uma vez");
  });

  test("uma fotografia de telemóvel fica reduzida, direita e sem GPS", async () => {
    // 4000x3000 deitada, com a câmara a dizer "roda 90°" e a posição GPS.
    const telemovel = await sharp({
      create: { width: 4000, height: 3000, channels: 3, background: "#8a6636" },
    })
      .jpeg({ quality: 95 })
      .withExif({
        IFD0: { Make: "Telemovel", Model: "Teste" },
        IFD3: {
          GPSLatitudeRef: "N",
          GPSLatitude: "41/1 9/1 0/1",
          GPSLongitudeRef: "W",
          GPSLongitude: "8/1 36/1 0/1",
        },
      })
      // A orientação não entra pelo withExif: o sharp guarda-a à parte.
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const origem = await sharp(telemovel).metadata();
    expect(origem.exif).toBeTruthy();
    expect(origem.orientation).toBe(6);

    const r = await normalizarImagem(telemovel, "image/jpeg", "IMG_0001.JPG");
    const meta = await sharp(r.bytes).metadata();

    expect(r.tipoMime).toBe("image/jpeg");
    expect(r.nome).toBe("IMG_0001.jpg");
    // Rodada: fica de pé, com o lado maior no limite.
    expect([meta.width, meta.height]).toEqual([1800, LADO_MAXIMO]);
    expect([r.largura, r.altura]).toEqual([1800, LADO_MAXIMO]);
    // Sem EXIF nenhum: nem GPS, nem câmara, nem orientação.
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
    expect(r.bytes.length).toBeLessThan(telemovel.length);
  });

  test("uma imagem pequena não é aumentada", async () => {
    const pequena = await sharp({
      create: { width: 800, height: 600, channels: 3, background: "#0e0c0b" },
    })
      .png()
      .toBuffer();
    const r = await normalizarImagem(pequena, "image/png", "logo.png");
    expect([r.largura, r.altura]).toEqual([800, 600]);
    expect(r.tipoMime).toBe("image/jpeg");
  });

  test("a transparência não se perde: fica WebP", async () => {
    const recorte = await sharp({
      create: {
        width: 3000,
        height: 3000,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();
    const r = await normalizarImagem(recorte, "image/png", "recorte.png");
    const meta = await sharp(r.bytes).metadata();
    expect(r.tipoMime).toBe("image/webp");
    expect(r.nome).toBe("recorte.webp");
    expect(meta.hasAlpha).toBe(true);
    expect(meta.width).toBe(LADO_MAXIMO);
  });

  test("os GIF e os PDF passam intactos", async () => {
    const gif = await sharp({
      create: { width: 3000, height: 100, channels: 3, background: "#b4884a" },
    })
      .gif()
      .toBuffer();
    const r = await normalizarImagem(gif, "image/gif", "animado.gif");
    expect(r.bytes).toBe(gif);

    const pdf = Buffer.from("%PDF-1.4\n%%EOF\n");
    expect((await normalizarImagem(pdf, "application/pdf", "c.pdf")).bytes).toBe(pdf);
  });

  test("um ficheiro que não se deixa ler é guardado como veio", async () => {
    const lixo = Buffer.from("isto não é uma fotografia");
    const r = await normalizarImagem(lixo, "image/jpeg", "estragada.jpg");
    expect(r.bytes).toBe(lixo);
    expect(r.nome).toBe("estragada.jpg");
  });
});
