/**
 * O que o editor de textos faz dentro da página do site que mostra ao
 * lado. A página vem do mesmo domínio, por isso o backoffice pode ler
 * e mexer no documento dela; não há nenhum código do lado do site à
 * espera disto, e o site não sabe que está a ser editado.
 *
 * A ligação entre uma frase na página e o texto da base é pelo próprio
 * texto: procura-se o elemento mais fundo cujo conteúdo é igual ao
 * valor guardado, na língua que se está a ver. Não precisa de marcas no
 * HTML público, e por isso não há uma página que se esqueça de as pôr.
 * O preço é que um texto que a página parte, abrevia ou completa com
 * outra coisa não se encontra; esses vão para a lista por baixo.
 */

/** Atributo posto nos elementos que correspondem a um texto. */
const ATRIBUTO = "data-texto-chave";
/** Atributo do texto que está aberto no painel. */
const ESCOLHIDO = "data-texto-escolhido";

/**
 * Os contornos vivem no documento do site, e por isso usam as cores
 * dele: o tracejado é a cor do próprio texto, meio transparente, o que
 * se vê tanto nos blocos escuros como nos claros; o escolhido é o ouro.
 */
const ESTILO = `
[${ATRIBUTO}] {
  outline: 1px dashed color-mix(in srgb, currentColor 45%, transparent);
  outline-offset: 4px;
  cursor: pointer;
}
[${ATRIBUTO}]:hover,
[${ATRIBUTO}]:focus-visible {
  outline: 2px dashed var(--color-ouro);
}
[${ATRIBUTO}][${ESCOLHIDO}] {
  outline: 2px solid var(--color-ouro);
  background: var(--color-ouro-lavado);
}
html { scroll-behavior: auto; }
`;

/** Marca um elemento cujo texto é só o que não está dentro dos filhos. */
const SO_PROPRIO = "data-texto-proprio";

/** O texto que é do elemento, sem o dos elementos lá dentro. */
function textoProprio(el: Element): string {
  return Array.from(el.childNodes)
    .filter((no) => no.nodeType === 3)
    .map((no) => no.nodeValue ?? "")
    .join("");
}

/** Espaços seguidos, quebras de linha e margens não contam. */
export function normalizar(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Etiquetas cujo texto nunca é um texto do site. */
const IGNORAR = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "svg"]);

export type Encontrados = Map<string, HTMLElement[]>;

/**
 * Procura na página os elementos de cada texto e marca-os.
 *
 * `textos` traz, para cada chave, o que a página deve estar a mostrar
 * nesta língua. Devolve onde cada chave apareceu; as que não estão no
 * mapa não se encontraram.
 */
export function marcarTextos(
  doc: Document,
  textos: Array<{ chave: string; mostrado: string }>,
): Encontrados {
  const porTexto = new Map<string, string[]>();
  for (const { chave, mostrado } of textos) {
    const n = normalizar(mostrado);
    // Uma ou duas letras apanhavam metade da página.
    if (n.length < 3) continue;
    porTexto.set(n, [...(porTexto.get(n) ?? []), chave]);
  }

  // Só o conteúdo: o cabeçalho e o rodapé vêm do dicionário do site e
  // não da base, e um "NEWSLETTER" no menu confundia-se com a etiqueta.
  const raiz = doc.getElementById("conteudo") ?? doc.body;
  const encontrados: Encontrados = new Map();
  const juntar = (chaves: string[], el: HTMLElement) => {
    for (const chave of chaves) {
      encontrados.set(chave, [...(encontrados.get(chave) ?? []), el]);
    }
    el.setAttribute(ATRIBUTO, chaves[0]);
  };

  for (const el of Array.from(raiz.querySelectorAll<HTMLElement>("*"))) {
    if (IGNORAR.has(el.tagName) || el.closest("svg")) continue;

    // As descrições das fotografias também se escolhem na página: um
    // clique na imagem abre o texto alternativo dela.
    if (el.tagName === "IMG") {
      const chaves = porTexto.get(normalizar(el.getAttribute("alt") ?? ""));
      if (chaves) juntar(chaves, el);
      continue;
    }

    const n = normalizar(el.textContent ?? "");
    const chaves = porTexto.get(n);
    if (chaves) {
      // O mais fundo ganha: o parágrafo, não a secção que só o contém.
      const filhoIgual = Array.from(el.children).some(
        (filho) => normalizar(filho.textContent ?? "") === n,
      );
      if (!filhoIgual) juntar(chaves, el);
      continue;
    }

    // Um parágrafo que acaba num link, como o "porque se compra arte"
    // da entrada: o texto é só a parte que não é link. Marca-se o
    // parágrafo, e ao escrever só se mexe nessa parte.
    if (el.children.length === 0) continue;
    const proprias = normalizar(textoProprio(el));
    const doProprio = porTexto.get(proprias);
    if (doProprio) {
      el.setAttribute(SO_PROPRIO, "");
      juntar(doProprio, el);
    }
  }

  for (const els of encontrados.values()) {
    for (const el of els) {
      // Chega-se com o teclado também, não só com o rato.
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
    }
  }

  if (!doc.getElementById("estilo-editor-textos")) {
    const estilo = doc.createElement("style");
    estilo.id = "estilo-editor-textos";
    estilo.textContent = ESTILO;
    doc.head.appendChild(estilo);
  }

  return encontrados;
}

