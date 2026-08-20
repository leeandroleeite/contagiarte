import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerToken } from "@/lib/auth/sessao";
import { eIdioma, IDIOMA_BASE } from "@/lib/i18n/config";

/** Caminhos que o middleware nunca deve tocar. */
const IGNORAR = ["/_next", "/api", "/media", "/favicon", "/robots.txt", "/sitemap.xml"];

function pedirPalavraPasse() {
  return new NextResponse("Acesso restrito.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Contagiarte staging", charset="UTF-8"',
    },
  });
}

/** Comparação de strings sem revelar o resultado pelo tempo gasto. */
function iguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferenca === 0;
}

export default async function proxy(pedido: NextRequest) {
  const { pathname } = pedido.nextUrl;

  if (IGNORAR.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // --- Muro do staging -------------------------------------------------
  const palavraPasse = process.env.STAGING_PASSWORD;
  if (palavraPasse) {
    const cabecalho = pedido.headers.get("authorization");
    if (!cabecalho?.startsWith("Basic ")) return pedirPalavraPasse();
    let recebida = "";
    try {
      recebida = atob(cabecalho.slice(6)).split(":").slice(1).join(":");
    } catch {
      return pedirPalavraPasse();
    }
    if (!iguais(recebida, palavraPasse)) return pedirPalavraPasse();
  }

  // --- Backoffice ------------------------------------------------------
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/entrar") return NextResponse.next();
    const token = pedido.cookies.get(COOKIE_SESSAO)?.value;
    const sessao = token ? await lerToken(token) : null;
    if (!sessao) {
      const url = pedido.nextUrl.clone();
      url.pathname = "/admin/entrar";
      url.search = `?destino=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // --- Idioma ----------------------------------------------------------
  // O português vive na raiz. Um caminho sem prefixo é reescrito para
  // /pt sem o utilizador ver a mudança; EN e ES ficam com prefixo.
  const primeiro = pathname.split("/")[1] ?? "";
  if (eIdioma(primeiro)) {
    if (primeiro === IDIOMA_BASE) {
      // /pt/... é duplicado do canónico: redireccionar para a raiz.
      const url = pedido.nextUrl.clone();
      url.pathname = pathname.slice(3) || "/";
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  const url = pedido.nextUrl.clone();
  url.pathname = `/${IDIOMA_BASE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Tudo excepto ficheiros estáticos e rotas internas do Next.
    "/((?!_next/static|_next/image|api|media|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|pdf|txt|xml|webmanifest)$).*)",
  ],
};
