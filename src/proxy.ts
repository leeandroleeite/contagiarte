import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerToken } from "@/lib/auth/sessao";
import { eIdioma, IDIOMA_BASE } from "@/lib/i18n/config";

/** Caminhos que o middleware nunca deve tocar. */
// Caminhos que não são páginas: não levam prefixo de idioma nem passam
// pelo muro. O /og é o cartão de partilha, pedido por quem mostra o
// link e não por quem o abre.
const IGNORAR = [
  "/_next",
  "/api",
  "/media",
  "/og",
  "/favicon",
  "/icon",
  "/apple-icon",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
];

function pedirPalavraPasse() {
  return new NextResponse("Acesso restrito.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Contagiarte", charset="UTF-8"',
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

  // --- Muro de entrada -------------------------------------------------
  //
  // Não é uma coisa de staging: é um muro. Serve a um staging com uma
  // cópia do conteúdo real, e serve a uma produção que ainda não abriu
  // portas. Havendo password definida, nada passa sem ela.
  const palavraPasse =
    process.env.PALAVRA_PASSE_ENTRADA ?? process.env.STAGING_PASSWORD;
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
      const destino = `/admin/entrar?destino=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(new URL(destino, pedido.url));
    }
    return NextResponse.next();
  }

  // --- Idioma ----------------------------------------------------------
  // O português vive na raiz. Um caminho sem prefixo é reescrito para
  // /pt sem o utilizador ver a mudança; EN e ES ficam com prefixo.
  //
  // Não há redireccionamento de /pt para a raiz, e é de propósito: o
  // servidor de produção volta a passar o pedido reescrito por aqui, e
  // um redireccionamento nesse ramo punha o site num ciclo infinito
  // (/ reescreve para /pt, /pt redirecciona para /, e assim sem fim).
  // A duplicação fica resolvida pelo canónico que cada página declara,
  // que aponta sempre para o endereço sem prefixo.
  const primeiro = pathname.split("/")[1] ?? "";
  if (eIdioma(primeiro)) return NextResponse.next();

  // O endereço é construído a partir de `pedido.url`, e não de
  // `nextUrl.clone()`, porque o `nextUrl` pode trazer outro anfitrião
  // do que aquele por onde o pedido entrou quando há um proxy à frente,
  // como acontece na Fly.
  const destino = `/${IDIOMA_BASE}${pathname === "/" ? "" : pathname}${pedido.nextUrl.search}`;
  return NextResponse.rewrite(new URL(destino, pedido.url));
}

export const config = {
  matcher: [
    // Tudo excepto ficheiros estáticos e rotas internas do Next.
    "/((?!_next/static|_next/image|api|media|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|pdf|txt|xml|webmanifest)$).*)",
  ],
};
