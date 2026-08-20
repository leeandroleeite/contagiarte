import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Texto traduzível. O português é obrigatório porque é a língua de
 * origem do site; EN e ES caem para PT quando estão em falta.
 */
export type Localizado = {
  pt: string;
  en?: string | null;
  es?: string | null;
};

const localizado = (nome: string) => jsonb(nome).$type<Localizado>();

// --------------------------------------------------------------------
// Enums
// --------------------------------------------------------------------

export const estadoEnum = pgEnum("estado", [
  "rascunho",
  "publicado",
  "arquivado",
]);

export const disponibilidadeEnum = pgEnum("disponibilidade", [
  "disponivel",
  "reservada",
  "vendida",
  "nao_venal",
]);

export const papelEnum = pgEnum("papel", ["administrador", "editor"]);

export const tipoPedidoEnum = pgEnum("tipo_pedido", [
  "moldura",
  "obra",
  "contacto",
  "visita",
  "parede",
]);

export const estadoPedidoEnum = pgEnum("estado_pedido", [
  "novo",
  "em_curso",
  "fechado",
]);

export const estadoSubscritorEnum = pgEnum("estado_subscritor", [
  "pendente",
  "activo",
  "removido",
]);

// --------------------------------------------------------------------
// Utilizadores do backoffice
// --------------------------------------------------------------------

export const utilizadores = pgTable(
  "utilizadores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    nome: text("nome").notNull(),
    palavraPasseHash: text("palavra_passe_hash").notNull(),
    papel: papelEnum("papel").notNull().default("editor"),
    activo: boolean("activo").notNull().default(true),
    ultimoAcesso: timestamp("ultimo_acesso", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("utilizadores_email_idx").on(t.email)],
);

