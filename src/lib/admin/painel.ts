import "server-only";

import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import {
  nomeDoTexto,
  paginaDoTexto,
  paginasDoSite,
} from "@/app/admin/(painel)/textos/paginas";
import type { levantarLacunas, Lacuna } from "@/lib/admin/lacunas";
import { db } from "@/lib/db";
import {
  artistas,
  exposicoes,
  lugares,
  media,
  obras,
  registo,
  salas,
  textos,
  utilizadores,
} from "@/lib/db/schema";
import { urlMedia } from "@/lib/media/url";

/**
 * O que o painel diz em linguagem de quem gere a galeria.
 *
 * As lacunas e o registo já existiam, mas falavam a língua da base de
 * dados: "falta descrição", "editou obra". O dono da galeria queria
 * saber o que se vê no site e o que mudou, por isso aqui cada coisa
 * passa a frase, com a imagem de que se trata quando há.
 */

type Lacunas = Awaited<ReturnType<typeof levantarLacunas>>;

export type Miniatura = { nome: string; href: string; url: string | null };

export type Tarefa = {
  id: string;
  /** Onde se nota no site. */
  onde: string;
  titulo: string;
  /** O efeito no site, numa frase. */
  efeito: string;
  accao: { rotulo: string; href: string };
  miniaturas: Miniatura[];
  /** Como se diz que a ficha ainda não tem imagem: "Sem foto". */
  vazio: string;
  /** Quantas ficam de fora das miniaturas. */
  resto: number;
  /** Só nas traduções: a percentagem de cada língua. */
  linguas?: { pt: number; en: number; es: number };
  /** Peso no site: quanto maior, mais se nota. */
  peso: number;
};

const plural = (n: number, um: string, varios: string) =>
  n === 1 ? `1 ${um}` : `${n} ${varios}`;

/** Junta "a, b e c". */
const juntarNomes = (l: string[]) =>
  l.length <= 1 ? (l[0] ?? "") : `${l.slice(0, -1).join(", ")} e ${l.at(-1)}`;

/**
 * Uma família de falhas, com o que ela faz no site. O peso ordena-as
 * pelo que mais se nota: uma obra sem fotografia é um quadrado escuro
 * numa grelha de fotografias; um ano em falta é uma linha mais curta
 * por baixo do título.
 */
type Tema = {
  id: string;
  grupo: string;
  /** As falhas que contam, ou todas quando vazio. */
  faltas?: string[];
  peso: number;
  onde: string;
  titulo: (itens: Lacuna[]) => string;
  efeito: (itens: Lacuna[]) => string;
  /** Para onde vai o botão quando há mais do que uma. */
  lista: string;
  rotulo: string;
  vazio: string;
};

