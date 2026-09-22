import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { lerFicheiroLocal, modoLocal } from "@/lib/media/armazenamento";

/**
 * Serve ficheiros de media.
 *
 * Com R2 configurado, lê do bucket. Sem R2, lê do disco, para o site
 * funcionar em desenvolvimento sem depender de uma conta na Cloudflare.
 * Assim que NEXT_PUBLIC_R2_PUBLIC_URL estiver definido, os endereços
 * deixam de passar por aqui e vão directos à CDN.
 */
/**
 * Um cliente só, e não um por pedido.
 *
 * Enquanto não houver `NEXT_PUBLIC_R2_PUBLIC_URL`, todas as imagens do
 * site passam por aqui, e cada `new S3Client` desfazia a ligação ao R2
 * e voltava a abri-la. Nasce à primeira vez que é preciso, para o site
 * continuar a arrancar sem credenciais nenhumas.
 */
let cliente: S3Client | null = null;

function clienteR2(): S3Client {
  cliente ??= new S3Client({
    region: "auto",
    endpoint: `https://${env.r2.conta}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2.chave,
      secretAccessKey: env.r2.segredo,
    },
  });
  return cliente;
}

/**
 * O que um ficheiro de media pode fazer no browser: nada.
 *
 * O carregamento do backoffice recusa SVG, por isso hoje não há aqui
 * nenhum. Mas esta rota serve o que estiver no armazenamento, e um SVG
 * que lá chegasse por outra via seria servido como `image/svg+xml` a
 * partir da origem do site, onde pode correr script. Uma política que
 * não permite nada torna isso inofensivo sem estragar imagem nenhuma:
 * uma fotografia não precisa de permissão para ser fotografia.
 */
const SEM_PODERES = "default-src 'none'; sandbox";

export async function GET(
  _pedido: Request,
  { params }: { params: Promise<{ chave: string[] }> },
) {
  const { chave } = await params;
  const caminho = chave.map(decodeURIComponent).join("/");

  // O prefixo do ambiente é obrigatório: impede que um caminho
  // construído à mão saia da área desta instalação.
  if (caminho.includes("..") || !/^(local|staging|producao)\//.test(caminho)) {
    return new NextResponse("Caminho inválido.", { status: 400 });
  }

  const cache = "public, max-age=31536000, immutable";

  if (modoLocal()) {
    const bytes = await lerFicheiroLocal(caminho);
    if (!bytes) return new NextResponse("Não encontrado.", { status: 404 });

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": tipoPorExtensao(caminho),
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": cache,
        "Content-Security-Policy": SEM_PODERES,
      },
    });
  }

  try {
    const objecto = await clienteR2().send(
      new GetObjectCommand({ Bucket: env.r2.bucket, Key: caminho }),
    );
    if (!objecto.Body) {
      return new NextResponse("Não encontrado.", { status: 404 });
    }

    return new NextResponse(objecto.Body.transformToWebStream(), {
      headers: {
        "Content-Type": objecto.ContentType ?? tipoPorExtensao(caminho),
        "Cache-Control": cache,
        "Content-Security-Policy": SEM_PODERES,
        ...(objecto.ContentLength
          ? { "Content-Length": String(objecto.ContentLength) }
          : {}),
      },
    });
  } catch {
    return new NextResponse("Não encontrado.", { status: 404 });
  }
}

function tipoPorExtensao(caminho: string): string {
  const ext = caminho.slice(caminho.lastIndexOf(".") + 1).toLowerCase();
  const mapa: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    avif: "image/avif",
    gif: "image/gif",
    svg: "image/svg+xml",
    pdf: "application/pdf",
  };
  return mapa[ext] ?? "application/octet-stream";
}
