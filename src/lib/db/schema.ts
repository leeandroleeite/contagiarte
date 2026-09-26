import { randomUUID } from "node:crypto";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Texto traduzível. O português é obrigatório porque é a língua de
 * origem do site; EN e ES caem para PT quando estão em falta.
 */
export type Localizado = {
  pt: string;
  en?: string | null;
  es?: string | null;
};

const localizado = (nome: string) =>
  text(nome, { mode: "json" }).$type<Localizado>();

// --------------------------------------------------------------------
// Valores fechados
//
// O SQLite não tem enums; a restrição vive no tipo, que é onde importa
// para quem escreve o código. As listas ficam exportadas para os
// formulários do backoffice as poderem oferecer.
// --------------------------------------------------------------------

export const ESTADOS = ["rascunho", "publicado", "arquivado"] as const;

export const DISPONIBILIDADES = [
  "disponivel",
  "reservada",
  "vendida",
  "nao_venal",
] as const;

export const PAPEIS = ["administrador", "editor"] as const;

export const TIPOS_PEDIDO = [
  "moldura",
  "obra",
  "contacto",
  "visita",
  "parede",
] as const;

export const ESTADOS_PEDIDO = ["novo", "em_curso", "fechado"] as const;

export const ESTADOS_SUBSCRITOR = ["pendente", "activo", "removido"] as const;

// --------------------------------------------------------------------
// Utilizadores do backoffice
// --------------------------------------------------------------------

export const utilizadores = sqliteTable(
  "utilizadores",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    email: text("email").notNull(),
    nome: text("nome").notNull(),
    palavraPasseHash: text("palavra_passe_hash").notNull(),
    papel: text("papel", { enum: PAPEIS }).notNull().default("editor"),
    activo: integer("activo", { mode: "boolean" }).notNull().default(true),
    ultimoAcesso: integer("ultimo_acesso", { mode: "timestamp" }),
    criadoEm: integer("criado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("utilizadores_email_idx").on(t.email)],
);

// --------------------------------------------------------------------
// Media: tudo o que vive no R2
// --------------------------------------------------------------------

export const media = sqliteTable("media", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  chave: text("chave").notNull(), // caminho do objecto no bucket
  nomeOriginal: text("nome_original").notNull(),
  tipoMime: text("tipo_mime").notNull(),
  tamanho: integer("tamanho").notNull().default(0),
  largura: integer("largura"),
  altura: integer("altura"),
  // Cor média do ficheiro, usada como fundo enquanto a imagem carrega.
  corDominante: text("cor_dominante"),
  // Placeholder base64 minúsculo para o blur de carregamento.
  blur: text("blur"),
  alt: localizado("alt"),
  legenda: localizado("legenda"),
  criadoEm: integer("criado_em", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// --------------------------------------------------------------------
// Artistas
// --------------------------------------------------------------------

export const artistas = sqliteTable(
  "artistas",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    slug: text("slug").notNull(),
    nome: text("nome").notNull(),
    // Chave de disciplina ('pintura', 'escultura', ...). A tradução do
    // rótulo vive no dicionário, para os filtros serem consistentes.
    disciplina: text("disciplina").notNull().default("pintura"),
    naturalidade: text("naturalidade"),
    instagram: text("instagram"),
    website: text("website"),
    retratoId: text("retrato_id").references(() => media.id, {
      onDelete: "set null",
    }),
    // Linha pequena por cima do nome, no herói da página do artista.
    // Ex. "ARTISTA · PORTO", "ARTISTAS · DUPLA".
    etiqueta: localizado("etiqueta"),
    nota: localizado("nota"),
    biografia: localizado("biografia"),
    citacao: localizado("citacao"),
    // A quem se atribui a citação, ex. "MÁRIO FERREIRA, SOBRE EXPOR NO DOURO".
    citacaoFonte: text("citacao_fonte"),
    estado: text("estado", { enum: ESTADOS }).notNull().default("rascunho"),
    ordem: integer("ordem").notNull().default(0),
    criadoEm: integer("criado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    actualizadoEm: integer("actualizado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("artistas_slug_idx").on(t.slug),
    index("artistas_estado_idx").on(t.estado),
  ],
);

// --------------------------------------------------------------------
// Lugares onde a galeria expõe
// --------------------------------------------------------------------

export const lugares = sqliteTable(
  "lugares",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    slug: text("slug").notNull(),
    nome: text("nome").notNull(),
    localidade: localizado("localidade"),
    tipo: localizado("tipo"),
    morada: text("morada"),
    site: text("site"),
    mapa: text("mapa"),
    fotografiaId: text("fotografia_id").references(() => media.id, {
      onDelete: "set null",
    }),
    descricao: localizado("descricao"),
    estado: text("estado", { enum: ESTADOS }).notNull().default("rascunho"),
    ordem: integer("ordem").notNull().default(0),
    criadoEm: integer("criado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    actualizadoEm: integer("actualizado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("lugares_slug_idx").on(t.slug)],
);

// --------------------------------------------------------------------
// Exposições
// --------------------------------------------------------------------

export const exposicoes = sqliteTable(
  "exposicoes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    slug: text("slug").notNull(),
    titulo: localizado("titulo").notNull(),
    subtitulo: localizado("subtitulo"),
    lugarId: text("lugar_id").references(() => lugares.id, {
      onDelete: "set null",
    }),
    dataInicio: text("data_inicio"),
    dataFim: text("data_fim"),
    // Exposições permanentes não têm data de fim significativa.
    permanente: integer("permanente", { mode: "boolean" })
      .notNull()
      .default(false),
    curadoria: text("curadoria"),
    horario: localizado("horario"),
    reservas: localizado("reservas"),
    inclui: localizado("inclui"),
    imagemId: text("imagem_id").references(() => media.id, {
      onDelete: "set null",
    }),
    texto: localizado("texto"),
    citacao: localizado("citacao"),
    citacaoAutor: text("citacao_autor"),
    // Exposição mostrada na homepage como "em curso".
    destaque: integer("destaque", { mode: "boolean" }).notNull().default(false),
    estado: text("estado", { enum: ESTADOS }).notNull().default("rascunho"),
    ordem: integer("ordem").notNull().default(0),
    criadoEm: integer("criado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    actualizadoEm: integer("actualizado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("exposicoes_slug_idx").on(t.slug),
    index("exposicoes_estado_idx").on(t.estado),
  ],
);

export const exposicoesArtistas = sqliteTable(
  "exposicoes_artistas",
  {
    exposicaoId: text("exposicao_id")
      .notNull()
      .references(() => exposicoes.id, { onDelete: "cascade" }),
    artistaId: text("artista_id")
      .notNull()
      .references(() => artistas.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.exposicaoId, t.artistaId] })],
);

// --------------------------------------------------------------------
// Obras
// --------------------------------------------------------------------

export const obras = sqliteTable(
  "obras",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    slug: text("slug").notNull(),
    titulo: localizado("titulo").notNull(),
    artistaId: text("artista_id").references(() => artistas.id, {
      onDelete: "set null",
    }),
    tecnica: localizado("tecnica"),
    dimensoes: text("dimensoes"),
    ano: integer("ano"),
    exposicaoId: text("exposicao_id").references(() => exposicoes.id, {
      onDelete: "set null",
    }),
    fotografiaId: text("fotografia_id").references(() => media.id, {
      onDelete: "set null",
    }),
    descricao: localizado("descricao"),
    // Texto livre: quase sempre "sob consulta", por opção da galeria.
    preco: localizado("preco"),
    // Largura real em cm, usada pelo simulador "Ver na parede".
    larguraCm: integer("largura_cm"),
    alturaCm: integer("altura_cm"),
    disponibilidade: text("disponibilidade", { enum: DISPONIBILIDADES })
      .notNull()
      .default("disponivel"),
    destaque: integer("destaque", { mode: "boolean" }).notNull().default(false),
    estado: text("estado", { enum: ESTADOS }).notNull().default("rascunho"),
    ordem: integer("ordem").notNull().default(0),
    criadoEm: integer("criado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    actualizadoEm: integer("actualizado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("obras_slug_idx").on(t.slug),
    index("obras_artista_idx").on(t.artistaId),
    index("obras_exposicao_idx").on(t.exposicaoId),
    index("obras_estado_idx").on(t.estado),
  ],
);

/** Imagens adicionais de uma obra (detalhes, vista em sala). */
export const obrasMedia = sqliteTable(
  "obras_media",
  {
    obraId: text("obra_id")
      .notNull()
      .references(() => obras.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.obraId, t.mediaId] })],
);

