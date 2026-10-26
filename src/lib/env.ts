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
  get ambiente(): "producao" | "local" {
    // Um APP_ENV explícito manda sempre, "local" incluído. Sem isto,
    // correr a saída de produção contra a base local guardava os
    // ficheiros na pasta de produção, que é onde eles não devem estar.
    const a = process.env.APP_ENV;
    if (a === "producao" || a === "local") return a;
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

  /**
   * O commit que construiu esta imagem, fixado na compilação.
   *
   * Existe para o deploy poder perguntar à produção que versão é que
   * ela está mesmo a correr, em vez de o assumir. Vazio fora de uma
   * imagem construída pela esteira.
   */
  get versao(): string {
    return opcional("COMMIT_SHA");
  },

  /** Pasta onde a base de dados vive. Em produção é o volume montado. */
  get dadosDir(): string {
    return opcional("DADOS_DIR", "var");
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

  /**
   * Password única à entrada do site. Vazio significa aberto ao
   * público. Serve a uma produção que ainda não abriu portas.
   */
  get muroDeEntrada(): string {
    return opcional("PALAVRA_PASSE_ENTRADA");
  },

  /**
   * Entrar no backoffice com o Google. Com o Client ID definido, o
   * backoffice deixa de aceitar palavras-passe; sem ele (localmente e
   * nos testes) continua com email e palavra-passe.
   */
  google: {
    get clienteId(): string {
      return opcional("GOOGLE_CLIENT_ID");
    },
    get configurado(): boolean {
      return Boolean(process.env.GOOGLE_CLIENT_ID);
    },
  },

  /**
   * Os proprietários do site: os emails de ADMINISTRADORES. Ficam
   * administradores à primeira entrada com o Google, mesmo sem estarem
   * ainda em Utilizadores, e é o que deixa entrar a primeira pessoa num
   * backoffice vazio. Depois disso continuam protegidos: ninguém os
   * apaga, desactiva ou baixa a editor pela página Utilizadores, nem um
   * administrador da galeria. Vem de um segredo e não do `fly.toml`,
   * porque o repositório é público.
   */
  get proprietarios(): string[] {
    return opcional("ADMINISTRADORES")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
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