const TEMAS: Tema[] = [
  {
    id: "obras-fotografia",
    grupo: "Obras",
    faltas: ["fotografia"],
    peso: 100,
    onde: "Em todas as listas de obras",
    titulo: (i) => plural(i.length, "obra sem fotografia", "obras sem fotografia"),
    efeito: () =>
      "No site aparecem como um quadrado escuro com o título, e ficam de fora do Ver na parede. Uma fotografia de telemóvel já resolve.",
    lista: "/admin/obras?filtro=sem-fotografia",
    rotulo: "Pôr fotografias",
    vazio: "Sem foto",
  },
  {
    id: "exposicoes-capa",
    grupo: "Exposições",
    faltas: ["capa"],
    peso: 90,
    onde: "Página da exposição",
    titulo: (i) =>
      i.length === 1
        ? `${i[0].nome} não tem capa`
        : `${i.length} exposições sem capa`,
    efeito: () =>
      "A página abre com um marcador no lugar da fotografia, e quem partilha o link não vê imagem nenhuma.",
    lista: "/admin/exposicoes",
    rotulo: "Pôr a capa",
    vazio: "Sem capa",
  },
  {
    id: "artistas-retrato",
    grupo: "Artistas",
    faltas: ["retrato"],
    peso: 80,
    onde: "Página do artista",
    titulo: (i) => plural(i.length, "artista sem retrato", "artistas sem retrato"),
    efeito: () =>
      "No lugar da fotografia do artista aparece um quadrado escuro com o nome.",
    lista: "/admin/artistas",
    rotulo: "Pôr o retrato",
    vazio: "Sem retrato",
  },
  {
    id: "obras-descricao",
    grupo: "Obras",
    faltas: ["descrição"],
    peso: 70,
    onde: "Ficha da obra",
    titulo: (i) => plural(i.length, "obra sem descrição", "obras sem descrição"),
    efeito: () =>
      "A ficha fica só com o título e a técnica: nada conta a obra a quem não a pode ver ao vivo.",
    lista: "/admin/obras?filtro=publicado",
    rotulo: "Escrever",
    vazio: "Sem foto",
  },
  {
    id: "artistas-biografia",
    grupo: "Artistas",
    faltas: ["biografia"],
    peso: 60,
    onde: "Página do artista",
    titulo: (i) =>
      plural(i.length, "artista sem biografia", "artistas sem biografia"),
    efeito: () => "A página do artista fica sem o texto que diz quem é.",
    lista: "/admin/artistas",
    rotulo: "Escrever",
    vazio: "Sem retrato",
  },
  {
    id: "exposicoes-texto",
    grupo: "Exposições",
    faltas: ["texto de curadoria"],
    peso: 55,
    onde: "Página da exposição",
    titulo: (i) =>
      plural(
        i.length,
        "exposição sem texto de curadoria",
        "exposições sem texto de curadoria",
      ),
    efeito: () => "A página da exposição fica sem o texto que a apresenta.",
    lista: "/admin/exposicoes",
    rotulo: "Escrever",
    vazio: "Sem capa",
  },
  {
    id: "obras-medidas",
    grupo: "Obras",
    faltas: ["medidas em cm"],
    peso: 50,
    onde: "Ver na parede",
    titulo: (i) => plural(i.length, "obra sem medidas", "obras sem medidas"),
    efeito: () =>
      "Na simulação da parede, a obra aparece pela forma da fotografia e não pelo tamanho real.",
    lista: "/admin/obras?filtro=publicado",
    rotulo: "Pôr as medidas",
    vazio: "Sem foto",
  },
  {
    id: "descarregaveis",
    grupo: "Descarregáveis",
    peso: 45,
    onde: "Página Descarregar",
    titulo: (i) => plural(i.length, "documento sem PDF", "documentos sem PDF"),
    efeito: () => "Sem PDF, não aparecem na página de descarregar.",
    lista: "/admin/descarregaveis",
    rotulo: "Carregar o PDF",
    vazio: "PDF",
  },
  {
    id: "lugares",
    grupo: "Lugares",
    peso: 40,
    onde: "Página dos lugares",
    titulo: (i) =>
      plural(i.length, "lugar por completar", "lugares por completar"),
    efeito: (i) =>
      `Quem quer visitar fica sem a informação toda. Falta ${juntarNomes([
        ...new Set(i.flatMap((l) => l.falta)),
      ])}.`,
    lista: "/admin/lugares",
    rotulo: "Completar",
    vazio: "Sem foto",
  },
  {
    id: "percurso",
    grupo: "Percurso",
    peso: 35,
    onde: "Percurso da adega",
    titulo: (i) =>
      plural(i.length, "sala do percurso por completar", "salas do percurso por completar"),
    efeito: (i) =>
      `No percurso, estas salas aparecem sem ${juntarNomes([
        ...new Set(i.flatMap((l) => l.falta)),
      ])}.`,
    lista: "/admin/percurso",
    rotulo: "Completar",
    vazio: "Sem foto",
  },
  {
    id: "obras-ficha",
    grupo: "Obras",
    faltas: ["ano", "técnica"],
    peso: 30,
    onde: "Ficha da obra",
    titulo: (i) =>
      plural(
        i.length,
        "obra com a ficha técnica incompleta",
        "obras com a ficha técnica incompleta",
      ),
    efeito: () => "Falta o ano ou a técnica na linha por baixo do título.",
    lista: "/admin/obras?filtro=publicado",
    rotulo: "Completar",
    vazio: "Sem foto",
  },
];

/**
 * As tarefas da semana, da que mais se nota no site para a que menos.
 * Cada falha de `levantarLacunas` cai num tema; nada fica sem lugar,
 * e a lista completa continua por baixo, no painel.
 */