// --------------------------------------------------------------------
// Percurso: salas de uma exposição, percorridas em scroll
// --------------------------------------------------------------------

export const salas = sqliteTable(
  "salas",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    exposicaoId: text("exposicao_id")
      .notNull()
      .references(() => exposicoes.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    nome: localizado("nome").notNull(),
    texto: localizado("texto"),
    // Linha livre com o que está exposto na sala, ex. "Obras de
    // Ana+Betânia e Vanessa Teodoro". Complementa a relação salas_obras,
    // que nem sempre está preenchida.
    notaObras: localizado("nota_obras"),
    fotografiaId: text("fotografia_id").references(() => media.id, {
      onDelete: "set null",
    }),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [uniqueIndex("salas_exposicao_slug_idx").on(t.exposicaoId, t.slug)],
);

export const salasObras = sqliteTable(
  "salas_obras",
  {
    salaId: text("sala_id")
      .notNull()
      .references(() => salas.id, { onDelete: "cascade" }),
    obraId: text("obra_id")
      .notNull()
      .references(() => obras.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.salaId, t.obraId] })],
);

// --------------------------------------------------------------------
// Molduras oferecidas no simulador "Ver na parede"
// --------------------------------------------------------------------

export const molduras = sqliteTable(
  "molduras",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    slug: text("slug").notNull(),
    nome: localizado("nome").notNull(),
    // Cor e espessura desenhadas em CSS no simulador.
    cor: text("cor").notNull().default("#2A2320"),
    espessuraMm: integer("espessura_mm").notNull().default(20),
    passepartout: integer("passepartout", { mode: "boolean" })
      .notNull()
      .default(false),
    estado: text("estado", { enum: ESTADOS }).notNull().default("publicado"),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [uniqueIndex("molduras_slug_idx").on(t.slug)],
);

