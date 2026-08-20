import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * Serve ficheiros do R2 pela própria aplicação.
 *
 * É a alternativa a apontar um domínio ao bucket: funciona logo, mas
 * gasta CPU e largura de banda da app. Assim que NEXT_PUBLIC_R2_PUBLIC_URL
 * estiver definido, os endereços deixam de passar por aqui.
 */
export async function GET(
  _pedido: Request,
  { params }: { params: Promise<{ chave: string[] }> },
) {
  if (!env.r2.configurado) {
    return new NextResponse("Armazenamento não configurado.", { status: 503 });
  }

  const { chave } = await params;
  const caminho = chave.map(decodeURIComponent).join("/");

  // O prefixo do ambiente é obrigatório: impede que um caminho
  // construído à mão saia da área desta instalação.
  if (caminho.includes("..") || !/^(local|staging|producao)\//.test(caminho)) {
    return new NextResponse("Caminho inválido.", { status: 400 });
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
    if (!objecto.Body) return new NextResponse("Não encontrado.", { status: 404 });

    return new NextResponse(objecto.Body.transformToWebStream(), {
      headers: {
        "Content-Type": objecto.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(objecto.ContentLength
          ? { "Content-Length": String(objecto.ContentLength) }
          : {}),
      },
    });
  } catch {
    return new NextResponse("Não encontrado.", { status: 404 });
  }
}
