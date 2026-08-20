import { NextResponse } from "next/server";
import { contarDescarga, descarregavelPorSlug } from "@/lib/dados";
import { urlMedia } from "@/lib/media/url";

/**
 * Encaminha para o PDF e conta a descarga. Ter um endereço próprio por
 * documento também permite mudar o ficheiro sem partir links divulgados.
 */
export async function GET(
  pedido: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const doc = await descarregavelPorSlug(slug);

  if (!doc?.ficheiro) {
    return new NextResponse("Documento não disponível.", { status: 404 });
  }

  // Não deixa a contagem atrasar a resposta.
  contarDescarga(doc.id).catch(() => {});

  const destino = urlMedia(doc.ficheiro.chave);
  if (!destino) return new NextResponse("Sem ficheiro.", { status: 404 });

  return NextResponse.redirect(new URL(destino, pedido.url), 302);
}
