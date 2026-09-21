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

const nomeDe = (v: Localizado | null | undefined, alternativa: string) =>
  (v && typeof v === "object" && v.pt ? String(v.pt) : "") || alternativa;

export async function levantarLacunas(): Promise<{
  lista: Lacuna[];
  mediaSemDescricao: number;
  totalMedia: number;
  provisorios: Array<{ chave: string; nota: string }>;
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

  return { lista, mediaSemDescricao, totalMedia: listaMedia.length, provisorios };
}
