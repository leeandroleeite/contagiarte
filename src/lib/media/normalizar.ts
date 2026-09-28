import sharp from "sharp";

/** O lado maior de uma fotografia guardada. O site nunca pede mais. */
export const LADO_MAXIMO = 2400;

export type ImagemNormalizada = {
  bytes: Buffer;
  tipoMime: string;
  /** O nome com a extensão do formato em que ficou. */
  nome: string;
  largura: number | null;
  altura: number | null;
};

/**
 * Prepara uma fotografia carregada no backoffice para ser guardada.
 *
 * O carregamento aceitava até 25 MB e guardava o ficheiro tal como
 * vinha. Uma fotografia de telemóvel ficava com 8 ou 12 MB, e cada
 * tamanho que o site gera para os visitantes partia desse original, na
 * máquina pequena da Fly. Pior: trazia nos metadados a localização GPS
 * de onde foi tirada, e ficava pública.
 *
 * Aqui:
 *  - roda conforme a orientação da câmara, e depois esquece-a;
 *  - reduz a 2400px de lado maior, sem nunca aumentar;
 *  - grava em JPEG de boa qualidade, ou em WebP quando há transparência;
 *  - não leva metadados nenhuns: nem GPS, nem câmara, nem data. Fica só
 *    o perfil de cor, para as cores não mudarem.
 *
 * Os GIF passam intactos, porque podem ser animados. Se a fotografia não
 * se deixar ler, guarda-se o original: um carregamento não falha por
 * causa disto.
 */
export async function normalizarImagem(
  bytes: Buffer,
  tipoMime: string,
  nome: string,
): Promise<ImagemNormalizada> {
  const original: ImagemNormalizada = {
    bytes,
    tipoMime,
    nome,
    largura: null,
    altura: null,
  };
  if (!tipoMime.startsWith("image/") || tipoMime === "image/gif") {
    return original;
  }

  try {
    const meta = await sharp(bytes, { failOn: "none" }).metadata();
    const transparente =
      Boolean(meta.hasAlpha) && tipoMime !== "image/jpeg";

    const base = sharp(bytes, { failOn: "none" })
      .rotate()
      .resize({
        width: LADO_MAXIMO,
        height: LADO_MAXIMO,
        fit: "inside",
        withoutEnlargement: true,
      })
      .keepIccProfile();

    const { data, info } = await (
      transparente
        ? base.webp({ quality: 88 })
        : base.jpeg({ quality: 84, mozjpeg: true, progressive: true })
    ).toBuffer({ resolveWithObject: true });

    const extensao = transparente ? "webp" : "jpg";
    return {
      bytes: data,
      tipoMime: transparente ? "image/webp" : "image/jpeg",
      nome: `${nome.replace(/\.[^.]+$/, "")}.${extensao}`,
      largura: info.width,
      altura: info.height,
    };
  } catch (erro) {
    console.warn("[media] não foi possível normalizar a imagem:", erro);
    return original;
  }
}