// --------------------------------------------------------------------
// Media: tudo o que vive no R2
// --------------------------------------------------------------------

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
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
  criadoEm: timestamp("criado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --------------------------------------------------------------------
// Artistas
// --------------------------------------------------------------------

export const artistas = pgTable(
  "artistas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    nome: text("nome").notNull(),
    // Chave de disciplina ('pintura', 'escultura', ...). A tradução do
    // rótulo vive no dicionário, para os filtros serem consistentes.
    disciplina: text("disciplina").notNull().default("pintura"),
    naturalidade: text("naturalidade"),
    instagram: text("instagram"),
    website: text("website"),
    retratoId: uuid("retrato_id").references(() => media.id, {
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
    estado: estadoEnum("estado").notNull().default("rascunho"),
    ordem: integer("ordem").notNull().default(0),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    actualizadoEm: timestamp("actualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("artistas_slug_idx").on(t.slug),
    index("artistas_estado_idx").on(t.estado),
  ],
);

// --------------------------------------------------------------------
// Lugares onde a galeria expõe
// --------------------------------------------------------------------

export const lugares = pgTable(
  "lugares",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    nome: text("nome").notNull(),
    localidade: localizado("localidade"),
    tipo: localizado("tipo"),
    morada: text("morada"),
    site: text("site"),
    mapa: text("mapa"),
    fotografiaId: uuid("fotografia_id").references(() => media.id, {
      onDelete: "set null",
    }),
    descricao: localizado("descricao"),
    estado: estadoEnum("estado").notNull().default("rascunho"),
    ordem: integer("ordem").notNull().default(0),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    actualizadoEm: timestamp("actualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("lugares_slug_idx").on(t.slug)],
);

// --------------------------------------------------------------------
// Exposições
// --------------------------------------------------------------------

export const exposicoes = pgTable(
  "exposicoes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    titulo: localizado("titulo").notNull(),
    subtitulo: localizado("subtitulo"),
    lugarId: uuid("lugar_id").references(() => lugares.id, {
      onDelete: "set null",
    }),
    dataInicio: date("data_inicio"),
    dataFim: date("data_fim"),
    // Exposições permanentes não têm data de fim significativa.
    permanente: boolean("permanente").notNull().default(false),
    curadoria: text("curadoria"),
    horario: localizado("horario"),
    reservas: localizado("reservas"),
    inclui: localizado("inclui"),
    imagemId: uuid("imagem_id").references(() => media.id, {
      onDelete: "set null",
    }),
    texto: localizado("texto"),
    citacao: localizado("citacao"),
    citacaoAutor: text("citacao_autor"),
    // Exposição mostrada na homepage como "em curso".
    destaque: boolean("destaque").notNull().default(false),
    estado: estadoEnum("estado").notNull().default("rascunho"),
    ordem: integer("ordem").notNull().default(0),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    actualizadoEm: timestamp("actualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("exposicoes_slug_idx").on(t.slug),
    index("exposicoes_estado_idx").on(t.estado),
  ],
);

export const exposicoesArtistas = pgTable(
  "exposicoes_artistas",
  {
    exposicaoId: uuid("exposicao_id")
      .notNull()
      .references(() => exposicoes.id, { onDelete: "cascade" }),
    artistaId: uuid("artista_id")
      .notNull()
      .references(() => artistas.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.exposicaoId, t.artistaId] })],
);

// --------------------------------------------------------------------
// Obras
// --------------------------------------------------------------------

export const obras = pgTable(
  "obras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    titulo: localizado("titulo").notNull(),
    artistaId: uuid("artista_id").references(() => artistas.id, {
      onDelete: "set null",
    }),
    tecnica: localizado("tecnica"),
    dimensoes: text("dimensoes"),
    ano: integer("ano"),
    exposicaoId: uuid("exposicao_id").references(() => exposicoes.id, {
      onDelete: "set null",
    }),
    fotografiaId: uuid("fotografia_id").references(() => media.id, {
      onDelete: "set null",
    }),
    descricao: localizado("descricao"),
    // Texto livre: quase sempre "sob consulta", por opção da galeria.
    preco: localizado("preco"),
    // Largura real em cm, usada pelo simulador "Ver na parede".
    larguraCm: integer("largura_cm"),
    alturaCm: integer("altura_cm"),
    disponibilidade: disponibilidadeEnum("disponibilidade")
      .notNull()
      .default("disponivel"),
    destaque: boolean("destaque").notNull().default(false),
    estado: estadoEnum("estado").notNull().default("rascunho"),
    ordem: integer("ordem").notNull().default(0),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
    actualizadoEm: timestamp("actualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("obras_slug_idx").on(t.slug),
    index("obras_artista_idx").on(t.artistaId),
    index("obras_exposicao_idx").on(t.exposicaoId),
    index("obras_estado_idx").on(t.estado),
  ],
);

/** Imagens adicionais de uma obra (detalhes, vista em sala). */
export const obrasMedia = pgTable(
  "obras_media",
  {
    obraId: uuid("obra_id")
      .notNull()
      .references(() => obras.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.obraId, t.mediaId] })],
);

// --------------------------------------------------------------------
// Percurso: salas de uma exposição, percorridas em scroll
// --------------------------------------------------------------------

export const salas = pgTable(
  "salas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    exposicaoId: uuid("exposicao_id")
      .notNull()
      .references(() => exposicoes.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    nome: localizado("nome").notNull(),
    texto: localizado("texto"),
    // Linha livre com o que está exposto na sala, ex. "Obras de
    // Ana+Betânia e Vanessa Teodoro". Complementa a relação salas_obras,
    // que nem sempre está preenchida.
    notaObras: localizado("nota_obras"),
    fotografiaId: uuid("fotografia_id").references(() => media.id, {
      onDelete: "set null",
    }),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [uniqueIndex("salas_exposicao_slug_idx").on(t.exposicaoId, t.slug)],
);

export const salasObras = pgTable(
  "salas_obras",
  {
    salaId: uuid("sala_id")
      .notNull()
      .references(() => salas.id, { onDelete: "cascade" }),
    obraId: uuid("obra_id")
      .notNull()
      .references(() => obras.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.salaId, t.obraId] })],
);

