import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

let cliente: S3Client | null = null;

function s3(): S3Client {
  if (cliente) return cliente;
  cliente = new S3Client({
    region: "auto",
    endpoint: `https://${env.r2.conta}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2.chave,
      secretAccessKey: env.r2.segredo,
    },
  });
  return cliente;
}

/** Nome de ficheiro seguro, sem acentos nem espaços. */
export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 120);
}

/**
 * Caminho do objecto no bucket. O prefixo separa ambientes para o
 * staging nunca escrever por cima dos ficheiros de produção.
 */
export function chaveParaFicheiro(pasta: string, nome: string): string {
  const carimbo = Date.now().toString(36);
  const aleatorio = Math.random().toString(36).slice(2, 8);
  return `${env.ambiente}/${pasta}/${carimbo}-${aleatorio}-${normalizarNome(nome)}`;
}

export async function guardar(
  chave: string,
  corpo: Buffer | Uint8Array,
  tipoMime: string,
): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: env.r2.bucket,
      Key: chave,
      Body: corpo,
      ContentType: tipoMime,
      // Os ficheiros são imutáveis: a chave muda sempre que se
      // substitui o conteúdo, por isso o cache pode ser longo.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function apagar(chave: string): Promise<void> {
  await s3().send(
    new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: chave }),
  );
}

/** URL temporário para ficheiros que não estejam num bucket público. */
export async function urlAssinado(chave: string, segundos = 900) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: env.r2.bucket, Key: chave }),
    { expiresIn: segundos },
  );
}
