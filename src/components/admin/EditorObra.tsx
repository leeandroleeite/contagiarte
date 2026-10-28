"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { flushSync, useFormStatus } from "react-dom";
import type { ObraFicha, ParteFicha } from "@/components/FichaObra";
import { BotaoApagar } from "@/components/admin/BotaoApagar";
import {
  CampoMedia,
  type MediaEscolhivel,
} from "@/components/admin/CampoMedia";
import { PreviaObra } from "@/components/admin/PreviaObra";
import type { Localizado } from "@/lib/db/schema";
import { texto } from "@/lib/i18n";
import { caminho, IDIOMAS, type Idioma } from "@/lib/i18n/config";
import { cx, slugificar } from "@/lib/utils";

/**
 * A ficha da obra no backoffice.
 *
 * O dono da galeria dizia que o formulário antigo "está muito forms e
 * não sei exatamente o que estou a alterar". Por isso, aqui:
 * - a obra aparece ao lado, como no site, e muda enquanto se escreve;
 * - a língua escolhe-se uma vez, no topo, e não em cada campo;
 * - os campos vêm agrupados pelo que fazem, com o que raramente se
 *   mexe fechado em "Mais opções";
 * - a barra de baixo diz sempre o que está por guardar.
 *
 * Os nomes dos campos enviados são os de sempre (`titulo.pt`, `slug`,
 * `disponibilidade`...): a acção `guardarObra` não mudou.
 */

type TresLinguas = Record<Idioma, string>;
const TRADUZIVEIS = ["titulo", "tecnica", "descricao", "preco"] as const;
type Traduzivel = (typeof TRADUZIVEIS)[number];

export type DadosObra = {
  fotografia: MediaEscolhivel | null;
  titulo: TresLinguas;
  artistaId: string;
  tecnica: TresLinguas;
  dimensoes: string;
  ano: string;
  descricao: TresLinguas;
  exposicaoId: string;
  disponibilidade: string;
  preco: TresLinguas;
  slug: string;
  ordem: string;
  larguraCm: string;
  alturaCm: string;
  destaque: boolean;
  estado: string;
};

/** Nomes dos campos como aparecem na barra de alterações, por esta ordem. */
const ROTULOS: Record<keyof DadosObra, string> = {
  fotografia: "Fotografia",
  titulo: "Título",
  artistaId: "Artista",
  tecnica: "Técnica",
  dimensoes: "Dimensões",
  ano: "Ano",
  descricao: "Descrição",
  exposicaoId: "Exposição",
  disponibilidade: "Disponibilidade",
  preco: "Preço",
  slug: "Endereço",
  ordem: "Ordem",
  larguraCm: "Largura real",
  alturaCm: "Altura real",
  destaque: "Carrossel da homepage",
  estado: "Estado",
};

const NOME_LINGUA: Record<Idioma, string> = {
  pt: "português",
  en: "inglês",
  es: "espanhol",
};

/** Os estados de venda do esquema, com o efeito de cada um no site. */
const DISPONIBILIDADES = [
  {
    valor: "disponivel",
    rotulo: "Disponível",
    efeito: "Mostra o preço e os botões de contacto",
  },
  {
    valor: "reservada",
    rotulo: "Reservada",
    efeito: "Mostra Reservada no lugar do preço",
  },
  {
    valor: "vendida",
    rotulo: "Vendida",
    efeito: "Mostra Vendida e tira os botões de contacto",
  },
  {
    valor: "nao_venal",
    rotulo: "Não está à venda",
    efeito: "Fica de fora do filtro das obras disponíveis",
  },
] as const;

const SELO: Record<string, string> = {
  publicado: "No site",
  rascunho: "Rascunho",
  arquivado: "Arquivada",
};

