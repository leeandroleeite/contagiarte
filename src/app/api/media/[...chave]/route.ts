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
      },
    });
  }

  const cliente = new S3Client({
    region: "auto",
    endpoint: `https://${env.r2.conta}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2.chave,
      secretAccessKey: env.r2.segredo,
    },
  });

  try {
    const objecto = await cliente.send(
      new GetObjectCommand({ Bucket: env.r2.bucket, Key: caminho }),
    );
    if (!objecto.Body) {
      return new NextResponse("Não encontrado.", { status: 404 });
    }

    return new NextResponse(objecto.Body.transformToWebStream(), {
      headers: {
        "Content-Type": objecto.ContentType ?? tipoPorExtensao(caminho),
        "Cache-Control": cache,
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
