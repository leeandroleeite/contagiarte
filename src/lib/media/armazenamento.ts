import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";
import { apagar as apagarR2, guardar as guardarR2 } from "./r2";

/**
 * Onde os ficheiros ficam guardados.
 *
 * Com R2 configurado, vão para o bucket, que é o que acontece em
 * staging e em produção. Sem R2, ficam em `public/media`, para o site
 * poder ser visto e editado localmente sem depender de uma conta na
 * Cloudflare. Os endereços não mudam: em qualquer dos casos passam por
 * `/api/media/...` ou pelo domínio da CDN.
 */

const RAIZ_LOCAL = path.join(process.cwd(), "public", "media");

export function modoLocal(): boolean {
  return !env.r2.configurado;
}

/** Caminho no disco, com validação para não sair da pasta de media. */
function caminhoLocal(chave: string): string {
  const destino = path.join(RAIZ_LOCAL, chave);
  const normalizado = path.normalize(destino);
  if (!normalizado.startsWith(RAIZ_LOCAL)) {
    throw new Error(`Caminho de media inválido: ${chave}`);
  }
  return normalizado;
}

export async function guardarFicheiro(
  chave: string,
  corpo: Buffer,
  tipoMime: string,
): Promise<void> {
  if (!modoLocal()) {
    await guardarR2(chave, corpo, tipoMime);
    return;
  }
  const destino = caminhoLocal(chave);
  await fs.mkdir(path.dirname(destino), { recursive: true });
  await fs.writeFile(destino, corpo);
}

export async function apagarFicheiro(chave: string): Promise<void> {
  if (!modoLocal()) {
    await apagarR2(chave);
    return;
  }
  await fs.rm(caminhoLocal(chave), { force: true });
}

/** Lê um ficheiro guardado localmente. Devolve null se não existir. */
export async function lerFicheiroLocal(
  chave: string,
): Promise<Buffer | null> {
  try {
    return await fs.readFile(caminhoLocal(chave));
  } catch {
    return null;
  }
}
