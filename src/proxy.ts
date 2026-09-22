import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerToken } from "@/lib/auth/sessao";
import { CABECALHO_IDIOMA, eIdioma, IDIOMA_BASE } from "@/lib/i18n/config";
import {
  CABECALHO_NONCE,
  novoNonce,
  politicaSeguranca,
} from "@/lib/politica-seguranca";

/** Caminhos que o middleware nunca deve tocar. */
// Caminhos que não são páginas: não levam prefixo de idioma nem passam
// pelo muro.
const IGNORAR = [
  "/_next",
  "/api",
  "/media",
  "/favicon",
  "/icon",
  "/apple-icon",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
];

/**
 * Marca posta nos pedidos que já passaram pela reescrita de idioma. O
 * servidor volta a passá-los por aqui, e sem esta marca não havia como
 * distinguir `/pt` pedido por um visitante de `/pt` vindo de `/`.
 */
const MARCA_REESCRITA = "x-contagiarte-reescrito";

function pedirPalavraPasse(politica: string) {
  return new NextResponse("Acesso restrito.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Contagiarte", charset="UTF-8"',
      "Content-Security-Policy": politica,
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

  // Ficheiros estáticos de `public` também não são páginas: sem isto
  // levavam prefixo de idioma e davam 404.
  const EXTENSAO = /\.[a-z0-9]{2,5}$/i;

  if (IGNORAR.some((p) => pathname.startsWith(p)) || EXTENSAO.test(pathname)) {
    return NextResponse.next();
  }

  // --- Política de segurança -------------------------------------------
  //
  // O nonce é um por pedido, não um por passagem por aqui. A reescrita
  // de idioma faz o servidor voltar a chamar esta função com o mesmo
  // pedido, e se a segunda passagem inventasse um nonce novo o
  // cabeçalho deixava de combinar com os scripts já assinados. A marca
  // da reescrita é o que distingue a segunda passagem da primeira, e só
  // nela se aproveita o nonce que já vem no pedido.
  const nonce =
    (pedido.headers.get(MARCA_REESCRITA) === "1"
      ? pedido.headers.get(CABECALHO_NONCE)
      : null) ?? novoNonce();

  // Por onde o pedido entrou de facto. Na Fly há um proxy à frente, e
  // o que chega cá dentro é http mesmo quando o visitante está em
  // https; quem sabe a verdade é o `x-forwarded-proto`.
  const seguro =
    (pedido.headers.get("x-forwarded-proto") ??
      pedido.nextUrl.protocol.replace(":", "")) === "https";
  const politica = politicaSeguranca(nonce, seguro);

  /**
   * Deixa passar, com o nonce à vista dos dois lados.
   *
   * No pedido, porque é de lá que o Next o lê para assinar os seus
   * próprios scripts e de lá que os componentes o lêem com `headers()`.
   * Na resposta, porque é o cabeçalho que o browser obedece.
   */
  const seguir = (idioma: string = IDIOMA_BASE) => {
    const cabecalhos = new Headers(pedido.headers);
    cabecalhos.set(CABECALHO_NONCE, nonce);
    cabecalhos.set(CABECALHO_IDIOMA, idioma);
    cabecalhos.set("Content-Security-Policy", politica);
    const resposta = NextResponse.next({ request: { headers: cabecalhos } });
    resposta.headers.set("Content-Security-Policy", politica);
    return resposta;
  };

  /** O mesmo, para as respostas que não desenham página nenhuma. */
  const comPolitica = (resposta: NextResponse) => {
    resposta.headers.set("Content-Security-Policy", politica);
    return resposta;
  };

  // --- Muro de entrada -------------------------------------------------
  //
  // Não é uma coisa de staging: é um muro. Serve a um staging com uma
  // cópia do conteúdo real, e serve a uma produção que ainda não abriu
  // portas. Havendo password definida, nada passa sem ela.
  const palavraPasse =
    process.env.PALAVRA_PASSE_ENTRADA ?? process.env.STAGING_PASSWORD;
  if (palavraPasse) {
    const cabecalho = pedido.headers.get("authorization");
    if (!cabecalho?.startsWith("Basic ")) return pedirPalavraPasse(politica);
    let recebida = "";
    try {
      recebida = atob(cabecalho.slice(6)).split(":").slice(1).join(":");
    } catch {
      return pedirPalavraPasse(politica);
    }
    if (!iguais(recebida, palavraPasse)) return pedirPalavraPasse(politica);
  }

  // --- Cartão de partilha ----------------------------------------------
  //
  // O /og também não é uma página e não leva prefixo de idioma, mas
  // fica deste lado do muro. Deixou de repetir o texto que lhe davam e
  // passou a ler a base de dados: fora do muro, quem adivinhasse um
  // slug tirava títulos e fotografias de um sítio que ainda não abriu.
  // Quando não há muro, nada disto muda para quem mostra o link.
  if (pathname === "/og") return comPolitica(NextResponse.next());

  // --- Backoffice ------------------------------------------------------
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/entrar") return seguir();
    const token = pedido.cookies.get(COOKIE_SESSAO)?.value;
    const sessao = token ? await lerToken(token) : null;
    if (!sessao) {
      const destino = `/admin/entrar?destino=${encodeURIComponent(pathname)}`;
      return comPolitica(NextResponse.redirect(new URL(destino, pedido.url)));
    }
    return seguir();
  }

  // --- Idioma ----------------------------------------------------------
  // O português vive na raiz. Um caminho sem prefixo é reescrito para
  // /pt sem o utilizador ver a mudança; EN e ES ficam com prefixo.
  const primeiro = pathname.split("/")[1] ?? "";
  if (eIdioma(primeiro)) {
    // `/pt` é o mesmo sítio que `/`, e ter os dois a responder não era
    // só uma duplicação para os motores de busca: a entrada aberta em
    // `/pt` pedia os links do cabeçalho vezes sem conta, cerca de
    // oitocentas por segundo, enquanto a página estivesse aberta. O
    // router do Next pedia, recebia uma árvore com outro caminho, não
    // a guardava, e voltava a pedir.
    //
    // O redireccionamento não pode correr no pedido já reescrito, ou
    // o site entrava em ciclo: `/` reescreve para `/pt`, `/pt`
    // redirecciona para `/`. O endereço não serve para distinguir,
    // porque na reentrada já vem reescrito; a marca posta no cabeçalho
    // da reescrita, sim.
    const reescrito = pedido.headers.get(MARCA_REESCRITA) === "1";
    if (primeiro === IDIOMA_BASE && !reescrito) {
      const semIdioma = pathname.slice(IDIOMA_BASE.length + 1) || "/";
      return comPolitica(
        NextResponse.redirect(
          new URL(`${semIdioma}${pedido.nextUrl.search}`, pedido.url),
          308,
        ),
      );
    }
    return seguir(primeiro);
  }

  // O endereço é construído a partir de `pedido.url`, e não de
  // `nextUrl.clone()`, porque o `nextUrl` pode trazer outro anfitrião
  // do que aquele por onde o pedido entrou quando há um proxy à frente,
  // como acontece na Fly.
  const destino = `/${IDIOMA_BASE}${pathname === "/" ? "" : pathname}${pedido.nextUrl.search}`;
  const cabecalhos = new Headers(pedido.headers);
  cabecalhos.set(MARCA_REESCRITA, "1");
  cabecalhos.set(CABECALHO_NONCE, nonce);
  cabecalhos.set(CABECALHO_IDIOMA, IDIOMA_BASE);
  cabecalhos.set("Content-Security-Policy", politica);
  const resposta = NextResponse.rewrite(new URL(destino, pedido.url), {
    request: { headers: cabecalhos },
  });
  resposta.headers.set("Content-Security-Policy", politica);
  return resposta;
}

export const config = {
  matcher: [
    // Tudo excepto ficheiros estáticos e rotas internas do Next.
    "/((?!_next/static|_next/image|api|media|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|pdf|txt|xml|webmanifest)$).*)",
  ],
};
