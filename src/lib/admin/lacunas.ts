import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  artistas,
  descarregaveis,
  exposicoes,
  lugares,
  media,
  obras,
  salas,
  textos,
  type Localizado,
} from "@/lib/db/schema";

/**
 * O que falta preencher, item a item.
 *
 * O painel já dizia quantas obras estavam sem fotografia, mas um
 * número não se corrige: quem entra aqui quer saber qual é a obra e
 * carregar para a abrir. E faltava tudo o resto, que é a maior parte:
 * descrições, medidas, capas de exposição, fotografias de salas,
 * moradas de lugares.
 *
 * Só conta o que está publicado, porque um rascunho incompleto é um
 * rascunho, não uma falha.
 */

export type Lacuna = {
  grupo: string;
  nome: string;
  href: string;
  falta: string[];
  /** Porque é que isto importa, quando não é evidente. */
  porque?: string;
};

const temPt = (v: Localizado | null | undefined) =>
  Boolean(v && typeof v === "object" && v.pt && String(v.pt).trim());

/**
 * Se um campo já traduzido tem este idioma.
 *
 * Um campo sem português não conta como falta de tradução: falta o
 * original, e isso já aparece na lista de cima.
 */
const temIdioma = (v: Localizado | null | undefined, id: "en" | "es") =>
  !temPt(v) || Boolean(v && String(v[id] ?? "").trim());

const nomeDe = (v: Localizado | null | undefined, alternativa: string) =>
  (v && typeof v === "object" && v.pt ? String(v.pt) : "") || alternativa;

/**
 * Quanto do site existe em inglês e em espanhol.
 *
 * O `texto()` cai para o português quando não há tradução, e isso é o
 * que faz o site nunca parecer incompleto: as páginas inglesas abrem
 * cheias, com frases portuguesas. Sem esta contagem, 84 por cento do
 * texto da produção esteve só em português durante meses sem ninguém
 * ver, incluindo as descrições que um leitor de ecrã anuncia.
 *
 * Os títulos das obras e os nomes de pessoas ficam de fora: "Wonder
 * Frida" chama-se Wonder Frida nos três idiomas. Contá-los era pedir à
 * galeria para traduzir o que não se traduz.
 */
export type Traducoes = {
  /** Campos com português, no total. */
  total: number;
  en: number;
  es: number;
  /** Onde faltam, para se poder ir lá. */
  onde: Array<{ grupo: string; nome: string; href: string; campos: string[] }>;
};

