"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { exigirSessao, registar, sessaoActual } from "@/lib/auth";
import {
  apagarFicheiro,
  guardarFicheiro,
} from "@/lib/media/armazenamento";
import { chaveParaFicheiro } from "@/lib/media/r2";

const MAXIMO_BYTES = 25 * 1024 * 1024;

const TIPOS_ACEITES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "application/pdf",
];

export type ResultadoUpload =
  | {
      ok: true;
      id: string;
      chave: string;
      nome: string;
      tipoMime: string;
    }
  | { ok: false; erro: string };

/**
 * Recebe um ficheiro do backoffice, guarda-o (no R2 ou em disco,
 * conforme o ambiente) e cria o registo de media. Para imagens calcula largura, altura, cor média e um
 * placeholder de desfoque, para o site não saltar durante o carregamento.
 */
export async function carregarFicheiro(
  dados: FormData,
): Promise<ResultadoUpload> {
  await exigirSessao();

  const ficheiro = dados.get("ficheiro");
  if (!(ficheiro instanceof File) || ficheiro.size === 0) {
    return { ok: false, erro: "Nenhum ficheiro escolhido." };
  }
  if (ficheiro.size > MAXIMO_BYTES) {
    return { ok: false, erro: "O ficheiro passa dos 25 MB." };
  }
  if (!TIPOS_ACEITES.includes(ficheiro.type)) {
    return {
      ok: false,
      erro: "Formato não aceite. Use JPEG, PNG, WebP, AVIF, GIF ou PDF.",
    };
  }

  const pasta = ficheiro.type === "application/pdf" ? "documentos" : "imagens";
  const chave = chaveParaFicheiro(pasta, ficheiro.name);
  const bytes = Buffer.from(await ficheiro.arrayBuffer());

  let largura: number | null = null;
  let altura: number | null = null;
  let corDominante: string | null = null;
  let blur: string | null = null;

  if (ficheiro.type.startsWith("image/")) {
    try {
      const sharp = (await import("sharp")).default;
      const imagem = sharp(bytes, { failOn: "none" });
      const meta = await imagem.metadata();
      largura = meta.width ?? null;
      altura = meta.height ?? null;

      const { dominant } = await imagem.stats();
      corDominante = `#${[dominant.r, dominant.g, dominant.b]
        .map((c) => c.toString(16).padStart(2, "0"))
        .join("")}`;

      // Miniatura minúscula em base64: é o que o next/image usa como
      // placeholder desfocado enquanto a fotografia carrega.
      const pequena = await sharp(bytes, { failOn: "none" })
        .resize(16, 16, { fit: "inside" })
        .webp({ quality: 40 })
        .toBuffer();
      blur = `data:image/webp;base64,${pequena.toString("base64")}`;
    } catch (erro) {
      // Metadados são um extra: um ficheiro que o sharp não leia
      // continua a poder ser guardado.
      console.warn("[media] não foi possível analisar a imagem:", erro);
    }
  }

  try {
    await guardarFicheiro(chave, bytes, ficheiro.type);
  } catch (erro) {
    console.error("[media] falhou o envio:", erro);
    return { ok: false, erro: "Não foi possível guardar o ficheiro." };
  }

  const [linha] = await db
    .insert(media)
    .values({
      chave,
      nomeOriginal: ficheiro.name,
      tipoMime: ficheiro.type,
      tamanho: ficheiro.size,
      largura,
      altura,
      corDominante,
      blur,
      alt: { pt: "", en: null, es: null },
    })
    .returning();

  await registar(
    await sessaoActual(),
    "criou",
    "media",
    linha.id,
    ficheiro.name,
  );

  revalidatePath("/admin/media");

  return {
    ok: true,
    id: linha.id,
    chave: linha.chave,
    nome: linha.nomeOriginal,
    tipoMime: linha.tipoMime,
  };
}

/** Texto alternativo, editável na biblioteca de media. */
export async function guardarAlt(
  id: string,
  alt: { pt: string; en?: string | null; es?: string | null },
) {
  await exigirSessao();
  await db.update(media).set({ alt }).where(eq(media.id, id));
  revalidatePath("/admin/media");
  revalidatePath("/", "layout");
}

export async function apagarMedia(id: string) {
  const sessao = await exigirSessao();

  const [linha] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!linha) return;

  try {
    await apagarFicheiro(linha.chave);
  } catch (erro) {
    // Se o ficheiro já não existe, o registo deve sair na mesma.
    console.warn("[media] falhou a remoção do ficheiro:", erro);
  }

  await db.delete(media).where(eq(media.id, id));
  await registar(sessao, "apagou", "media", id, linha.nomeOriginal);

  revalidatePath("/admin/media");
  revalidatePath("/", "layout");
}

/** Últimos ficheiros carregados, para os selectores de imagem. */
export async function listarMedia(tipo?: "imagem" | "documento") {
  await exigirSessao();
  const linhas = await db
    .select()
    .from(media)
    .orderBy(desc(media.criadoEm))
    .limit(300);

  if (!tipo) return linhas;
  return linhas.filter((l) =>
    tipo === "documento"
      ? l.tipoMime === "application/pdf"
      : l.tipoMime.startsWith("image/"),
  );
}