/**
 * Liga os cliques da página ao editor. Um clique num texto marcado
 * escolhe-o; os links, botões e formulários da página não fazem nada,
 * porque sair dela a meio de uma edição deixava o painel a falar de
 * uma página que já não estava à vista.
 */
export function ouvirCliques(
  doc: Document,
  aoEscolher: (chave: string) => void,
): () => void {
  const alvo = (e: Event) => e.target as Element | null;

  const aoClicar = (e: MouseEvent) => {
    const marcado = alvo(e)?.closest?.(`[${ATRIBUTO}]`);
    if (marcado) {
      e.preventDefault();
      e.stopPropagation();
      aoEscolher(marcado.getAttribute(ATRIBUTO) ?? "");
      return;
    }
    if (alvo(e)?.closest?.("a,button,label,summary,[role=button]")) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const aoTeclar = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const marcado = alvo(e)?.closest?.(`[${ATRIBUTO}]`);
    if (!marcado) return;
    e.preventDefault();
    e.stopPropagation();
    aoEscolher(marcado.getAttribute(ATRIBUTO) ?? "");
  };
  const aoSubmeter = (e: Event) => e.preventDefault();

  doc.addEventListener("click", aoClicar, true);
  doc.addEventListener("keydown", aoTeclar, true);
  doc.addEventListener("submit", aoSubmeter, true);
  return () => {
    doc.removeEventListener("click", aoClicar, true);
    doc.removeEventListener("keydown", aoTeclar, true);
    doc.removeEventListener("submit", aoSubmeter, true);
  };
}

/**
 * Troca o texto à vista, sem esperar por guardar.
 *
 * Muda o valor dos nós de texto que já lá estão, em vez de os trocar
 * por outros: os nós são do React do site, e um nó arrancado por baixo
 * dele rebentava na próxima vez que ele lhe tocasse.
 */
export function escreverTexto(els: HTMLElement[], novo: string) {
  for (const el of els) {
    if (el.tagName === "IMG") {
      el.setAttribute("alt", novo);
      continue;
    }
    const nos: Text[] = [];
    if (el.hasAttribute(SO_PROPRIO)) {
      // Só o texto do próprio elemento; o link que vem a seguir fica.
      for (const no of Array.from(el.childNodes)) {
        if (no.nodeType === 3) nos.push(no as Text);
      }
    } else {
      // 4 é o NodeFilter.SHOW_TEXT; o número evita ir buscar a
      // constante a uma janela que não é a da página.
      const caminhante = el.ownerDocument.createTreeWalker(el, 4);
      while (caminhante.nextNode()) nos.push(caminhante.currentNode as Text);
    }
    if (nos.length === 0) continue;
    // O espaço que separava o texto do link mantém-se.
    const fim = el.hasAttribute(SO_PROPRIO) && nos.length > 1 ? " " : "";
    nos[0].nodeValue = novo + fim;
    for (const no of nos.slice(1)) no.nodeValue = "";
  }
}

/** Marca a dourado o texto aberto no painel, e só esse. */
export function marcarEscolhido(doc: Document, els: HTMLElement[]) {
  for (const el of Array.from(doc.querySelectorAll(`[${ESCOLHIDO}]`))) {
    el.removeAttribute(ESCOLHIDO);
  }
  for (const el of els) el.setAttribute(ESCOLHIDO, "");
}

/**
 * Espera que o site acabe de arrancar no browser antes de lhe mexer.
 *
 * Mudar um texto antes de o React do site o ter lido dava um desacerto
 * entre o HTML e o que ele esperava, e o React voltava a desenhar a
 * página por cima das marcas. O Movimento anuncia-se quando arranca, e
 * é esse o sinal; se não vier em cinco segundos, segue-se sem ele.
 */
export function esperarArranque(janela: Window): Promise<void> {
  return new Promise((resolver) => {
    let tentativas = 50;
    const ver = () => {
      if (janela.__movimento || tentativas-- <= 0) resolver();
      else janela.setTimeout(ver, 100);
    };
    ver();
  });
}
