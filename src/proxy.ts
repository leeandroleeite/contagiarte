import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerToken } from "@/lib/auth/sessao";
import { CABECALHO_IDIOMA, eIdioma, IDIOMA_BASE } from "@/lib/i18n/config";
import {
  CABECALHO_NONCE,
  novoNonce,
  politicaSeguranca,
} from "@/lib/politica-seguranca";

/**
 * O que passa sem palavra-passe, mesmo com o muro de pé.
 *
 * A lista é curta de propósito, e cada linha tem uma razão. O `/_next`
 * é o que o browser e o optimizador de imagens buscam para desenhar a
 * página. O `/api/saude` é a sonda que a Fly usa para saber se a
 * máquina está viva, e sem ela a máquina é dada por morta. O
 * `/api/newsletter` são os links de confirmação que já foram por email,
 * e quem os recebeu não tem a palavra-passe. O `robots.txt` tem de ser
 * legível para poder dizer aos motores de busca que não indexem nada.
 *
 * O `/api/media` fica de fora, e não por escolha: é de lá que o
 * optimizador de imagens do Next vai buscar cada fotografia, com um
 * pedido que ele faz ao próprio servidor e que não leva palavra-passe
 * nenhuma. Tapá-lo devolve 401 ao optimizador, que responde "The
 * requested resource isn't a valid image", e o site fica sem uma única
 * imagem. Medido. Dava para o distinguir, porque o pedido interno não
 * traz `host` nem `user-agent`, mas assentar um muro na ausência de um
 * cabeçalho quebra na próxima versão do Next sem avisar.
 *
 * Fica por isso de pé uma exposição, e é melhor dizê-la do que fingir
 * que não existe: quem souber ou adivinhar uma chave de media
 * descarrega essa fotografia sem palavra-passe. As chaves só aparecem
 * no HTML das páginas, que está atrás do muro, mas há nomes previsíveis.
 * Fecha-se no dia em que o site abrir, porque aí as fotografias são
 * públicas de propósito.
 *
 * Tudo o mais passou para trás do muro, e antes não estava por o
 * `matcher` nem chamar esta função: o `sitemap.xml` dava os 47
 * endereços do site a quem os pedisse, e o `/api/descarregar` servia os
 * PDFs do catálogo.
 */
const SEM_MURO = [
  "/_next",
  "/api/saude",
  "/api/newsletter",
  "/api/media",
  "/favicon",
  "/icon",
  "/apple-icon",
  "/robots.txt",
];

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
  //
  // Vem antes da lista de caminhos que não são páginas, e é essa a
  // ordem que interessa: ao contrário, as fotografias e o sitemap
  // saíam por baixo dele.
  const palavraPasse =
    process.env.PALAVRA_PASSE_ENTRADA ?? process.env.STAGING_PASSWORD;
  if (palavraPasse && !SEM_MURO.some((p) => pathname.startsWith(p))) {
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

  // Ficheiros estáticos de `public` também não são páginas: sem isto
  // levavam prefixo de idioma e davam 404. Fica aqui, e não no topo,
  // porque o muro tem de correr primeiro.
  const EXTENSAO = /\.[a-z0-9]{2,5}$/i;

  if (IGNORAR.some((p) => pathname.startsWith(p)) || EXTENSAO.test(pathname)) {
    return NextResponse.next();
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
    // Só ficam de fora as rotas internas do Next, que o muro nunca pode
    // tapar. O resto passa por aqui, e é a função que decide: primeiro
    // se precisa de palavra-passe, depois se é página.
    //
    // Antes esta linha excluía `api`, `media`, `sitemap.xml` e tudo o que
    // acabasse em extensão de imagem ou pdf. Era um buraco no muro, não
    // uma optimização: o proxy nem era chamado para esses caminhos.
    "/((?!_next/static|_next/image).*)",
  ],
};
