/**
 * Onde vive cada texto do site, dito como quem o edita o diz.
 *
 * Os textos guardam uma chave técnica (`home.porque.1.texto`) e um
 * grupo. Nenhum dos dois serve a quem muda uma frase: a galeria pensa
 * em páginas ("a das molduras") e em sítios dentro delas ("o passo 3").
 * Este ficheiro faz a ponte, e é partilhado pelo servidor, que monta a
 * lista, e pelo editor, que abre a página certa ao lado.
 */

export type PaginaDoSite = {
  id: string;
  nome: string;
  /**
   * O endereço público, sem prefixo de idioma. Nulo quando os textos
   * não têm uma página onde se mostrem, e aí o editor só dá a lista.
   */
  caminho: string | null;
};

/**
 * As páginas, pela ordem do menu do site. As que dependem de uma obra
 * ou de uma exposição levam o endereço de um exemplo publicado, que o
 * servidor preenche: os textos são os mesmos em todas as fichas.
 */
export function paginasDoSite(exemplos: {
  obra: string | null;
  percurso: string | null;
}): PaginaDoSite[] {
  return [
    { id: "entrada", nome: "Entrada", caminho: "/" },
    { id: "obras", nome: "Obras", caminho: "/obras" },
    {
      id: "obra",
      nome: "Ficha de uma obra",
      caminho: exemplos.obra ? `/obras/${exemplos.obra}` : null,
    },
    { id: "artistas", nome: "Artistas", caminho: "/artistas" },
    { id: "exposicoes", nome: "Exposições", caminho: "/exposicoes" },
    {
      id: "percurso",
      nome: "Percurso de uma exposição",
      caminho: exemplos.percurso
        ? `/exposicoes/${exemplos.percurso}/percurso`
        : null,
    },
    { id: "lugares", nome: "Lugares", caminho: "/lugares" },
    { id: "arquivo", nome: "Arquivo", caminho: "/arquivo" },
    { id: "molduras", nome: "Molduras", caminho: "/molduras" },
    { id: "ativo", nome: "A obra como ativo", caminho: "/a-obra-como-ativo" },
    { id: "galeria", nome: "A galeria", caminho: "/a-galeria" },
    { id: "contactos", nome: "Contactos", caminho: "/contactos" },
    { id: "newsletter", nome: "Newsletter", caminho: "/newsletter" },
    { id: "descarregar", nome: "Descarregar", caminho: "/descarregar" },
    { id: "privacidade", nome: "Privacidade", caminho: "/privacidade" },
    // Uma obra que não existe de propósito: é a página de erro que lê
    // os textos da base. Um endereço sem rota nenhuma cai noutra, que
    // usa os textos de origem e não mostraria o que se está a editar.
    {
      id: "erro",
      nome: "Página de erro",
      caminho: "/obras/esta-obra-ja-nao-existe",
    },
    { id: "outros", nome: "Outros", caminho: null },
  ];
}

/** Grupo da base de dados para a página onde os textos aparecem. */
const PAGINA_DO_GRUPO: Record<string, string> = {
  homepage: "entrada",
  obras: "obras",
  obra: "obra",
  artistas: "artistas",
  "exposições": "exposicoes",
  percurso: "percurso",
  lugares: "lugares",
  arquivo: "arquivo",
  molduras: "molduras",
  ativo: "ativo",
  contactos: "contactos",
  // A mensagem geral do WhatsApp vai em todas as páginas; os contactos
  // são onde se pensa nela.
  geral: "contactos",
  newsletter: "newsletter",
  "descarregáveis": "descarregar",
  legal: "privacidade",
  sistema: "erro",
  "404": "erro",
};

/**
 * A página de um texto. O grupo decide quase sempre; a excepção é o
 * bloco da galeria, que está no grupo da entrada mas tem página própria
 * e é lá que se procura, e o bloco de subscrição, que é ao contrário.
 */
export function paginaDoTexto(chave: string, grupo: string): string {
  if (chave.startsWith("home.galeria.")) return "galeria";
  // O bloco de subscrição está na entrada e nos contactos, não na
  // página da newsletter, que tem textos seus.
  if (chave === "newsletter.titulo" || chave === "newsletter.texto") {
    return "entrada";
  }
  return PAGINA_DO_GRUPO[grupo] ?? "outros";
}

/**
 * Nomes em linguagem de quem edita. Cada regra apanha uma família de
 * chaves; os números saem da própria chave. Uma chave nova que não
 * caiba em nenhuma recebe um nome feito das partes, que é pior mas
 * nunca fica em branco.
 */
