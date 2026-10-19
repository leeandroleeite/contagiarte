import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { entrarComGoogle } from "@/lib/auth";
import {
  CAMINHO_GOOGLE,
  COOKIE_GOOGLE,
  conferirTokenGoogle,
  enderecoGoogle,
} from "@/lib/auth/google";
import { env } from "@/lib/env";

/**
 * As duas pontas do "Entrar com o Google".
 *
 * GET: o botão do backoffice. Guarda num cookie o nonce e para onde se
 * ia, e manda o browser para a Google.
 *
 * POST: a Google de volta, com o token. Confere-o, abre a sessão e
 * segue para o backoffice.
 *
 * Os endereços constroem-se sempre a partir do `PUBLIC_URL`, nunca do
 * pedido: atrás do proxy da Fly o pedido chega como http e com o
 * endereço interno da máquina.
 */

export const dynamic = "force-dynamic";

const DEZ_MINUTOS = 10 * 60;

/** Só destinos dentro do backoffice: o resto era um redireccionamento aberto. */
function destinoSeguro(bruto: string | null | undefined): string {
  return bruto && bruto.startsWith("/admin") && !bruto.startsWith("//")
    ? bruto
    : "/admin";
}

function ir(caminho: string) {
  // 303 para o browser trocar o POST da Google por um GET.
  return NextResponse.redirect(new URL(caminho, env.urlPublico), 303);
}

function falhar(codigo: string) {
  return ir(`/admin/entrar?erro=${codigo}`);
}

export async function GET(pedido: NextRequest) {
  if (!env.google.configurado) return falhar("google-desligado");

  const destino = destinoSeguro(pedido.nextUrl.searchParams.get("destino"));

  // O cookie fica no domínio onde se clicou, e a Google devolve sempre
  // ao PUBLIC_URL. Quem entra pelo endereço da Fly passa primeiro para o
  // público, senão o cookie não estava lá à chegada.
  const publico = new URL(env.urlPublico);
  const anfitriao = pedido.headers.get("x-forwarded-host") ?? pedido.headers.get("host");
  if (anfitriao && anfitriao !== publico.host) {
    return NextResponse.redirect(
      new URL(`${CAMINHO_GOOGLE}?destino=${encodeURIComponent(destino)}`, publico),
    );
  }

  const nonce = randomBytes(24).toString("base64url");
  const bolo = await cookies();
  bolo.set(COOKIE_GOOGLE, JSON.stringify({ nonce, destino }), {
    httpOnly: true,
    // A Google volta com um POST de outro site, e um cookie `lax` não
    // viaja nesse pedido. `none` obriga a `secure`, e o browser aceita
    // `secure` em localhost.
    sameSite: "none",
    secure: true,
    path: CAMINHO_GOOGLE,
    maxAge: DEZ_MINUTOS,
  });

  return NextResponse.redirect(
    enderecoGoogle({
      clienteId: env.google.clienteId,
      regresso: `${env.urlPublico}${CAMINHO_GOOGLE}`,
      nonce,
    }),
  );
}

export async function POST(pedido: NextRequest) {
  if (!env.google.configurado) return falhar("google-desligado");

  const bolo = await cookies();
  const guardado = bolo.get(COOKIE_GOOGLE)?.value;
  bolo.delete({ name: COOKIE_GOOGLE, path: CAMINHO_GOOGLE });

  let nonce = "";
  let destino = "/admin";
  try {
    const lido = JSON.parse(guardado ?? "");
    nonce = typeof lido.nonce === "string" ? lido.nonce : "";
    destino = destinoSeguro(lido.destino);
  } catch {
    // Sem cookie, ou estragado: cai no `expirou` logo abaixo.
  }
  if (!nonce) return falhar("expirou");

  const dados = await pedido.formData().catch(() => null);
  // Quem carrega em Cancelar na Google volta com `error` e sem token.
  if (!dados || dados.get("error")) return falhar("cancelado");

  const token = String(dados.get("id_token") ?? "");
  const pessoa = token
    ? await conferirTokenGoogle(token, env.google.clienteId, nonce)
    : null;
  if (!pessoa) return falhar("token");

  const resultado = await entrarComGoogle(pessoa);
  if (!resultado.ok) return falhar("sem-acesso");

  return ir(destino);
}