// --------------------------------------------------------------------
// Textos do site editáveis sem programador
// --------------------------------------------------------------------

export const textos = sqliteTable(
  "textos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    chave: text("chave").notNull(),
    valor: localizado("valor").notNull(),
    // Onde aparece, para o backoffice dar contexto a quem edita.
    nota: text("nota"),
    grupo: text("grupo").notNull().default("geral"),
    actualizadoEm: integer("actualizado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("textos_chave_idx").on(t.chave)],
);

// --------------------------------------------------------------------
// Descarregáveis (PDFs)
// --------------------------------------------------------------------

export const descarregaveis = sqliteTable(
  "descarregaveis",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    slug: text("slug").notNull(),
    etiqueta: localizado("etiqueta"),
    nome: localizado("nome").notNull(),
    descricao: localizado("descricao"),
    ficheiroId: text("ficheiro_id").references(() => media.id, {
      onDelete: "set null",
    }),
    data: text("data"),
    descargas: integer("descargas").notNull().default(0),
    estado: text("estado", { enum: ESTADOS }).notNull().default("rascunho"),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [uniqueIndex("descarregaveis_slug_idx").on(t.slug)],
);

// --------------------------------------------------------------------
// Definições do site (linha única)
// --------------------------------------------------------------------

export type Definicoes = {
  email: string;
  telefone: string;
  whatsapp: string;
  instagram: string;
  morada: string;
  responsavel: string;
  parceiros: string[];
  ogTitulo: Localizado;
  ogDescricao: Localizado;
  /** Chave de media da imagem de partilha. */
  ogImagemId?: string | null;
  /**
   * Fotografias que aparecem em páginas fixas e não pertencem a uma
   * obra nem a um lugar: a moldura, na entrada e em /molduras, e o
   * retrato dos art dealers, na entrada e em /a-galeria. Sem elas, o
   * visitante vê um marcador com o tamanho certo e mais nada.
   */
  molduraImagemId?: string | null;
  galeriaImagemId?: string | null;
  avisoTopo?: Localizado | null;
  /**
   * Quanto destacar o título da entrada da fotografia que tem por
   * baixo, de 0 a 100. Ver `src/lib/veu.ts`.
   */
  inversaoHeroi?: number;
};

export const definicoes = sqliteTable("definicoes", {
  id: integer("id").primaryKey().default(1),
  valor: text("valor", { mode: "json" }).$type<Definicoes>().notNull(),
  actualizadoEm: integer("actualizado_em", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// --------------------------------------------------------------------
// Pedidos vindos dos formulários
// --------------------------------------------------------------------

export const pedidos = sqliteTable(
  "pedidos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    tipo: text("tipo", { enum: TIPOS_PEDIDO }).notNull(),
    nome: text("nome"),
    email: text("email"),
    telefone: text("telefone"),
    mensagem: text("mensagem"),
    // Campos próprios de cada tipo: medidas, moldura escolhida, etc.
    dados: text("dados", { mode: "json" }).$type<Record<string, unknown>>(),
    obraId: text("obra_id").references(() => obras.id, {
      onDelete: "set null",
    }),
    anexoId: text("anexo_id").references(() => media.id, {
      onDelete: "set null",
    }),
    idioma: text("idioma").notNull().default("pt"),
    origem: text("origem"),
    estado: text("estado", { enum: ESTADOS_PEDIDO }).notNull().default("novo"),
    notaInterna: text("nota_interna"),
    criadoEm: integer("criado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("pedidos_estado_idx").on(t.estado),
    index("pedidos_criado_idx").on(t.criadoEm),
  ],
);

// --------------------------------------------------------------------
// Newsletter
// --------------------------------------------------------------------

export const subscritores = sqliteTable(
  "subscritores",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    email: text("email").notNull(),
    nome: text("nome"),
    idioma: text("idioma").notNull().default("pt"),
    estado: text("estado", { enum: ESTADOS_SUBSCRITOR })
      .notNull()
      .default("pendente"),
    // Serve para confirmar a subscrição e para o link de remoção.
    token: text("token").notNull(),
    origem: text("origem"),
    confirmadoEm: integer("confirmado_em", { mode: "timestamp" }),
    criadoEm: integer("criado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("subscritores_email_idx").on(t.email),
    index("subscritores_token_idx").on(t.token),
  ],
);

// --------------------------------------------------------------------
// Registo de alterações do backoffice
// --------------------------------------------------------------------

export const registo = sqliteTable(
  "registo",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    utilizadorId: text("utilizador_id").references(() => utilizadores.id, {
      onDelete: "set null",
    }),
    accao: text("accao").notNull(),
    entidade: text("entidade").notNull(),
    entidadeId: text("entidade_id"),
    resumo: text("resumo"),
    criadoEm: integer("criado_em", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("registo_criado_idx").on(t.criadoEm)],
);
