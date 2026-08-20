/**
 * Leitura central das variáveis de ambiente. Falha cedo e com uma
 * mensagem útil em vez de rebentar a meio de um pedido.
 */

function obrigatoria(nome: string): string {
  const v = process.env[nome];
  if (!v) throw new Error(`Falta a variável de ambiente ${nome}.`);
  return v;
}

function opcional(nome: string, omissao = ""): string {
  return process.env[nome] ?? omissao;
}

export const env = {
  get ambiente(): "producao" | "staging" | "local" {
    // Um APP_ENV explícito manda sempre, "local" incluído. Sem isto,
    // correr a saída de produção contra a base local guardava os
    // ficheiros na pasta de produção, que é onde eles não devem estar.
    const a = process.env.APP_ENV;
    if (a === "producao" || a === "staging" || a === "local") return a;
    return process.env.NODE_ENV === "production" ? "producao" : "local";
  },

  /** URL público completo, sem barra final. Alimenta canonicals e OG. */
  get urlPublico(): string {
    const v =
      process.env.PUBLIC_URL ??
      (process.env.NODE_ENV === "production"
        ? "https://www.contagiarte.pt"
        : "http://localhost:3000");
    return v.replace(/\/$/, "");
  },

  get baseDados(): string {
    return obrigatoria("DATABASE_URL");
  },

  get segredoSessao(): string {
    return obrigatoria("SESSION_SECRET");
  },

  r2: {
    get conta() {
      return obrigatoria("R2_ACCOUNT_ID");
    },
    get chave() {
      return obrigatoria("R2_ACCESS_KEY_ID");
    },
    get segredo() {
      return obrigatoria("R2_SECRET_ACCESS_KEY");
    },
    get bucket() {
      return obrigatoria("R2_BUCKET");
    },
    /** Domínio público do bucket, sem barra final. */
    get publico() {
      return opcional("R2_PUBLIC_URL").replace(/\/$/, "");
    },
    get configurado() {
      return Boolean(
        process.env.R2_ACCOUNT_ID &&
          process.env.R2_ACCESS_KEY_ID &&
          process.env.R2_SECRET_ACCESS_KEY &&
          process.env.R2_BUCKET,
      );
    },
  },

  email: {
    get resend() {
      return opcional("RESEND_API_KEY");
    },
    get smtp() {
      return opcional("SMTP_URL");
    },
    get de() {
      return opcional("EMAIL_DE", "Galeria Contagiarte <site@contagiarte.pt>");
    },
    /** Para onde vão os avisos de novos pedidos. */
    get para() {
      return opcional("EMAIL_PARA", "galeria@contagiarte.pt");
    },
    get configurado() {
      return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_URL);
    },
  },

  /** Password única que protege o ambiente de staging. Vazio = aberto. */
  get palavraPasseStaging(): string {
    return opcional("STAGING_PASSWORD");
  },

  get analiticaId(): string {
    return opcional("PLAUSIBLE_DOMAIN");
  },
};

export const CONTACTOS_OMISSAO = {
  email: "galeria@contagiarte.pt",
  telefone: "+351914152451",
  telefoneFormatado: "(+351) 914 152 451",
  whatsapp: "351914152451",
  instagram: "contagiarte__",
  responsavel: "Rui Pedro Almeida",
  morada: "Porto, Portugal",
  parceiros: [
    "MOLDARTPÓVOA",
    "QUANTA TERRA",
    "OFF PADEL",
    "FORTE DE GAIA",
    "CAFÉ DA PRAÇA",
  ],
} as const;