const NOMES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/\.descricao$/, () => "Descrição para o Google"],
  [/^whatsapp\.site$/, () => "Mensagem do WhatsApp em todo o site"],
  [/^contactos\.whatsapp\.visita$/, () => "Mensagem do WhatsApp para marcar visita"],
  [/\.whatsapp$/, () => "Mensagem já escrita do WhatsApp"],
  [/^404\.titulo$/, () => "Título da página de erro"],
  [/^404\.texto$/, () => "Texto da página de erro"],

  [/^home\.hero\.titulo$/, () => "Título grande do topo"],
  [/^home\.hero\.posicionamento$/, () => "Frase do fundo do topo"],
  [/^home\.porque\.etiqueta$/, () => "Porque se compra arte · etiqueta"],
  [/^home\.porque\.titulo$/, () => "Porque se compra arte · título"],
  [/^home\.porque\.(\d)\.titulo$/, (m) => `Porque se compra arte · coluna ${m[1]} · título`],
  [/^home\.porque\.(\d)\.texto$/, (m) => `Porque se compra arte · coluna ${m[1]} · texto`],
  [/^home\.citacao$/, () => "Citação"],
  [/^home\.citacao\.autor$/, () => "Autor da citação"],
  [/^home\.destaque\.alt$/, () => "Descrição da fotografia do topo, com exposição em curso"],
  [/^home\.destaque\.alt\.sem$/, () => "Descrição da fotografia do topo, sem exposição"],
  [/^home\.destaque\.legenda$/, () => "Legenda enquanto não há fotografia no topo"],
  [/^home\.galeria\.titulo$/, () => "Título"],
  [/^home\.galeria\.texto$/, () => "Texto sobre a galeria"],
  [/^home\.galeria\.assinatura$/, () => "Assinatura"],
  [/^home\.galeria\.imagem\.alt$/, () => "Descrição do retrato"],
  [/^home\.galeria\.imagem\.legenda$/, () => "Legenda enquanto não há retrato"],

  [/^molduras\.etiqueta$/, () => "Etiqueta por cima do título"],
  [/^molduras\.texto$/, () => "Apresentação do serviço"],
  [/^molduras\.passo(\d)\.titulo$/, (m) => `Passo ${m[1]} · título`],
  [/^molduras\.passo(\d)\.texto$/, (m) => `Passo ${m[1]} · texto`],
  [/\.imagem\.alt$/, () => "Descrição da fotografia"],
  [/\.imagem\.legenda$/, () => "Legenda enquanto não há fotografia"],

  [/^ativo\.etiqueta$/, () => "Etiqueta do topo"],
  [/^ativo\.intro$/, () => "Parágrafo de abertura"],
  [/^ativo\.promessas\.titulo$/, () => "O que não prometemos · título"],
  [/^ativo\.promessa\.(\d)$/, (m) => `O que não prometemos · coluna ${m[1]}`],
  [/^ativo\.criterios\.titulo$/, () => "Critérios · título"],
  [/^ativo\.criterio\.(\d)\.titulo$/, (m) => `Critério ${m[1]} · título`],
  [/^ativo\.criterio\.(\d)\.texto$/, (m) => `Critério ${m[1]} · texto`],
  [/^ativo\.grafico\.titulo$/, () => "Gráfico · título"],
  [/^ativo\.grafico\.aviso$/, () => "Gráfico · aviso"],
  [/^ativo\.marco\.(\d)$/, (m) => `Gráfico · marco ${m[1]}`],
  [/\.final\.titulo$|\.fim\.titulo$/, () => "Bloco final · título"],
  [/\.final\.texto$|\.fim\.texto$/, () => "Bloco final · texto"],

  [/^newsletter\.etiqueta$/, () => "Bloco de subscrição · etiqueta"],
  [/^newsletter\.titulo$/, () => "Bloco de subscrição · título"],
  [/^newsletter\.texto$/, () => "Bloco de subscrição · texto"],
  [/^newsletter\.pagina\.titulo$/, () => "Título da página"],
  [/^newsletter\.pagina\.intro$/, () => "Frase de abertura"],
  [/^newsletter\.pagina\.subscrever$/, () => "Título ao lado do email"],
  [/^newsletter\.pagina\.nota$/, () => "Nota ao lado do email"],
  [/^newsletter\.vantagem\.(\d)\.titulo$/, (m) => `Vantagem ${m[1]} · título`],
  [/^newsletter\.vantagem\.(\d)\.texto$/, (m) => `Vantagem ${m[1]} · texto`],

  [/^obra\.servico\.(\d)\.titulo$/, (m) => `Serviço ${m[1]} · título`],
  [/^obra\.servico\.(\d)\.texto$/, (m) => `Serviço ${m[1]} · texto`],
  [/^obra\.nota\.servico$/, () => "Linha por baixo dos botões"],

  [/^privacidade\.conteudo$/, () => "Texto da política de privacidade"],
  [/^privacidade\.nota$/, () => "Aviso por cima do texto"],
  [/^descarregar\.vazio$/, () => "Quando ainda não há documentos"],
  [/\.nota$/, () => "Aviso no fim da lista"],
  [/\.intro$/, () => "Frase de abertura"],
  [/\.titulo$/, () => "Título da página"],
];

export function nomeDoTexto(chave: string): string {
  for (const [regra, nome] of NOMES) {
    const m = chave.match(regra);
    if (m) return nome(m);
  }
  const partes = chave.split(".").slice(1).join(" · ") || chave;
  return partes.charAt(0).toUpperCase() + partes.slice(1);
}
