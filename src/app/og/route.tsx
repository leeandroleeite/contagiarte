import { ImageResponse } from "next/og";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * O cartão que aparece quando alguém partilha um endereço do site.
 *
 * Antes apontava-se directamente à fotografia da obra, que veio do
 * catálogo e tem 442 pixéis de largura. O cartão saía um recorte
 * minúsculo e desfocado, e é a primeira coisa que se vê de um site
 * quando o link circula. Aqui compõe-se um de 1200 por 630: a
 * fotografia de um lado, o título e a marca do outro.
 *
 *   /og?titulo=Wonder+Frida&sub=Mário+Ferreira&img=<chave>
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LARGURA = 1200;
const ALTURA = 630;

const TINTA = "#0E0C0B";
const PAPEL = "#F2EDE4";
const OURO = "#B4884A";

export async function GET(pedido: NextRequest) {
  const p = pedido.nextUrl.searchParams;
  const titulo = (p.get("titulo") ?? "Galeria Contagiarte").slice(0, 90);
  const sub = (p.get("sub") ?? "").slice(0, 70);
  const chave = p.get("img");

  // A fotografia entra como endereço absoluto porque é o próprio site a
  // servi-la, já optimizada.
  const imagem = chave ? `${env.urlPublico}/api/media/${chave}` : null;

  // Títulos longos precisam de corpo menor para caberem em duas linhas.
  const corpo = titulo.length > 46 ? 54 : titulo.length > 28 ? 68 : 84;

  const cartao = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: TINTA,
        color: PAPEL,
      }}
    >
      {imagem && (
        <div style={{ display: "flex", width: 470, height: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagem}
            alt=""
            width={470}
            height={ALTURA}
            style={{ objectFit: "cover", width: 470, height: ALTURA }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          padding: "56px 60px",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: PAPEL,
          }}
        >
          Contagiarte®
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {sub && (
            <div
              style={{
                fontSize: 24,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: OURO,
              }}
            >
              {sub}
            </div>
          )}
          <div
            style={{
              fontSize: corpo,
              lineHeight: 1.04,
              fontWeight: 700,
              letterSpacing: -1.5,
            }}
          >
            {titulo}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 2, background: OURO }} />
          <div style={{ fontSize: 20, color: "rgba(242,237,228,0.7)" }}>
            Arte contemporânea, Porto e Douro
          </div>
        </div>
      </div>
    </div>
  );

  try {
    return new ImageResponse(cartao, { width: LARGURA, height: ALTURA });
  } catch {
    // Um cartão que falha não pode derrubar a partilha da página.
    return NextResponse.redirect(`${env.urlPublico}/og.png`, 302);
  }
}
