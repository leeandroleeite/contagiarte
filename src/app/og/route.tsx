import { ImageResponse } from "next/og";
import { NextResponse, type NextRequest } from "next/server";
import {
  artistaPorSlug,
  exposicaoEmDestaque,
  exposicaoPorSlug,
  obraPorSlug,
  obterDefinicoes,
  obterTextos,
} from "@/lib/dados";
import { env } from "@/lib/env";
import { eIdioma, IDIOMA_BASE, t, texto, type Idioma } from "@/lib/i18n";
import { urlMedia } from "@/lib/media/url";
import { ePaginaComCartao, PAGINAS_COM_CARTAO } from "@/lib/metadados";

/**
 * O cartão que aparece quando alguém partilha um endereço do site.
 *
 * Antes apontava-se directamente à fotografia da obra, que veio do
 * catálogo e tem 442 pixéis de largura. O cartão saía um recorte
 * minúsculo e desfocado, e é a primeira coisa que se vê de um site
 * quando o link circula. Aqui compõe-se um de 1200 por 630: a
 * fotografia de um lado, o título e a marca do outro.
 *
 * O pedido traz um identificador, nunca o texto:
 *
 *   /og?obra=wonder-frida&lang=pt
 *   /og?exposicao=a-pele-da-terra&lang=en
 *   /og?percurso=a-pele-da-terra
 *   /og?artista=mario-ferreira
 *   /og?pagina=molduras
 *
 * O título, a linha de cima e a fotografia saem daqui da base de
 * dados. Com os parâmetros livres de antes, qualquer pessoa escrevia o
 * que lhe apetecesse debaixo da marca "Contagiarte®" e partilhava a
 * imagem como se tivesse saído da galeria. Um identificador que não
 * resolva cai no cartão fixo, e não inventa nada.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LARGURA = 1200;
const ALTURA = 630;

const TINTA = "#0E0C0B";
const PAPEL = "#F2EDE4";
const OURO = "#B4884A";

/** O que um cartão mostra, depois de resolvido o identificador. */
type Cartao = {
  titulo: string;
  /** Linha por cima do título: o artista, o lugar, a secção. */
  sub?: string | null;
  /** Chave da fotografia no armazenamento de media. */
  chave?: string | null;
};

export async function GET(pedido: NextRequest) {
  const p = pedido.nextUrl.searchParams;

  const pedida = p.get("lang") ?? "";
  const idioma: Idioma = eIdioma(pedida) ? pedida : IDIOMA_BASE;

  const cartao = await resolver(p, idioma);
  if (!cartao) return fixo();

  try {
    return new ImageResponse(compor(cartao), {
      width: LARGURA,
      height: ALTURA,
      // Sem isto o cartão saía com `max-age=0, must-revalidate`, e cada
      // partilha mandava a máquina compor de novo um PNG de 800KB, que
      // leva mais de um segundo. Quem os vai buscar são os robôs das
      // redes e das aplicações de mensagens, e vão buscá-los muitas
      // vezes ao mesmo link.
      //
      // Uma hora no browser, uma semana a servir o antigo enquanto
      // refaz: se a galeria trocar a fotografia de uma obra, o cartão
      // acompanha dentro de uma hora, que chega.
      headers: {
        "Cache-Control":
          "public, max-age=3600, stale-while-revalidate=604800",
      },
    });
  } catch {
    // Um cartão que falha não pode derrubar a partilha da página.
    return fixo();
  }
}

/** O cartão da galeria, para quando não há nada para compor. */
function fixo() {
  return NextResponse.redirect(`${env.urlPublico}/og.png`, 302);
}

/**
 * Lê o identificador e vai buscar o que o cartão mostra. Devolve nulo
 * quando o pedido não nomeia nada que exista.
 */
async function resolver(
  p: URLSearchParams,
  idioma: Idioma,
): Promise<Cartao | null> {
  const slugObra = p.get("obra");
  if (slugObra) {
    const obra = await obraPorSlug(slugObra);
    if (!obra) return null;
    return {
      titulo: texto(obra.titulo, idioma) || t("obra.sem_titulo", idioma),
      sub: obra.artista?.nome ?? null,
      chave: obra.fotografia?.chave ?? null,
    };
  }

  const slugArtista = p.get("artista");
  if (slugArtista) {
    const artista = await artistaPorSlug(slugArtista);
    if (!artista) return null;
    return {
      titulo: artista.nome,
      sub: t("obra.artista", idioma),
      chave: artista.retrato?.chave ?? null,
    };
  }

  const slugExpo = p.get("exposicao");
  if (slugExpo) {
    const expo = await exposicaoPorSlug(slugExpo);
    if (!expo) return null;
    return {
      titulo: texto(expo.titulo, idioma),
      sub: expo.lugar?.nome ?? t("obra.exposicao", idioma),
      chave: expo.imagem?.chave ?? null,
    };
  }

  const slugPercurso = p.get("percurso");
  if (slugPercurso) {
    const expo = await exposicaoPorSlug(slugPercurso);
    if (!expo) return null;
    const txt = await obterTextos();
    return {
      titulo: texto(expo.titulo, idioma),
      sub: texto(txt["percurso.titulo"], idioma),
      chave: expo.imagem?.chave ?? null,
    };
  }

  const pagina = p.get("pagina");
  if (pagina && ePaginaComCartao(pagina)) {
    // O início leva o título e a fotografia que a galeria escolheu
    // para si; as outras páginas fixas levam só o seu nome.
    if (pagina === "inicio") {
      const [def, expo] = await Promise.all([
        obterDefinicoes(),
        exposicaoEmDestaque(),
      ]);
      return {
        titulo: texto(def.ogTitulo, idioma),
        chave: expo?.imagem?.chave ?? null,
      };
    }
    return { titulo: t(PAGINAS_COM_CARTAO[pagina], idioma) };
  }

  return null;
}

function compor({ titulo, sub, chave }: Cartao) {
  // A fotografia entra como endereço absoluto porque é preciso ir
  // buscá-la para a desenhar, e o endereço de media pode ser relativo.
  const relativa = urlMedia(chave);
  const imagem = relativa ? new URL(relativa, env.urlPublico).toString() : null;

  const linha = titulo.slice(0, 90);

  // Títulos longos precisam de corpo menor para caberem em duas linhas.
  const corpo = linha.length > 46 ? 54 : linha.length > 28 ? 68 : 84;

  return (
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
              {sub.slice(0, 70)}
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
            {linha}
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
}