/** Lista os campos que mudaram, com a língua quando não é o português. */
function alteracoes(antes: DadosObra, agora: DadosObra): string[] {
  const lista: string[] = [];
  for (const campo of Object.keys(ROTULOS) as Array<keyof DadosObra>) {
    const a = antes[campo];
    const b = agora[campo];
    if ((TRADUZIVEIS as readonly string[]).includes(campo)) {
      for (const l of IDIOMAS) {
        if ((a as TresLinguas)[l] !== (b as TresLinguas)[l]) {
          lista.push(
            l === "pt" ? ROTULOS[campo] : `${ROTULOS[campo]} (${l.toUpperCase()})`,
          );
        }
      }
    } else if (campo === "fotografia") {
      if (antes.fotografia?.id !== agora.fotografia?.id) lista.push(ROTULOS[campo]);
    } else if (a !== b) {
      lista.push(ROTULOS[campo]);
    }
  }
  return lista;
}

/**
 * Uma língua está completa quando todos os campos traduzíveis que têm
 * português têm também texto nela. O português basta-lhe o título.
 */
function completa(dados: DadosObra, lingua: Idioma): boolean {
  if (lingua === "pt") return Boolean(dados.titulo.pt.trim());
  return TRADUZIVEIS.every(
    (c) => !dados[c].pt.trim() || Boolean(dados[c][lingua].trim()),
  );
}

const localizado = (v: TresLinguas): Localizado => ({
  pt: v.pt,
  en: v.en || null,
  es: v.es || null,
});

const numero = (v: string) => {
  const n = Number(v);
  return v.trim() && Number.isFinite(n) ? n : null;
};