// --------------------------------------------------------------------
// Molduras oferecidas no simulador "Ver na parede"
// --------------------------------------------------------------------

export const molduras = pgTable(
  "molduras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    nome: localizado("nome").notNull(),
    // Cor e espessura desenhadas em CSS no simulador.
    cor: text("cor").notNull().default("#2A2320"),
    espessuraMm: integer("espessura_mm").notNull().default(20),
    passepartout: boolean("passepartout").notNull().default(false),
    estado: estadoEnum("estado").notNull().default("publicado"),
    ordem: integer("ordem").notNull().default(0),
  },
  (t) => [uniqueIndex("molduras_slug_idx").on(t.slug)],
);

// --------------------------------------------------------------------
// Textos do site editáveis sem programador
// --------------------------------------------------------------------

export const textos = pgTable(
  "textos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chave: text("chave").notNull(),
    valor: localizado("valor").notNull(),
    // Onde aparece, para o backoffice dar contexto a quem edita.
    nota: text("nota"),
    grupo: text("grupo").notNull().default("geral"),
    actualizadoEm: timestamp("actualizado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("textos_chave_idx").on(t.chave)],
);

// --------------------------------------------------------------------
// Descarregáveis (PDFs)
// --------------------------------------------------------------------

export const descarregaveis = pgTable(
  "descarregaveis",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    etiqueta: localizado("etiqueta"),
    nome: localizado("nome").notNull(),
    descricao: localizado("descricao"),
    ficheiroId: uuid("ficheiro_id").references(() => media.id, {
      onDelete: "set null",
    }),
    data: date("data"),
    descargas: integer("descargas").notNull().default(0),
    estado: estadoEnum("estado").notNull().default("rascunho"),
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
  avisoTopo?: Localizado | null;
};

export const definicoes = pgTable("definicoes", {
  id: integer("id").primaryKey().default(1),
  valor: jsonb("valor").$type<Definicoes>().notNull(),
  actualizadoEm: timestamp("actualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --------------------------------------------------------------------
// Pedidos vindos dos formulários
// --------------------------------------------------------------------

export const pedidos = pgTable(
  "pedidos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tipo: tipoPedidoEnum("tipo").notNull(),
    nome: text("nome"),
    email: text("email"),
    telefone: text("telefone"),
    mensagem: text("mensagem"),
    // Campos próprios de cada tipo: medidas, moldura escolhida, etc.
    dados: jsonb("dados").$type<Record<string, unknown>>(),
    obraId: uuid("obra_id").references(() => obras.id, {
      onDelete: "set null",
    }),
    anexoId: uuid("anexo_id").references(() => media.id, {
      onDelete: "set null",
    }),
    idioma: text("idioma").notNull().default("pt"),
    origem: text("origem"),
    estado: estadoPedidoEnum("estado").notNull().default("novo"),
    notaInterna: text("nota_interna"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("pedidos_estado_idx").on(t.estado),
    index("pedidos_criado_idx").on(t.criadoEm),
  ],
);

// --------------------------------------------------------------------
// Newsletter
// --------------------------------------------------------------------

export const subscritores = pgTable(
  "subscritores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    nome: text("nome"),
    idioma: text("idioma").notNull().default("pt"),
    estado: estadoSubscritorEnum("estado").notNull().default("pendente"),
    // Serve para confirmar a subscrição e para o link de remoção.
    token: text("token").notNull(),
    origem: text("origem"),
    confirmadoEm: timestamp("confirmado_em", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("subscritores_email_idx").on(t.email),
    index("subscritores_token_idx").on(t.token),
  ],
);

// --------------------------------------------------------------------
// Registo de alterações do backoffice
// --------------------------------------------------------------------

export const registo = pgTable(
  "registo",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    utilizadorId: uuid("utilizador_id").references(() => utilizadores.id, {
      onDelete: "set null",
    }),
    accao: text("accao").notNull(),
    entidade: text("entidade").notNull(),
    entidadeId: text("entidade_id"),
    resumo: text("resumo"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("registo_criado_idx").on(t.criadoEm)],
);