export async function tarefasDaSemana(lacunas: Lacunas): Promise<Tarefa[]> {
  const ids = [
    ...new Set(
      lacunas.lista
        .map((l) => l.imagemId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const imagens =
    ids.length > 0
      ? await db
          .select({ id: media.id, chave: media.chave })
          .from(media)
          .where(inArray(media.id, ids))
      : [];
  const url = (id?: string | null) =>
    urlMedia(imagens.find((m) => m.id === id)?.chave);

  const tarefas: Tarefa[] = [];

  for (const tema of TEMAS) {
    const itens = lacunas.lista.filter(
      (l) =>
        l.grupo === tema.grupo &&
        (!tema.faltas || l.falta.some((f) => tema.faltas!.includes(f))),
    );
    if (itens.length === 0) continue;

    // Quatro casas: com mais, a quarta diz quantas faltam.
    const mostrar = itens.length > 4 ? itens.slice(0, 3) : itens;
    tarefas.push({
      id: tema.id,
      onde: tema.onde,
      titulo: tema.titulo(itens),
      efeito: tema.efeito(itens),
      accao: {
        rotulo: tema.rotulo,
        // Com uma só, o botão abre-a. A das fotografias vai sempre
        // para o filtro, que mostra a grelha com o marcador no sítio.
        href:
          itens.length === 1 && tema.id !== "obras-fotografia"
            ? itens[0].href
            : tema.lista,
      },
      miniaturas: mostrar.map((l) => ({
        nome: l.nome,
        href: l.href,
        url: url(l.imagemId),
      })),
      vazio: tema.vazio,
      resto: itens.length - mostrar.length,
      peso: tema.peso,
    });
  }

  if (lacunas.provisorios.length > 0) {
    tarefas.push({
      id: "provisorios",
      onde: "Textos do site",
      titulo: plural(
        lacunas.provisorios.length,
        "texto provisório",
        "textos provisórios",
      ),
      efeito:
        "Foram escritos durante o desenho do site, à espera da versão da galeria, e estão no ar como se fossem definitivos.",
      accao: { rotulo: "Rever os textos", href: "/admin/textos" },
      miniaturas: [],
      vazio: "Aa",
      resto: 0,
      peso: 75,
    });
  }

  const { traducoes } = lacunas;
  const porTraduzir = Math.max(traducoes.en, traducoes.es);
  if (porTraduzir > 0 && traducoes.total > 0) {
    const pct = (falta: number) =>
      Math.round(((traducoes.total - falta) / traducoes.total) * 100);
    const primeiro = traducoes.onde[0];
    tarefas.push({
      id: "traducoes",
      onde: "Visitantes de fora",
      titulo: plural(porTraduzir, "campo por traduzir", "campos por traduzir"),
      efeito:
        "Quem visita em inglês ou espanhol lê esses textos em português, sem aviso nenhum.",
      accao: {
        rotulo: primeiro ? `Começar por ${primeiro.nome}` : "Traduzir",
        href: primeiro?.href ?? "/admin/textos",
      },
      miniaturas: [],
      vazio: "",
      resto: 0,
      linguas: { pt: 100, en: pct(traducoes.en), es: pct(traducoes.es) },
      peso: 65,
    });
  }

  if (lacunas.mediaSemDescricao > 0) {
    tarefas.push({
      id: "media-descricao",
      onde: "Pesquisa e leitores de ecrã",
      titulo: plural(
        lacunas.mediaSemDescricao,
        "ficheiro sem descrição",
        "ficheiros sem descrição",
      ),
      efeito:
        "Sem ela não se encontram pela pesquisa, e um leitor de ecrã não os sabe anunciar a quem não vê.",
      accao: { rotulo: "Descrever", href: "/admin/media" },
      miniaturas: [],
      vazio: "Aa",
      resto: 0,
      peso: 20,
    });
  }

  return tarefas.sort((a, b) => b.peso - a.peso);
}

// --------------------------------------------------------------------
// Últimas alterações
// --------------------------------------------------------------------

export type Alteracao = {
  id: string;
  /** "Alterou a obra", "Acrescentou a exposição". */
  frase: string;
  /** O nome da coisa, quando o registo o tem. */
  nome: string | null;
  href: string | null;
  url: string | null;
  /** Marca no lugar da miniatura quando não há imagem. */
  marca: string;
  quem: string;
  quando: Date;
};

const VERBO: Record<string, string> = {
  criou: "Acrescentou",
  editou: "Alterou",
  apagou: "Apagou",
};

/** Como se diz cada coisa, com o artigo, e a marca que a representa. */
const COISA: Record<string, { nome: string; marca: string; lista?: string }> = {
  obra: { nome: "a obra", marca: "Obra", lista: "/admin/obras" },
  artista: { nome: "o artista", marca: "Artista", lista: "/admin/artistas" },
  tipologia: { nome: "a tipologia", marca: "Tipo", lista: "/admin/tipologias" },
  exposicao: { nome: "a exposição", marca: "Expo", lista: "/admin/exposicoes" },
  lugar: { nome: "o lugar", marca: "Lugar", lista: "/admin/lugares" },
  sala: { nome: "a sala do percurso", marca: "Sala", lista: "/admin/percurso" },
  descarregavel: { nome: "o documento", marca: "PDF", lista: "/admin/descarregaveis" },
  media: { nome: "o ficheiro", marca: "Ficheiro", lista: "/admin/media" },
  pedido: { nome: "um pedido", marca: "Pedido", lista: "/admin/pedidos" },
  utilizador: { nome: "o acesso", marca: "Acesso" },
  textos: { nome: "o texto", marca: "Aa", lista: "/admin/textos" },
  definicoes: { nome: "os contactos e as definições", marca: "☏", lista: "/admin/definicoes" },
};

/**
 * As últimas entradas do registo, em frases.
 *
 * O registo guarda a acção, o tipo de coisa, o identificador e um
 * resumo (quase sempre o nome). Não guarda que campo mudou, por isso
 * as frases ficam em "Alterou a obra Wonder Frida": dizer mais era
 * inventar. Quem apaga não deixa nome no registo; vai-se buscar ao
 * registo anterior da mesma coisa, que o tem.
 */
export async function ultimasAlteracoes(limite = 6): Promise<Alteracao[]> {
  const linhas = await db
    .select({
      id: registo.id,
      accao: registo.accao,
      entidade: registo.entidade,
      entidadeId: registo.entidadeId,
      resumo: registo.resumo,
      criadoEm: registo.criadoEm,
      nomeUtilizador: utilizadores.nome,
    })
    .from(registo)
    .leftJoin(utilizadores, eq(registo.utilizadorId, utilizadores.id))
    .orderBy(desc(registo.criadoEm))
    .limit(limite);

  const idsDe = (entidade: string) =>
    linhas
      .filter((l) => l.entidade === entidade && l.entidadeId)
      .map((l) => l.entidadeId!);

  const semNome = linhas
    .filter((l) => !l.resumo && l.entidadeId)
    .map((l) => l.entidadeId!);
  const chaves = linhas
    .filter((l) => l.entidade === "textos" && l.resumo)
    .map((l) => l.resumo!);

  const [anteriores, lObras, lExpos, lArtistas, lLugares, lSalas, lMedia, lTextos] =
    await Promise.all([
      semNome.length
        ? db
            .select({ entidadeId: registo.entidadeId, resumo: registo.resumo })
            .from(registo)
            .where(and(inArray(registo.entidadeId, semNome), isNotNull(registo.resumo)))
            .orderBy(desc(registo.criadoEm))
        : [],
      idsDe("obra").length
        ? db.query.obras.findMany({
            where: inArray(obras.id, idsDe("obra")),
            columns: { id: true },
            with: { fotografia: { columns: { chave: true } } },
          })
        : [],
      idsDe("exposicao").length
        ? db.query.exposicoes.findMany({
            where: inArray(exposicoes.id, idsDe("exposicao")),
            columns: { id: true },
            with: { imagem: { columns: { chave: true } } },
          })
        : [],
      idsDe("artista").length
        ? db.query.artistas.findMany({
            where: inArray(artistas.id, idsDe("artista")),
            columns: { id: true },
            with: { retrato: { columns: { chave: true } } },
          })
        : [],
      idsDe("lugar").length
        ? db.query.lugares.findMany({
            where: inArray(lugares.id, idsDe("lugar")),
            columns: { id: true },
            with: { fotografia: { columns: { chave: true } } },
          })
        : [],
      idsDe("sala").length
        ? db.query.salas.findMany({
            where: inArray(salas.id, idsDe("sala")),
            columns: { id: true },
            with: { fotografia: { columns: { chave: true } } },
          })
        : [],
      idsDe("media").length
        ? db
            .select({ id: media.id, chave: media.chave, tipoMime: media.tipoMime })
            .from(media)
            .where(inArray(media.id, idsDe("media")))
        : [],
      chaves.length
        ? db
            .select({ chave: textos.chave, grupo: textos.grupo })
            .from(textos)
            .where(inArray(textos.chave, chaves))
        : [],
    ]);

  // Só os nomes das páginas interessam aqui, não os endereços.
  const paginas = paginasDoSite({ obra: null, percurso: null });

  // O que ainda existe, com a imagem que tem agora.
  const existentes = new Map<string, { href: string; chave: string | null }>();
  for (const o of lObras)
    existentes.set(`obra:${o.id}`, { href: `/admin/obras/${o.id}`, chave: o.fotografia?.chave ?? null });
  for (const e of lExpos)
    existentes.set(`exposicao:${e.id}`, { href: `/admin/exposicoes/${e.id}`, chave: e.imagem?.chave ?? null });
  for (const a of lArtistas)
    existentes.set(`artista:${a.id}`, { href: `/admin/artistas/${a.id}`, chave: a.retrato?.chave ?? null });
  for (const l of lLugares)
    existentes.set(`lugar:${l.id}`, { href: `/admin/lugares/${l.id}`, chave: l.fotografia?.chave ?? null });
  for (const s of lSalas)
    existentes.set(`sala:${s.id}`, { href: "/admin/percurso", chave: s.fotografia?.chave ?? null });
  for (const m of lMedia)
    existentes.set(`media:${m.id}`, {
      href: "/admin/media",
      chave: m.tipoMime.startsWith("image/") ? m.chave : null,
    });

  return linhas.map((l) => {
    const coisa = COISA[l.entidade];
    const verbo = VERBO[l.accao] ?? l.accao;
    const quem = l.nomeUtilizador?.split(/\s+/)[0] || "sistema";
    const base = {
      id: l.id,
      quem,
      quando: l.criadoEm,
      url: null,
      marca: coisa?.marca ?? "·",
    };

    if (l.entidade === "textos") {
      const revistos = l.resumo?.match(/^(\d+) chaves revistas$/);
      if (revistos) {
        return {
          ...base,
          frase: `Reviu ${revistos[1]} textos do site`,
          nome: null,
          href: "/admin/textos",
        };
      }
      const t = lTextos.find((x) => x.chave === l.resumo);
      const pagina = t ? paginaDoTexto(t.chave, t.grupo) : null;
      const nomePagina = paginas.find((p) => p.id === pagina)?.nome;
      return {
        ...base,
        frase: nomePagina
          ? `Mudou um texto da página ${nomePagina}:`
          : "Mudou um texto do site:",
        nome: l.resumo ? nomeDoTexto(l.resumo) : null,
        href: t
          ? `/admin/textos?${new URLSearchParams({ pagina: pagina!, texto: t.chave })}`
          : "/admin/textos",
      };
    }

    if (l.entidade === "definicoes") {
      return {
        ...base,
        frase: `${verbo} ${coisa.nome} do site`,
        nome: null,
        href: coisa.lista ?? null,
      };
    }

    const nome =
      l.resumo ??
      anteriores.find((a) => a.entidadeId === l.entidadeId)?.resumo ??
      null;
    const existe = l.entidadeId
      ? existentes.get(`${l.entidade}:${l.entidadeId}`)
      : undefined;
    const ligacao = { href: existe?.href ?? null, url: urlMedia(existe?.chave) };

    if (l.entidade === "utilizador") {
      const frase =
        l.accao === "criou"
          ? "Deu acesso ao backoffice a"
          : l.accao === "apagou"
            ? "Tirou o acesso ao backoffice a"
            : "Alterou o acesso de";
      return {
        ...base,
        ...ligacao,
        frase: nome ? frase : `${verbo} um acesso ao backoffice`,
        nome,
      };
    }

    // Um ficheiro não se acrescenta, carrega-se.
    const accao = l.entidade === "media" && l.accao === "criou" ? "Carregou" : verbo;
    const artigo = coisa?.nome ?? l.entidade;

    return {
      ...base,
      ...ligacao,
      frase:
        // "Apagou a obra" sem nome lê-se como frase partida.
        nome || l.entidade === "pedido"
          ? `${accao} ${artigo}`
          : `${accao} ${artigo.replace(/^(a|o) /, (m) => (m === "a " ? "uma " : "um "))}`,
      nome,
    };
  });
}