export async function levantarLacunas(): Promise<{
  lista: Lacuna[];
  mediaSemDescricao: number;
  totalMedia: number;
  provisorios: Array<{ chave: string; nota: string }>;
  traducoes: Traducoes;
}> {
  const [
    listaObras,
    listaArtistas,
    listaExposicoes,
    listaLugares,
    listaSalas,
    listaDocs,
    listaMedia,
    listaTextos,
  ] = await Promise.all([
    db.select().from(obras).where(eq(obras.estado, "publicado")).orderBy(asc(obras.slug)),
    db.select().from(artistas).where(eq(artistas.estado, "publicado")).orderBy(asc(artistas.nome)),
    db.select().from(exposicoes).where(eq(exposicoes.estado, "publicado")).orderBy(asc(exposicoes.slug)),
    db.select().from(lugares).where(eq(lugares.estado, "publicado")).orderBy(asc(lugares.slug)),
    db.select().from(salas).orderBy(asc(salas.ordem)),
    db.select().from(descarregaveis),
    db.select({ alt: media.alt }).from(media),
    db.select({ chave: textos.chave, nota: textos.nota }).from(textos),
  ]);

  const lista: Lacuna[] = [];
  const juntar = (l: Lacuna) => {
    if (l.falta.length > 0) lista.push(l);
  };

  for (const o of listaObras) {
    juntar({
      grupo: "Obras",
      nome: nomeDe(o.titulo, o.slug),
      href: `/admin/obras/${o.id}`,
      porque: !o.larguraCm || !o.alturaCm
        ? "Sem medidas, a simulação na parede mostra a obra pela forma da fotografia e não pelo tamanho real."
        : undefined,
      falta: [
        !o.fotografiaId && "fotografia",
        !temPt(o.descricao) && "descrição",
        (!o.larguraCm || !o.alturaCm) && "medidas em cm",
        !o.ano && "ano",
        !temPt(o.tecnica) && "técnica",
      ].filter((x): x is string => Boolean(x)),
    });
  }

  for (const a of listaArtistas) {
    juntar({
      grupo: "Artistas",
      nome: a.nome,
      href: `/admin/artistas/${a.id}`,
      falta: [
        !a.retratoId && "retrato",
        !temPt(a.biografia) && "biografia",
      ].filter((x): x is string => Boolean(x)),
    });
  }

  for (const e of listaExposicoes) {
    juntar({
      grupo: "Exposições",
      nome: nomeDe(e.titulo, e.slug),
      href: `/admin/exposicoes/${e.id}`,
      porque: !e.imagemId
        ? "Sem capa, a ficha abre com um marcador, e o cartão de partilha sai sem imagem."
        : undefined,
      falta: [
        !e.imagemId && "capa",
        !temPt(e.texto) && "texto de curadoria",
      ].filter((x): x is string => Boolean(x)),
    });
  }

  for (const l of listaLugares) {
    juntar({
      grupo: "Lugares",
      nome: l.nome,
      href: `/admin/lugares/${l.id}`,
      falta: [
        !l.fotografiaId && "fotografia",
        !temPt(l.descricao) && "descrição",
        !l.morada && "morada",
        !l.mapa && "link do mapa",
      ].filter((x): x is string => Boolean(x)),
    });
  }

  for (const s of listaSalas) {
    juntar({
      grupo: "Percurso",
      nome: nomeDe(s.nome, s.slug),
      href: "/admin/percurso",
      falta: [
        !s.fotografiaId && "fotografia",
        !temPt(s.texto) && "texto",
      ].filter((x): x is string => Boolean(x)),
    });
  }

  for (const d of listaDocs) {
    juntar({
      grupo: "Descarregáveis",
      nome: nomeDe(d.nome, d.id),
      href: `/admin/descarregaveis/${d.id}`,
      porque: !d.ficheiroId
        ? "Sem PDF, não aparece na página de descarregar."
        : undefined,
      falta: [!d.ficheiroId && "ficheiro"].filter((x): x is string => Boolean(x)),
    });
  }

  const mediaSemDescricao = listaMedia.filter((m) => !temPt(m.alt)).length;

  // Textos escritos durante o desenho, à espera da versão da galeria.
  // Estão marcados na nota e vivem no site como se fossem definitivos:
  // quem não abrir a página dos textos nunca sabe que ali está um
  // rascunho a fazer de copy.
  const provisorios = listaTextos
    .filter((t) => /provis/i.test(t.nota ?? ""))
    .map((t) => ({ chave: t.chave, nota: (t.nota ?? "").replace(/^PROVISÓRIO[.:]?\s*/i, "") }));

  // --- Traduções -------------------------------------------------------
  const traducoes: Traducoes = { total: 0, en: 0, es: 0, onde: [] };

  const contar = (
    grupo: string,
    nome: string,
    href: string,
    campos: Array<[string, Localizado | null | undefined]>,
  ) => {
    const emFalta: string[] = [];
    for (const [rotulo, valor] of campos) {
      if (!temPt(valor)) continue;
      traducoes.total++;
      const semEn = !temIdioma(valor, "en");
      const semEs = !temIdioma(valor, "es");
      if (semEn) traducoes.en++;
      if (semEs) traducoes.es++;
      if (semEn && semEs) emFalta.push(`${rotulo} (EN, ES)`);
      else if (semEn) emFalta.push(`${rotulo} (EN)`);
      else if (semEs) emFalta.push(`${rotulo} (ES)`);
    }
    if (emFalta.length > 0)
      traducoes.onde.push({ grupo, nome, href, campos: emFalta });
  };

  for (const o of listaObras)
    contar("Obras", nomeDe(o.titulo, o.slug), `/admin/obras/${o.id}`, [
      ["descrição", o.descricao],
      ["técnica", o.tecnica],
    ]);

  for (const a of listaArtistas)
    contar("Artistas", a.nome, `/admin/artistas/${a.id}`, [
      ["biografia", a.biografia],
      ["citação", a.citacao],
      ["etiqueta", a.etiqueta],
      ["nota", a.nota],
    ]);

  for (const e of listaExposicoes)
    contar(
      "Exposições",
      nomeDe(e.titulo, e.slug),
      `/admin/exposicoes/${e.id}`,
      [
        ["subtítulo", e.subtitulo],
        ["texto de curadoria", e.texto],
        ["citação", e.citacao],
        ["horário", e.horario],
        ["reservas", e.reservas],
        ["inclui", e.inclui],
      ],
    );

  // A localidade fica de fora: Matosinhos chama-se Matosinhos nos três
  // idiomas. Pedir a tradução de um nome de sítio é pôr no painel uma
  // linha que ninguém pode riscar, e um painel com linhas que não se
  // riscam deixa de se ler.
  for (const l of listaLugares)
    contar("Lugares", l.nome, `/admin/lugares/${l.id}`, [
      ["descrição", l.descricao],
      ["tipo", l.tipo],
    ]);

  for (const s of listaSalas)
    contar("Percurso", nomeDe(s.nome, s.slug), "/admin/percurso", [
      ["texto", s.texto],
      ["nota das obras", s.notaObras],
    ]);

  for (const d of listaDocs)
    contar(
      "Descarregáveis",
      nomeDe(d.nome, d.id),
      `/admin/descarregaveis/${d.id}`,
      [["descrição", d.descricao]],
    );

  // A mediateca conta em conjunto: são centenas de fichas e o que
  // interessa é o número, não a lista.
  let altSemEn = 0;
  let altSemEs = 0;
  for (const m of listaMedia) {
    if (!temPt(m.alt)) continue;
    traducoes.total++;
    if (!temIdioma(m.alt, "en")) altSemEn++;
    if (!temIdioma(m.alt, "es")) altSemEs++;
  }
  traducoes.en += altSemEn;
  traducoes.es += altSemEs;
  if (altSemEn > 0 || altSemEs > 0) {
    traducoes.onde.push({
      grupo: "Mediateca",
      nome: `${Math.max(altSemEn, altSemEs)} fotografias`,
      href: "/admin/media",
      campos: [
        altSemEn > 0 && altSemEs > 0
          ? "descrição (EN, ES)"
          : altSemEn > 0
            ? "descrição (EN)"
            : "descrição (ES)",
      ],
    });
  }

  return {
    lista,
    mediaSemDescricao,
    totalMedia: listaMedia.length,
    provisorios,
    traducoes,
  };
}