export function EditorObra({
  nova,
  inicial,
  artistas,
  exposicoes,
  biblioteca,
  whatsapp,
  email,
  nota,
  guardar,
  apagar,
}: {
  nova: boolean;
  inicial: DadosObra;
  artistas: Array<{ id: string; nome: string; slug: string }>;
  exposicoes: Array<{ id: string; slug: string; titulo: Localizado }>;
  biblioteca: MediaEscolhivel[];
  whatsapp: string;
  email: string;
  nota: Localizado | null;
  guardar: (dados: FormData) => Promise<void>;
  apagar: (() => Promise<void>) | null;
}) {
  const [dados, setDados] = useState(inicial);
  const [lingua, setLingua] = useState<Idioma>("pt");
  const [foco, setFoco] = useState<ParteFicha | null>(null);
  const [modo, setModo] = useState<"editar" | "ver">("editar");
  const [erro, setErro] = useState<string | null>(null);
  // O campo da fotografia guarda a escolha por dentro; desfazer
  // recria-o com a fotografia de origem.
  const [versaoFoto, setVersaoFoto] = useState(0);
  const formulario = useRef<HTMLFormElement>(null);
  const aEnviar = useRef(false);

  const mudancas = alteracoes(inicial, dados);
  const porGuardar = mudancas.length > 0;
  const publicada = inicial.estado === "publicado";

  const muda = <C extends keyof DadosObra>(campo: C, valor: DadosObra[C]) =>
    setDados((d) => ({ ...d, [campo]: valor }));
  const mudaTraducao = (campo: Traduzivel, valor: string) =>
    setDados((d) => ({ ...d, [campo]: { ...d[campo], [lingua]: valor } }));

  // Sair com alterações por guardar pede confirmação: ao fechar o
  // separador ou recarregar (beforeunload), e ao carregar num link do
  // painel, que muda de página sem o navegador perguntar nada.
  useEffect(() => {
    if (!porGuardar) return;
    const aoSair = (e: BeforeUnloadEvent) => {
      if (aEnviar.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const aoClicar = (e: MouseEvent) => {
      if (aEnviar.current || e.defaultPrevented) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === "_blank" || link.origin !== location.origin) return;
      if (!window.confirm("Tem alterações por guardar. Sair sem guardar?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", aoSair);
    document.addEventListener("click", aoClicar, true);
    return () => {
      window.removeEventListener("beforeunload", aoSair);
      document.removeEventListener("click", aoClicar, true);
    };
  }, [porGuardar]);

  // A ficha como o site a desenharia com o que está escrito agora.
  const artista = artistas.find((a) => a.id === dados.artistaId) ?? null;
  const exposicao = exposicoes.find((e) => e.id === dados.exposicaoId) ?? null;
  const previa: ObraFicha = {
    slug: dados.slug.trim() || slugificar(dados.titulo.pt),
    titulo: localizado(dados.titulo),
    tecnica: localizado(dados.tecnica),
    dimensoes: dados.dimensoes.trim() || null,
    ano: numero(dados.ano),
    descricao: localizado(dados.descricao),
    preco: localizado(dados.preco),
    disponibilidade: dados.disponibilidade,
    larguraCm: numero(dados.larguraCm),
    alturaCm: numero(dados.alturaCm),
    fotografia: dados.fotografia ? { chave: dados.fotografia.chave } : null,
    artista: artista ? { nome: artista.nome, slug: artista.slug } : null,
    exposicao: exposicao
      ? { slug: exposicao.slug, titulo: exposicao.titulo }
      : null,
  };

  const semTraducao = lingua !== "pt" && !completa(dados, lingua);

  /** Guarda e põe no site, seja qual for o estado escolhido. */
  const publicar = () => {
    flushSync(() => muda("estado", "publicado"));
    formulario.current?.requestSubmit();
  };

  const desfazer = () => {
    setDados(inicial);
    setVersaoFoto((v) => v + 1);
    setErro(null);
  };

  const aoEnviar = (e: React.FormEvent<HTMLFormElement>) => {
    // O português do título é obrigatório. Com outra língua à vista, o
    // campo dele está escondido e o navegador não o verifica.
    if (!dados.titulo.pt.trim()) {
      e.preventDefault();
      flushSync(() => {
        setLingua("pt");
        setModo("editar");
        setErro("Falta o título em português. É o único campo obrigatório.");
      });
      document.getElementById("campo-titulo")?.focus();
      return;
    }
    aEnviar.current = true;
  };

  // O foco de qualquer campo marca a parte correspondente na ficha:
  // cada grupo diz qual é a sua em `data-parte`.
  const aoFocar = (e: React.FocusEvent<HTMLFormElement>) => {
    const parte = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-parte]",
    )?.dataset.parte;
    setFoco((parte as ParteFicha | undefined) ?? null);
  };

  const tituloPagina = dados.titulo.pt.trim() || (nova ? "Nova obra" : "Sem título");

  return (
    <form
      ref={formulario}
      action={guardar}
      onSubmit={aoEnviar}
      onFocus={aoFocar}
      onBlur={() => setFoco(null)}
      className="flex min-h-[calc(100dvh-56px)] flex-col lg:min-h-dvh"
    >
      {/* Topo: de que obra se trata, se está no site, e a língua. */}
      <header className="z-30 flex flex-col gap-3 border-b border-adm-fio bg-adm-cartao px-6 py-3 lg:sticky lg:top-0 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href="/admin/obras"
            className="inline-flex min-h-11 items-center gap-2 text-[13px] no-underline"
          >
            <span aria-hidden="true">←</span> Obras
          </Link>

          <div className="flex min-w-[12rem] flex-1 items-center gap-3">
            <h1
              className="titulo min-w-0 truncate text-[clamp(22px,2.4vw,28px)] leading-[1.1]"
              style={{ fontStretch: "112%" }}
            >
              {tituloPagina}
            </h1>
            <span
              className={cx(
                "shrink-0 px-2 py-1 text-[10px] tracking-[0.16em] uppercase",
                publicada
                  ? "bg-tinta text-papel"
                  : "border border-adm-fio-forte text-adm-suave",
              )}
            >
              {nova ? "Nova" : (SELO[inicial.estado] ?? inicial.estado)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              role="group"
              aria-label="Língua a editar"
              className="flex border border-adm-fio-forte"
            >
              {IDIOMAS.map((l) => {
                const cheia = completa(dados, l);
                return (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={l === lingua}
                    onClick={() => setLingua(l)}
                    title={`${NOME_LINGUA[l]}: ${cheia ? "completo" : "por traduzir"}`}
                    className={cx(
                      "flex min-h-11 min-w-[52px] cursor-pointer items-center justify-center gap-1.5 border-0 px-3 text-[12px] tracking-[0.14em] uppercase",
                      l === lingua
                        ? "bg-tinta text-papel"
                        : "bg-transparent text-tinta hover:bg-adm-fundo",
                    )}
                  >
                    {l}
                    <span
                      aria-hidden="true"
                      className={cx(
                        "inline-block size-1.5 border border-ouro",
                        cheia && "bg-ouro",
                      )}
                    />
                    <span className="so-leitor">
                      {cheia ? ", completo" : ", por traduzir"}
                    </span>
                  </button>
                );
              })}
            </div>

            {publicada && (
              <a
                href={caminho(lingua, `/obras/${inicial.slug}`)}
                target="_blank"
                rel="noopener"
                className="hidden min-h-11 items-center text-[12px] tracking-[0.14em] uppercase no-underline sm:inline-flex"
              >
                Ver no site ↗
              </a>
            )}
          </div>
        </div>

        {/* No telemóvel não cabem duas colunas: ou se edita, ou se vê. */}
        <div
          role="group"
          aria-label="Modo"
          className="grid grid-cols-2 border border-adm-fio-forte lg:hidden"
        >
          {(
            [
              ["editar", "Editar"],
              ["ver", "Ver no site"],
            ] as const
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={modo === valor}
              onClick={() => {
                setModo(valor);
                // A troca acontece no topo, e o que se queria ver pode
                // estar lá em baixo: volta-se ao princípio, sem deslizar.
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
              className={cx(
                "min-h-11 cursor-pointer border-0 text-[12px] tracking-[0.14em] uppercase",
                modo === valor ? "bg-tinta text-papel" : "bg-transparent text-tinta",
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </header>

      <div className="grid flex-1 items-start gap-10 px-6 pt-7 pb-12 lg:grid-cols-2 lg:px-8">
        <div
          className={cx(
            "flex min-w-0 flex-col gap-10",
            modo === "ver" && "max-lg:hidden",
          )}
        >
          {erro && (
            <p
              role="alert"
              className="border-l-2 border-l-erro bg-adm-cartao px-4 py-3 text-[14px]"
            >
              {erro}
            </p>
          )}

          <fieldset data-parte="fotografia" className="m-0 border-0 p-0">
            <legend className="titulo mb-4 p-0 text-[22px]">Fotografia</legend>
            <CampoMedia
              key={versaoFoto}
              nome="fotografiaId"
              rotulo="Fotografia da obra"
              valor={dados.fotografia}
              biblioteca={biblioteca}
              nota="É a primeira coisa que se vê, na lista e na página da obra. Sem fotografia, o site mostra um marcador com o título."
              grande
              aoMudar={(m) => muda("fotografia", m)}
            />
          </fieldset>

          <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
            <legend className="titulo mb-4 p-0 text-[22px]">
              O que o visitante lê{" "}
              <span className="font-[family-name:var(--font-texto)] text-[13px] font-normal tracking-normal text-adm-suave">
                em {NOME_LINGUA[lingua]}
              </span>
            </legend>

            {semTraducao && (
              <p className="m-0 border-l-2 border-l-ouro bg-ouro-lavado px-4 py-3 text-[14px]">
                Ainda sem tradução completa: quem visita em{" "}
                {NOME_LINGUA[lingua]} lê o português onde estiver vazio. O que
                escrever aqui só muda a versão em {NOME_LINGUA[lingua]}.
              </p>
            )}

            <CampoTraduzivel
              campo="titulo"
              parte="titulo"
              rotulo="Título"
              lingua={lingua}
              valor={dados.titulo}
              aoMudar={mudaTraducao}
              obrigatorio
            />

            <Campo rotulo="Artista" id="campo-artista" parte="artista">
              <select
                id="campo-artista"
                name="artistaId"
                value={dados.artistaId}
                onChange={(e) => muda("artistaId", e.target.value)}
              >
                <option value="">Sem artista</option>
                {artistas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </Campo>

            <CampoTraduzivel
              campo="tecnica"
              parte="tecnica"
              rotulo="Técnica"
              lingua={lingua}
              valor={dados.tecnica}
              aoMudar={mudaTraducao}
              nota="Ex. grés e pigmentos, técnica mista, colagem e spray."
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo rotulo="Dimensões" id="campo-dimensoes" parte="dimensoes">
                <input
                  id="campo-dimensoes"
                  name="dimensoes"
                  value={dados.dimensoes}
                  onChange={(e) => muda("dimensoes", e.target.value)}
                  placeholder="70 × 50 cm"
                />
              </Campo>
              <Campo rotulo="Ano" id="campo-ano" parte="ano">
                <input
                  id="campo-ano"
                  name="ano"
                  type="number"
                  value={dados.ano}
                  onChange={(e) => muda("ano", e.target.value)}
                />
              </Campo>
            </div>

            <CampoTraduzivel
              campo="descricao"
              parte="descricao"
              rotulo="Descrição"
              lingua={lingua}
              valor={dados.descricao}
              aoMudar={mudaTraducao}
              linhas={6}
            />

            <Campo rotulo="Exposição" id="campo-exposicao" parte="exposicao">
              <select
                id="campo-exposicao"
                name="exposicaoId"
                value={dados.exposicaoId}
                onChange={(e) => muda("exposicaoId", e.target.value)}
              >
                <option value="">Sem exposição</option>
                {exposicoes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {texto(e.titulo, "pt")}
                  </option>
                ))}
              </select>
            </Campo>
          </fieldset>

          <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
            <legend className="titulo mb-4 p-0 text-[22px]">Venda</legend>

            <div data-parte="preco" className="flex flex-col">
              <span className="adm-rotulo" id="rotulo-disponibilidade">
                Disponibilidade
              </span>
              <div
                role="radiogroup"
                aria-labelledby="rotulo-disponibilidade"
                className="grid grid-cols-1 gap-px border border-adm-fio-forte bg-adm-fio-forte sm:grid-cols-2"
              >
                {DISPONIBILIDADES.map((d) => {
                  const escolhida = dados.disponibilidade === d.valor;
                  return (
                    <label
                      key={d.valor}
                      className={cx(
                        "relative flex min-h-16 cursor-pointer flex-col justify-center gap-0.5 px-4 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ouro",
                        escolhida ? "bg-tinta text-papel" : "bg-white text-tinta",
                      )}
                    >
                      <input
                        type="radio"
                        name="disponibilidade"
                        value={d.valor}
                        checked={escolhida}
                        onChange={() => muda("disponibilidade", d.valor)}
                        className="so-leitor"
                      />
                      <span className="text-[15px] font-medium">{d.rotulo}</span>
                      <span
                        className={cx(
                          "text-[13px]",
                          escolhida ? "text-claro-80" : "text-adm-suave",
                        )}
                      >
                        {d.efeito}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <CampoTraduzivel
              campo="preco"
              parte="preco"
              rotulo="Preço"
              lingua={lingua}
              valor={dados.preco}
              aoMudar={mudaTraducao}
              nota={
                dados.disponibilidade === "vendida" ||
                dados.disponibilidade === "reservada"
                  ? "Com a obra vendida ou reservada, o site mostra o estado no lugar do preço."
                  : "Texto livre, ex. 1 200 €. Vazio mostra Sob consulta."
              }
            />
          </fieldset>

          <details className="group border-t border-adm-fio pt-2">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-[15px]">
              <span
                aria-hidden="true"
                className="inline-block w-3 group-open:rotate-90"
              >
                ›
              </span>
              Mais opções: endereço, ordem, medidas para o Ver na parede,
              homepage e estado
            </summary>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Campo
                rotulo="Endereço (slug)"
                id="campo-slug"
                nota="Deixe vazio para gerar a partir do título. Mudar isto parte links já divulgados."
                largo
              >
                <input
                  id="campo-slug"
                  name="slug"
                  value={dados.slug}
                  onChange={(e) => muda("slug", e.target.value)}
                />
              </Campo>

              <Campo
                rotulo="Largura real (cm)"
                id="campo-largura"
                parte="fotografia"
                nota="Usada pelo Ver na parede para acertar a escala, e para a proporção da fotografia."
              >
                <input
                  id="campo-largura"
                  name="larguraCm"
                  type="number"
                  value={dados.larguraCm}
                  onChange={(e) => muda("larguraCm", e.target.value)}
                />
              </Campo>

              <Campo rotulo="Altura real (cm)" id="campo-altura" parte="fotografia">
                <input
                  id="campo-altura"
                  name="alturaCm"
                  type="number"
                  value={dados.alturaCm}
                  onChange={(e) => muda("alturaCm", e.target.value)}
                />
              </Campo>

              <Campo
                rotulo="Ordem"
                id="campo-ordem"
                nota="Número mais baixo aparece primeiro."
              >
                <input
                  id="campo-ordem"
                  name="ordem"
                  type="number"
                  value={dados.ordem}
                  onChange={(e) => muda("ordem", e.target.value)}
                />
              </Campo>

              <Campo
                rotulo="Estado"
                id="campo-estado"
                nota="Só o que está publicado aparece no site."
              >
                <select
                  id="campo-estado"
                  name="estado"
                  value={dados.estado}
                  onChange={(e) => muda("estado", e.target.value)}
                >
                  <option value="rascunho">Rascunho (não aparece no site)</option>
                  <option value="publicado">Publicado</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </Campo>

              <label className="flex items-center gap-3 text-[15px] sm:col-span-2">
                <input
                  type="checkbox"
                  name="destaque"
                  value="1"
                  checked={dados.destaque}
                  onChange={(e) => muda("destaque", e.target.checked)}
                />
                Mostrar no carrossel da homepage
              </label>
            </div>
          </details>
        </div>

        <PreviaObra
          obra={previa}
          idioma={lingua}
          whatsapp={whatsapp}
          email={email}
          nota={texto(nota, lingua)}
          marcado={foco}
          publicada={publicada}
          className={cx(
            "lg:sticky lg:top-[96px]",
            modo === "editar" && "max-lg:hidden",
          )}
        />
      </div>

      {/* A barra de baixo diz sempre em que pé se está. */}
      <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-adm-fio-forte bg-adm-cartao px-6 py-3.5 lg:px-8">
        {porGuardar ? (
          <>
            <p
              role="status"
              className="m-0 flex min-w-0 flex-1 basis-64 items-baseline gap-2.5 text-[14px]"
            >
              <span aria-hidden="true" className="inline-block size-2.5 shrink-0 bg-ouro" />
              <span>
                <strong className="font-semibold">
                  {mudancas.length === 1
                    ? "1 alteração por guardar:"
                    : `${mudancas.length} alterações por guardar:`}
                </strong>{" "}
                {mudancas.join(", ")}
              </span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={desfazer}
                className="adm-botao adm-botao-linha"
              >
                Desfazer
              </button>
              {dados.estado === "publicado" ? (
                <BotaoGuardar rotulo="Guardar e publicar" />
              ) : (
                <>
                  <BotaoGuardar rotulo="Guardar sem publicar" linha />
                  <BotaoGuardar rotulo="Guardar e publicar" aoClicar={publicar} />
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <p role="status" className="m-0 min-w-0 flex-1 basis-64 text-[14px] text-adm-suave">
              {nova
                ? "Obra nova. Comece pela fotografia e pelo título."
                : publicada
                  ? "Tudo guardado. O que vê na pré-visualização é o que está no site."
                  : "Tudo guardado. Esta obra ainda não aparece no site."}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {nova ? (
                <Link href="/admin/obras" className="adm-botao adm-botao-linha no-underline">
                  Cancelar
                </Link>
              ) : (
                <>
                  {!publicada && (
                    <BotaoGuardar rotulo="Publicar" aoClicar={publicar} />
                  )}
                  {apagar && <BotaoApagar accao={apagar} rotulo="Apagar obra" />}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </form>
  );
}

/** Rótulo, campo e nota, com a parte da ficha que o campo mexe. */
function Campo({
  rotulo,
  id,
  parte,
  nota,
  largo = false,
  children,
}: {
  rotulo: React.ReactNode;
  id: string;
  parte?: ParteFicha;
  nota?: string;
  largo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div data-parte={parte} className={cx("flex flex-col", largo && "sm:col-span-2")}>
      <label className="adm-rotulo" htmlFor={id}>
        {rotulo}
      </label>
      {children}
      {nota && <span className="mt-1.5 text-[13px] text-adm-suave">{nota}</span>}
    </div>
  );
}

/**
 * Um campo traduzível mostra só a língua escolhida no topo. As outras
 * duas viajam escondidas no mesmo formulário, com os nomes de sempre
 * (`titulo.pt`, `titulo.en`, `titulo.es`). Vazio, o placeholder mostra
 * o português, que é o que o visitante lê nessa língua.
 */
function CampoTraduzivel({
  campo,
  parte,
  rotulo,
  lingua,
  valor,
  aoMudar,
  nota,
  linhas = 0,
  obrigatorio = false,
}: {
  campo: Traduzivel;
  parte: ParteFicha;
  rotulo: string;
  lingua: Idioma;
  valor: TresLinguas;
  aoMudar: (campo: Traduzivel, valor: string) => void;
  nota?: string;
  linhas?: number;
  obrigatorio?: boolean;
}) {
  const id = `campo-${campo}`;
  const props = {
    id,
    name: `${campo}.${lingua}`,
    value: valor[lingua],
    required: obrigatorio && lingua === "pt",
    placeholder: lingua === "pt" ? undefined : valor.pt,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => aoMudar(campo, e.target.value),
  };

  return (
    <Campo
      id={id}
      parte={parte}
      nota={nota}
      rotulo={
        <>
          {rotulo}
          {lingua !== "pt" && (
            <span className="ml-2 text-tinta">
              · {lingua}
              <span className="so-leitor"> ({NOME_LINGUA[lingua]})</span>
            </span>
          )}
        </>
      }
    >
      {linhas > 0 ? (
        <textarea rows={linhas} {...props} />
      ) : (
        <input type="text" {...props} />
      )}
      {IDIOMAS.filter((l) => l !== lingua).map((l) => (
        <input key={l} type="hidden" name={`${campo}.${l}`} value={valor[l]} />
      ))}
    </Campo>
  );
}

/** Enquanto a acção corre, o botão diz que está a guardar. */
function BotaoGuardar({
  rotulo,
  linha = false,
  aoClicar,
}: {
  rotulo: string;
  linha?: boolean;
  /** Sem isto é um botão de enviar, que guarda o estado tal como está. */
  aoClicar?: () => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type={aoClicar ? "button" : "submit"}
      onClick={aoClicar}
      disabled={pending}
      className={cx("adm-botao", linha && "adm-botao-linha")}
    >
      {pending ? "A guardar…" : rotulo}
    </button>
  );
}
