"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { guardarTextos } from "@/lib/admin/accoes";
import { texto } from "@/lib/i18n";
import { caminho, IDIOMAS, type Idioma } from "@/lib/i18n/config";
import { cx } from "@/lib/utils";
import {
  escreverTexto,
  esperarArranque,
  marcarEscolhido,
  marcarTextos,
  normalizar,
  ouvirCliques,
  type Encontrados,
} from "./pagina-viva";
import type { PaginaDoSite } from "./paginas";

type Valor = { pt: string; en: string; es: string };

export type TextoDoSite = {
  chave: string;
  /** O nome em linguagem de quem edita, ex. "Passo 3 · texto". */
  nome: string;
  /** Onde aparece, escrito na semente de cada texto. */
  nota: string;
  /** A página do site onde se edita. */
  pagina: string;
  valor: Valor;
};

const NOME_LINGUA: Record<Idioma, string> = {
  pt: "Português",
  en: "Inglês",
  es: "Espanhol",
};

const iguais = (a: Valor, b: Valor) =>
  a.pt === b.pt && a.en === b.en && a.es === b.es;

/** Sem acentos nem maiúsculas: "molduras" encontra "MOLDURAS À MEDIDA". */
const paraProcurar = (s: string) =>
  normalizar(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const resumo = (s: string, n = 90) => {
  const limpo = normalizar(s);
  return limpo.length > n ? `${limpo.slice(0, n - 1)}…` : limpo;
};

export function EditorTextos({
  paginas,
  textos,
  paginaInicial,
  textoInicial,
}: {
  paginas: PaginaDoSite[];
  textos: TextoDoSite[];
  paginaInicial?: string;
  textoInicial?: string;
}) {
  const porChave = useMemo(
    () => new Map(textos.map((t) => [t.chave, t])),
    [textos],
  );

  const [escolhida, setEscolhida] = useState<string | null>(() =>
    textoInicial && porChave.has(textoInicial) ? textoInicial : null,
  );
  const [paginaId, setPaginaId] = useState<string>(() => {
    if (paginaInicial && paginas.some((p) => p.id === paginaInicial)) {
      return paginaInicial;
    }
    const doTexto = textoInicial ? porChave.get(textoInicial)?.pagina : null;
    return doTexto ?? paginas[0]?.id ?? "outros";
  });
  const [rascunhos, setRascunhos] = useState<Record<string, Valor>>({});
  const [idiomaVista, setIdiomaVista] = useState<Idioma>("pt");
  const [emLista, setEmLista] = useState(false);
  const [encontrados, setEncontrados] = useState<Set<string> | null>(null);
  const [procura, setProcura] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const pagina = paginas.find((p) => p.id === paginaId) ?? paginas[0];
  const naPagina = textos.filter((t) => t.pagina === pagina?.id);
  const verPagina = Boolean(pagina?.caminho) && !emLista;
  const endereco = pagina?.caminho
    ? caminho(idiomaVista, pagina.caminho)
    : null;

  const actual = useCallback(
    (chave: string): Valor =>
      rascunhos[chave] ?? porChave.get(chave)?.valor ?? { pt: "", en: "", es: "" },
    [rascunhos, porChave],
  );
  const alterados = Object.keys(rascunhos).filter((chave) => {
    const original = porChave.get(chave);
    return original && !iguais(rascunhos[chave], original.valor);
  });

  // --- A página ao lado ----------------------------------------------
  const moldura = useRef<HTMLIFrameElement>(null);
  const elementos = useRef<Encontrados>(new Map());
  /** Texto escolhido de fora da página, a mostrar quando ela o tiver. */
  const rolarPara = useRef<string | null>(textoInicial ?? null);

  // O que a carga da página precisa de ler, sempre fresco: a carga
  // acontece fora do ciclo do React e não pode guardar valores velhos.
  const fresco = useRef({ rascunhos, idiomaVista, textos });
  useLayoutEffect(() => {
    fresco.current = { rascunhos, idiomaVista, textos };
  });

  const escolherDaPagina = useCallback((chave: string) => {
    if (!chave) return;
    setErro(null);
    setEscolhida(chave);
  }, []);

  useEffect(() => {
    const el = moldura.current;
    if (!el || !endereco) return;
    let desligar: (() => void) | null = null;
    let cancelado = false;

    const aoCarregar = async () => {
      const janela = el.contentWindow;
      const doc = el.contentDocument;
      if (!janela || !doc || janela.location.href === "about:blank") return;
      await esperarArranque(janela);
      if (cancelado) return;

      const { rascunhos, idiomaVista, textos } = fresco.current;
      // Procura-se o que está guardado, que é o que a página mostra;
      // os rascunhos entram a seguir, por cima do que se encontrou.
      const achados = marcarTextos(
        doc,
        textos.map((t) => ({
          chave: t.chave,
          mostrado: texto(t.valor, idiomaVista),
        })),
      );
      for (const [chave, valor] of Object.entries(rascunhos)) {
        const els = achados.get(chave);
        if (els) escreverTexto(els, texto(valor, idiomaVista));
      }
      desligar?.();
      desligar = ouvirCliques(doc, escolherDaPagina);
      elementos.current = achados;
      setEncontrados(new Set(achados.keys()));
    };

    const ouvir = () => void aoCarregar();
    el.addEventListener("load", ouvir);
    // A página pode ter acabado de carregar antes de o React chegar
    // aqui, e aí o evento já passou.
    if (el.contentDocument?.readyState === "complete") ouvir();
    return () => {
      cancelado = true;
      el.removeEventListener("load", ouvir);
      desligar?.();
    };
  }, [endereco, verPagina, escolherDaPagina]);

  // O escolhido fica a dourado na página, e quando veio de fora dela
  // (da lista ou da procura) a página desce até ele.
  useEffect(() => {
    const doc = moldura.current?.contentDocument;
    if (!doc || !encontrados) return;
    const els = escolhida ? (elementos.current.get(escolhida) ?? []) : [];
    marcarEscolhido(doc, els);
    if (!escolhida || !els[0]) return;

    // No telemóvel a folha do painel tapa a metade de baixo do ecrã. O
    // texto escolhido sobe para o topo da página, e a página para o
    // topo do ecrã, para se ver a frase a mudar enquanto se escreve.
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      els[0].scrollIntoView({ block: "start", behavior: "instant" });
      moldura.current?.scrollIntoView({ block: "start", behavior: "instant" });
      rolarPara.current = null;
      return;
    }
    if (rolarPara.current === escolhida) {
      rolarPara.current = null;
      els[0].scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [escolhida, encontrados]);

  // A morada acompanha a página e o texto: recarregar, ou mandar o
  // link a alguém, volta ao mesmo sítio.
  useEffect(() => {
    const p = new URLSearchParams({ pagina: paginaId });
    if (escolhida) p.set("texto", escolhida);
    window.history.replaceState(null, "", `?${p}`);
  }, [paginaId, escolhida]);

  // Sair com textos por guardar pede confirmação ao browser.
  const porGuardar = alterados.length > 0;
  useEffect(() => {
    if (!porGuardar) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [porGuardar]);

  // --- Acções ----------------------------------------------------------
  const mudarPagina = (id: string) => {
    if (id === paginaId) return;
    setPaginaId(id);
    setEncontrados(null);
    elementos.current = new Map();
    const t = escolhida ? porChave.get(escolhida) : null;
    if (t?.pagina !== id) setEscolhida(null);
  };

  const mudarIdioma = (idioma: Idioma) => {
    if (idioma === idiomaVista) return;
    setIdiomaVista(idioma);
    setEncontrados(null);
    elementos.current = new Map();
    if (escolhida) rolarPara.current = escolhida;
  };

  const alternarLista = () => {
    setEmLista((v) => !v);
    setEncontrados(null);
    elementos.current = new Map();
    if (escolhida) rolarPara.current = escolhida;
  };

  /** Escolher de fora da página: da lista, da procura. */
  const escolherDeFora = (chave: string) => {
    const t = porChave.get(chave);
    if (!t) return;
    setErro(null);
    rolarPara.current = chave;
    if (t.pagina !== paginaId && !elementos.current.has(chave)) {
      setPaginaId(t.pagina);
      setEncontrados(null);
      elementos.current = new Map();
    }
    setEscolhida(chave);
  };

  const escrever = (chave: string, lingua: Idioma, valor: string) => {
    const novo = { ...actual(chave), [lingua]: valor };
    setRascunhos((r) => ({ ...r, [chave]: novo }));
    setErro(null);
    // A página muda enquanto se escreve, na língua que se está a ver.
    const els = elementos.current.get(chave);
    if (els) escreverTexto(els, texto(novo, idiomaVista));
  };

  const voltarAoOriginal = (chave: string) => {
    const original = porChave.get(chave);
    if (!original) return;
    setRascunhos((r) => {
      const resto = { ...r };
      delete resto[chave];
      return resto;
    });
    const els = elementos.current.get(chave);
    if (els) escreverTexto(els, texto(original.valor, idiomaVista));
  };

  const aoSubmeter = (e: React.FormEvent<HTMLFormElement>) => {
    const semPt = alterados.find((chave) => !rascunhos[chave].pt.trim());
    if (semPt) {
      e.preventDefault();
      setErro(
        `"${porChave.get(semPt)?.nome}" ficou sem português. O português é obrigatório: é ele que aparece quando falta uma tradução.`,
      );
      escolherDeFora(semPt);
    }
  };

  // --- Procura ---------------------------------------------------------
  const resultados = useMemo(() => {
    const q = paraProcurar(procura);
    if (q.length < 2) return [];
    return textos
      .filter((t) =>
        [t.valor.pt, t.valor.en, t.valor.es, t.nome, t.nota].some((v) =>
          paraProcurar(v).includes(q),
        ),
      )
      .slice(0, 8);
  }, [procura, textos]);

  const nomeDaPagina = (id: string) =>
    paginas.find((p) => p.id === id)?.nome ?? "Outros";

  const naoVisiveis = encontrados
    ? naPagina.filter((t) => !encontrados.has(t.chave))
    : [];

  const sel = escolhida ? porChave.get(escolhida) : null;
  const valorSel = sel ? actual(sel.chave) : null;
  const selAlterado = sel ? alterados.includes(sel.chave) : false;

  return (
    <div className="flex flex-col gap-6">
      {/* --- Escolher a página, e procurar ------------------------------ */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <label className="flex min-w-0 flex-1 flex-col lg:hidden">
            <span className="adm-rotulo">Página do site</span>
            <select
              value={pagina?.id}
              onChange={(e) => mudarPagina(e.target.value)}
            >
              {paginas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({textos.filter((t) => t.pagina === p.id).length})
                </option>
              ))}
            </select>
          </label>

          <nav aria-label="Páginas do site" className="hidden min-w-0 lg:block lg:flex-1">
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {paginas.map((p) => {
                const actualP = p.id === pagina?.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => mudarPagina(p.id)}
                      aria-current={actualP ? "page" : undefined}
                      className={cx(
                        "flex min-h-[44px] cursor-pointer items-center gap-2 border px-3.5 text-[14px]",
                        actualP
                          ? "border-tinta bg-tinta text-papel"
                          : "border-adm-fio-forte bg-transparent text-tinta hover:border-tinta",
                      )}
                    >
                      {p.nome}
                      <span className="text-[12px] opacity-70">
                        {textos.filter((t) => t.pagina === p.id).length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="relative w-full lg:w-[300px] lg:flex-none">
            <label htmlFor="procurar-texto" className="so-leitor">
              Procurar em todos os textos
            </label>
            <input
              id="procurar-texto"
              type="search"
              placeholder="Procurar uma frase"
              autoComplete="off"
              value={procura}
              onChange={(e) => setProcura(e.target.value)}
            />
            {procura.trim().length >= 2 && (
              <div className="absolute inset-x-0 top-full z-30 border border-t-0 border-adm-fio-forte bg-adm-cartao">
                {resultados.length === 0 ? (
                  <p className="m-0 px-4 py-3 text-[14px] text-adm-suave">
                    Nenhum texto tem essa frase.
                  </p>
                ) : (
                  <ul className="m-0 list-none p-0">
                    {resultados.map((t) => (
                      <li key={t.chave} className="border-t border-adm-fio first:border-t-0">
                        <button
                          type="button"
                          onClick={() => {
                            escolherDeFora(t.chave);
                            setProcura("");
                          }}
                          className="flex w-full cursor-pointer flex-col gap-1 border-0 bg-transparent px-4 py-3 text-left hover:bg-ouro-lavado"
                        >
                          <span className="text-[14px] font-medium">
                            {t.nome}
                            <span className="text-adm-suave"> · {nomeDaPagina(t.pagina)}</span>
                          </span>
                          <span className="text-[13px] text-adm-suave">
                            {resumo(t.valor.pt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* --- A página ------------------------------------------------- */}
        <section
          aria-label={`Página ${pagina?.nome ?? ""}`}
          className="flex min-w-0 flex-col gap-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {pagina?.caminho ? (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Língua da página">
                <span className="text-[12px] tracking-[0.14em] text-adm-suave">VER EM</span>
                {IDIOMAS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => mudarIdioma(id)}
                    aria-pressed={id === idiomaVista}
                    title={NOME_LINGUA[id]}
                    className={cx(
                      "min-h-[36px] min-w-[44px] cursor-pointer border px-2.5 text-[12px] tracking-[0.14em] uppercase",
                      id === idiomaVista
                        ? "border-tinta bg-tinta text-papel"
                        : "border-adm-fio-forte bg-transparent text-tinta",
                    )}
                  >
                    {id}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[14px] text-adm-suave">
                Estes textos não têm uma página onde se vejam.
              </span>
            )}
            {pagina?.caminho && (
              <button
                type="button"
                onClick={alternarLista}
                aria-pressed={emLista}
                className="min-h-[36px] cursor-pointer border-0 bg-transparent p-0 text-[13px] text-tinta underline underline-offset-[3px]"
              >
                {emLista ? "Ver a página" : "Ver em lista"}
              </button>
            )}
          </div>

          {verPagina && endereco ? (
            <>
              <p className="m-0 text-[13px] text-adm-suave">
                Os textos que se podem mudar têm um tracejado à volta. Clique
                num para o abrir. Os links da página aqui não levam a lado
                nenhum.
              </p>
              <iframe
                ref={moldura}
                key={endereco}
                src={endereco}
                title={`Página ${pagina?.nome}, como está no site`}
                className="block h-[68dvh] w-full scroll-mt-16 border border-adm-fio-forte bg-tinta lg:h-[calc(100dvh-260px)] lg:min-h-[560px]"
              />
              <p className="m-0 truncate text-[12px] tracking-[0.14em] text-adm-suave">
                {endereco}
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <h2 className="adm-rotulo mb-0">Também nesta página, mas não visíveis</h2>
                {!encontrados ? (
                  <p className="m-0 text-[14px] text-adm-suave" role="status">
                    A procurar os textos na página…
                  </p>
                ) : naoVisiveis.length === 0 ? (
                  <p className="m-0 text-[14px] text-adm-suave">
                    Todos os textos desta página estão à vista.
                  </p>
                ) : (
                  <>
                    <p className="m-0 text-[13px] text-adm-suave">
                      Descrições para o Google, mensagens já escritas do
                      WhatsApp, descrições de fotografias e textos que só
                      aparecem às vezes.
                    </p>
                    <ListaTextos
                      textos={naoVisiveis}
                      escolhida={escolhida}
                      alterados={alterados}
                      aoEscolher={escolherDeFora}
                    />
                  </>
                )}
              </div>
            </>
          ) : (
            <ListaTextos
              textos={naPagina}
              escolhida={escolhida}
              alterados={alterados}
              aoEscolher={escolherDeFora}
            />
          )}
        </section>

        {/* --- O painel ------------------------------------------------- */}
        <aside
          aria-label="Editar o texto escolhido"
          className={cx(
            "flex-col gap-4 border-adm-fio-forte bg-adm-cartao p-5",
            // No telemóvel é uma folha que sobe do fundo quando se
            // escolhe um texto; em ecrã largo fica ao lado, parado.
            "fixed inset-x-0 bottom-0 z-50 max-h-[55dvh] overflow-y-auto border-t",
            "lg:sticky lg:top-6 lg:z-auto lg:max-h-[calc(100dvh-48px)] lg:border",
            sel ? "flex" : "hidden lg:flex",
          )}
        >
          <form
            action={guardarTextos}
            onSubmit={aoSubmeter}
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="pagina" value={paginaId} />
            <input type="hidden" name="texto" value={escolhida ?? ""} />
            {/* Os outros textos mudados vão também, mesmo não estando
                abertos: guardar publica tudo o que se mudou. */}
            {alterados
              .filter((chave) => chave !== escolhida)
              .map((chave) => (
                <span key={chave} hidden>
                  <input type="hidden" name="chaves" value={chave} />
                  {IDIOMAS.map((l) => (
                    <input
                      key={l}
                      type="hidden"
                      name={`t.${chave}.${l}`}
                      value={rascunhos[chave][l]}
                    />
                  ))}
                </span>
              ))}

            {sel && valorSel ? (
              <>
                {selAlterado && (
                  <input type="hidden" name="chaves" value={sel.chave} />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1" aria-live="polite">
                    <span className="text-[11px] tracking-[0.2em] text-adm-suave">
                      A EDITAR · {nomeDaPagina(sel.pagina).toUpperCase()}
                    </span>
                    <span className="text-[18px] font-semibold">{sel.nome}</span>
                    {sel.nota && (
                      <span className="text-[13px] leading-[1.5] text-adm-suave">
                        {sel.nota}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEscolhida(null)}
                    className="min-h-[44px] flex-none cursor-pointer border border-adm-fio-forte bg-transparent px-3 text-[12px] tracking-[0.14em] text-tinta uppercase lg:hidden"
                  >
                    Fechar
                  </button>
                </div>

                {IDIOMAS.map((l) => {
                  const longo = sel.valor.pt.length > 90;
                  return (
                    <div key={l} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <label
                          htmlFor={`texto-${l}`}
                          className="text-[12px] tracking-[0.14em] uppercase"
                        >
                          {NOME_LINGUA[l]}
                        </label>
                        {verPagina && l !== idiomaVista && (
                          <button
                            type="button"
                            onClick={() => mudarIdioma(l)}
                            className="cursor-pointer border-0 bg-transparent p-0 text-[12px] text-adm-suave underline underline-offset-[3px]"
                          >
                            Ver a página em {NOME_LINGUA[l].toLowerCase()}
                          </button>
                        )}
                      </div>
                      <textarea
                        id={`texto-${l}`}
                        name={`t.${sel.chave}.${l}`}
                        rows={longo ? 6 : 3}
                        value={valorSel[l]}
                        required={l === "pt"}
                        placeholder={
                          l === "pt"
                            ? undefined
                            : "Vazio: o site mostra o português."
                        }
                        onChange={(e) => escrever(sel.chave, l, e.target.value)}
                        className="resize-y leading-[1.5]"
                      />
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="m-0 text-[15px] leading-[1.6] text-adm-suave">
                Clique num texto da página para o mudar aqui. Pode mudar
                vários antes de guardar.
              </p>
            )}

            {erro && (
              <p role="alert" className="m-0 border-l-2 border-l-erro px-3 py-2 text-[14px] text-erro">
                {erro}
              </p>
            )}

            <div className="flex flex-wrap gap-2.5">
              <BotaoGuardar quantos={alterados.length} />
              {sel && (
                <button
                  type="button"
                  className="adm-botao adm-botao-linha"
                  onClick={() => voltarAoOriginal(sel.chave)}
                  disabled={!selAlterado}
                  title="Desfaz o que escreveu neste texto e volta ao que está no site."
                >
                  Voltar ao original
                </button>
              )}
            </div>

            <p className="m-0 text-[12px] leading-[1.5] text-adm-suave">
              {alterados.length > 1
                ? `Tem ${alterados.length} textos por guardar. `
                : alterados.length === 1 && !selAlterado
                  ? "Tem 1 texto por guardar noutro sítio. "
                  : ""}
              A página muda enquanto escreve. Nada vai para o site até
              carregar em Guardar.
            </p>

            {sel && (
              <details className="text-[12px] text-adm-suave">
                <summary className="cursor-pointer">Pormenor técnico</summary>
                <code className="mt-1 block break-all">{sel.chave}</code>
              </details>
            )}
          </form>
        </aside>
      </div>

      {/* Deixa descer a página até ao fim com a folha aberta por cima. */}
      {sel && <div aria-hidden="true" className="h-[60dvh] lg:hidden" />}
    </div>
  );
}

function BotaoGuardar({ quantos }: { quantos: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="adm-botao"
      disabled={pending || quantos === 0}
    >
      {pending
        ? "A guardar…"
        : quantos > 1
          ? `Guardar e publicar (${quantos})`
          : "Guardar e publicar"}
    </button>
  );
}

function ListaTextos({
  textos,
  escolhida,
  alterados,
  aoEscolher,
}: {
  textos: TextoDoSite[];
  escolhida: string | null;
  alterados: string[];
  aoEscolher: (chave: string) => void;
}) {
  return (
    <ul className="m-0 flex list-none flex-col border border-adm-fio-forte bg-adm-cartao p-0">
      {textos.map((t) => (
        <li key={t.chave} className="border-t border-adm-fio first:border-t-0">
          <button
            type="button"
            onClick={() => aoEscolher(t.chave)}
            aria-pressed={t.chave === escolhida}
            className={cx(
              "flex w-full cursor-pointer flex-col gap-1 border-0 px-4 py-3 text-left",
              t.chave === escolhida
                ? "bg-ouro-lavado outline-2 -outline-offset-2 outline-ouro"
                : "bg-transparent hover:bg-ouro-lavado",
            )}
          >
            <span className="text-[14px] font-medium">
              {t.nome}
              {alterados.includes(t.chave) && (
                <span className="text-adm-suave"> · por guardar</span>
              )}
            </span>
            <span className="text-[13px] text-adm-suave">{resumo(t.valor.pt)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
