"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { BotoesCatalogo } from "@/components/BotoesCatalogo";
import { Imagem } from "@/components/Imagem";
import {
  CabecalhoExposicao,
  etiquetaExposicao,
  FichaVisita,
  linhaLugar,
  rotulosVisita,
  type ArtistaEmExposicao,
} from "@/components/PecasExposicao";
import { BotaoApagar } from "@/components/admin/BotaoApagar";
import {
  CampoMedia,
  type MediaEscolhivel,
} from "@/components/admin/CampoMedia";
import {
  AvisoTraducao,
  BarraAlteracoes,
  BotaoGuardar,
  Campo,
  CampoTraduzivel,
  listarAlteracoes,
  NOME_LINGUA,
  OutrasLinguas,
  SeloEstado,
  TopoFicha,
  useAvisoAoSair,
  type TresLinguas,
} from "@/components/admin/Ficha";
import { PreviaExposicao } from "@/components/admin/PreviaExposicao";
import type { Localizado } from "@/lib/db/schema";
import { texto } from "@/lib/i18n";
import { caminho, type Idioma } from "@/lib/i18n/config";
import { situacao } from "@/lib/situacao";
import { cx } from "@/lib/utils";

/**
 * A ficha da exposição no backoffice.
 *
 * Segue a da obra (ver `EditorObra`), com uma diferença: aqui as peças
 * do site são o próprio formulário. O título escreve-se em cima da
 * capa, as datas e o lugar ficam por baixo dele, a ficha de visita
 * edita-se no bloco escuro onde o visitante a lê. O que não tem lugar
 * à vista (texto curatorial, citação, endereço) vem agrupado por baixo,
 * com o raro fechado em "Mais opções". No telemóvel, "Ver no site"
 * mostra a página inteira, desenhada com as mesmas peças.
 *
 * Os nomes dos campos enviados são os de sempre (`titulo.pt`,
 * `dataInicio`, `artistas`...): a acção `guardarExposicao` não mudou.
 */

const TRADUZIVEIS = [
  "titulo",
  "texto",
  "horario",
  "reservas",
  "inclui",
  "citacao",
  "subtitulo",
] as const;
type Traduzivel = (typeof TRADUZIVEIS)[number];

export type DadosExposicao = {
  imagem: MediaEscolhivel | null;
  titulo: TresLinguas;
  dataInicio: string;
  dataFim: string;
  permanente: boolean;
  lugarId: string;
  /** Ids dos artistas, pela ordem em que aparecem no site. */
  artistas: string[];
  horario: TresLinguas;
  reservas: TresLinguas;
  inclui: TresLinguas;
  texto: TresLinguas;
  curadoria: string;
  citacao: TresLinguas;
  citacaoAutor: string;
  subtitulo: TresLinguas;
  slug: string;
  ordem: string;
  destaque: boolean;
  estado: string;
};

/** Nomes dos campos como aparecem na barra de alterações, por esta ordem. */
const ROTULOS: Record<keyof DadosExposicao, string> = {
  imagem: "Capa",
  titulo: "Título",
  dataInicio: "Abertura",
  dataFim: "Fecho",
  permanente: "Permanente",
  lugarId: "Lugar",
  artistas: "Artistas",
  horario: "Horário",
  reservas: "Reservas",
  inclui: "Inclui",
  texto: "Texto curatorial",
  curadoria: "Curadoria",
  citacao: "Citação",
  citacaoAutor: "Autor da citação",
  subtitulo: "Subtítulo",
  slug: "Endereço",
  ordem: "Ordem",
  destaque: "Página de entrada",
  estado: "Estado",
};

/**
 * Uma língua está completa quando todos os campos traduzíveis que têm
 * português têm também texto nela. O português basta-lhe o título.
 */
function completa(dados: DadosExposicao, lingua: Idioma): boolean {
  if (lingua === "pt") return Boolean(dados.titulo.pt.trim());
  return TRADUZIVEIS.every(
    (c) => !dados[c].pt.trim() || Boolean(dados[c][lingua].trim()),
  );
}

/** O que o visitante lê numa língua: a tradução, ou o português. */
const lido = (v: TresLinguas, l: Idioma) => v[l].trim() || v.pt.trim();

/** Duas letras para o cartão de quem ainda não tem retrato. */
function iniciais(nome: string) {
  const maiusculas = nome.replace(/[^A-ZÀ-Ý]/g, "").slice(0, 2);
  return maiusculas || nome.slice(0, 2).toUpperCase();
}

type Lugar = {
  id: string;
  nome: string;
  morada: string | null;
  localidade: Localizado | null;
};

export type CatalogoLigado = {
  id: string;
  slug: string;
  nome: Localizado;
  estado: string;
  /** Nome do PDF, quando já tem um. */
  ficheiro: string | null;
  descargas: number;
};

/** Os campos que vivem em cima da capa e do bloco escuro: sem caixa. */
const SOBRE_ESCURO =
  "min-h-0 w-full border-0 border-b border-dashed border-fio-controlo bg-transparent p-0 text-papel placeholder:text-claro-55";

export function EditorExposicao({
  id,
  inicial,
  lugares,
  artistas,
  catalogos,
  temPercurso,
  biblioteca,
  whatsapp,
  guardar,
  apagar,
}: {
  id: string | null;
  inicial: DadosExposicao;
  lugares: Lugar[];
  artistas: ArtistaEmExposicao[];
  catalogos: CatalogoLigado[];
  temPercurso: boolean;
  biblioteca: MediaEscolhivel[];
  whatsapp: string;
  guardar: (dados: FormData) => Promise<void>;
  apagar: (() => Promise<void>) | null;
}) {
  const nova = id === null;
  const [dados, setDados] = useState(inicial);
  const [lingua, setLingua] = useState<Idioma>("pt");
  const [modo, setModo] = useState<"editar" | "ver">("editar");
  const [erro, setErro] = useState<string | null>(null);
  const [trocarCapa, setTrocarCapa] = useState(false);
  // O campo da capa guarda a escolha por dentro; desfazer recria-o com
  // a capa de origem.
  const [versaoCapa, setVersaoCapa] = useState(0);
  const formulario = useRef<HTMLFormElement>(null);
  const aEnviar = useRef(false);

  const mudancas = listarAlteracoes(inicial, dados, ROTULOS);
  const porGuardar = mudancas.length > 0;
  const publicada = inicial.estado === "publicado";

  const muda = <C extends keyof DadosExposicao>(
    campo: C,
    valor: DadosExposicao[C],
  ) => setDados((d) => ({ ...d, [campo]: valor }));
  const mudaTraducao = (campo: Traduzivel, valor: string) =>
    setDados((d) => ({ ...d, [campo]: { ...d[campo], [lingua]: valor } }));

  useAvisoAoSair(porGuardar, aEnviar);

  const datas = {
    dataInicio: dados.dataInicio || null,
    dataFim: dados.dataFim || null,
    permanente: dados.permanente,
  };
  const emCartaz = situacao(datas) === "em_curso";
  const titulo = lido(dados.titulo, lingua);
  const etiqueta = etiquetaExposicao(datas, lingua);
  const lugar = lugares.find((l) => l.id === dados.lugarId) ?? null;
  const naExposicao = dados.artistas
    .map((a) => artistas.find((x) => x.id === a))
    .filter((a): a is ArtistaEmExposicao => Boolean(a));
  const porJuntar = artistas.filter((a) => !dados.artistas.includes(a.id));
  // O botão do catálogo só aparece com o documento publicado e com PDF.
  const noSite = catalogos.filter((c) => c.estado === "publicado" && c.ficheiro);
  const rotulos = rotulosVisita(lingua);
  const semTraducao = lingua !== "pt" && !completa(dados, lingua);

  /** Guarda e põe no site, seja qual for o estado escolhido. */
  const publicar = () => {
    flushSync(() => muda("estado", "publicado"));
    formulario.current?.requestSubmit();
  };

  const desfazer = () => {
    setDados(inicial);
    setVersaoCapa((v) => v + 1);
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

  /** Troca um artista com o do lado: a ordem é a do site. */
  const mover = (i: number, passo: -1 | 1) => {
    const lista = [...dados.artistas];
    [lista[i], lista[i + passo]] = [lista[i + passo], lista[i]];
    muda("artistas", lista);
  };

  const tituloPagina =
    dados.titulo.pt.trim() || (nova ? "Nova exposição" : "Sem título");
  const enderecoNovo = id
    ? `/admin/descarregaveis/novo?exposicao=${id}`
    : null;

  return (
    <form
      ref={formulario}
      action={guardar}
      onSubmit={aoEnviar}
      className="flex min-h-[calc(100dvh-56px)] flex-col lg:min-h-dvh"
    >
      <TopoFicha
        voltar={{ href: "/admin/exposicoes", rotulo: "Exposições" }}
        titulo={tituloPagina}
        selos={
          <>
            <SeloEstado nova={nova} estado={inicial.estado} />
            {emCartaz && (
              <span className="shrink-0 bg-ouro px-2 py-1 text-[10px] tracking-[0.16em] text-tinta uppercase">
                Em cartaz
              </span>
            )}
          </>
        }
        extra={
          <label
            className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[13px]"
            title="Só uma exposição abre a página de entrada: marcar esta desmarca a anterior."
          >
            <input
              type="checkbox"
              name="destaque"
              value="1"
              checked={dados.destaque}
              onChange={(e) => muda("destaque", e.target.checked)}
            />
            Abre a página de entrada do site
          </label>
        }
        lingua={lingua}
        aoMudarLingua={setLingua}
        completa={(l) => completa(dados, l)}
        verNoSite={
          publicada ? caminho(lingua, `/exposicoes/${inicial.slug}`) : null
        }
        modo={modo}
        aoMudarModo={setModo}
      />

      <div className="flex-1 px-6 pt-7 pb-12 lg:px-8">
        <div
          className={cx(
            "flex min-w-0 flex-col gap-12",
            modo === "ver" && "max-lg:hidden",
          )}
        >
          {erro && (
            <p
              role="alert"
              className="m-0 border-l-2 border-l-erro bg-adm-cartao px-4 py-3 text-[14px]"
            >
              {erro}
            </p>
          )}

          {semTraducao && <AvisoTraducao lingua={lingua} />}

          {/* O cabeçalho do site, com o título escrito por cima da capa. */}
          <section aria-labelledby="t-cabecalho" className="flex flex-col gap-3">
            <Titulo id="t-cabecalho" nota="Escreva por cima: é assim que aparece no site.">
              O cabeçalho da exposição
            </Titulo>

            <div className="previa-site @container bg-tinta text-papel">
              <CabecalhoExposicao
                imagem={dados.imagem ? { chave: dados.imagem.chave } : null}
                titulo={titulo}
                etiqueta={etiqueta}
                prioridade
                className="h-[clamp(480px,62vh,640px)]"
                canto={
                  <button
                    type="button"
                    aria-expanded={trocarCapa}
                    aria-controls="painel-capa"
                    onClick={() => setTrocarCapa((v) => !v)}
                    className="absolute top-4 right-4 z-10 min-h-11 cursor-pointer border-0 bg-papel px-4 text-[12px] tracking-[0.14em] text-tinta uppercase hover:bg-ouro"
                  >
                    {dados.imagem ? "Trocar capa" : "Escolher capa"}
                  </button>
                }
                tituloEditavel={
                  <TituloSobreCapa
                    lingua={lingua}
                    valor={dados.titulo}
                    aoMudar={(v) => mudaTraducao("titulo", v)}
                    nova={nova}
                  />
                }
              >
                <div className="pointer-events-auto mt-5 flex flex-wrap gap-2.5">
                  <Fichinha rotulo="Abre">
                    <input
                      type="date"
                      name="dataInicio"
                      value={dados.dataInicio}
                      onChange={(e) => muda("dataInicio", e.target.value)}
                      className="min-h-0 w-auto border-0 bg-transparent p-0 text-[13px] text-papel [color-scheme:dark]"
                    />
                  </Fichinha>
                  <Fichinha rotulo="Fecha">
                    <input
                      type="date"
                      name="dataFim"
                      value={dados.dataFim}
                      onChange={(e) => muda("dataFim", e.target.value)}
                      className="min-h-0 w-auto border-0 bg-transparent p-0 text-[13px] text-papel [color-scheme:dark]"
                    />
                  </Fichinha>
                  <Fichinha rotulo="Lugar">
                    <select
                      name="lugarId"
                      value={dados.lugarId}
                      onChange={(e) => muda("lugarId", e.target.value)}
                      className="min-h-0 w-auto max-w-[16rem] border-0 bg-transparent p-0 text-[13px] text-papel [color-scheme:dark]"
                    >
                      <option value="">Sem lugar</option>
                      {lugares.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nome}
                        </option>
                      ))}
                    </select>
                  </Fichinha>
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 border border-fio-controlo px-3 text-[13px]">
                    <input
                      type="checkbox"
                      name="permanente"
                      value="1"
                      checked={dados.permanente}
                      onChange={(e) => muda("permanente", e.target.checked)}
                    />
                    Permanente
                  </label>
                </div>
              </CabecalhoExposicao>
            </div>

            {/* A escolha da capa fica sempre no formulário, mesmo
                fechada: é ela que leva o `imagemId`. */}
            <div
              id="painel-capa"
              hidden={!trocarCapa}
              className="border border-adm-fio bg-adm-cartao p-5"
            >
              <CampoMedia
                key={versaoCapa}
                nome="imagemId"
                rotulo="Capa da exposição"
                valor={dados.imagem}
                biblioteca={biblioteca}
                nota="Serve de topo da página, de cartão de partilha e de fundo da página de entrada quando a exposição abre o site."
                grande
                aoMudar={(m) => muda("imagem", m)}
              />
            </div>
          </section>

          <div className="flex flex-wrap gap-x-8 gap-y-12">
            {/* Os artistas, pela ordem em que o site os mostra. */}
            <section
              aria-labelledby="t-artistas"
              className="flex min-w-0 flex-[1_1_520px] flex-col gap-3.5"
            >
              <Titulo
                id="t-artistas"
                nota={`${naExposicao.length === 1 ? "1 na exposição" : `${naExposicao.length} na exposição`} · pela ordem do site`}
              >
                Artistas
              </Titulo>

              {dados.artistas.map((a) => (
                <input key={a} type="hidden" name="artistas" value={a} />
              ))}

              <ul className="m-0 grid list-none grid-cols-2 gap-3.5 p-0 sm:grid-cols-3">
                {naExposicao.map((a, i) => (
                  <li
                    key={a.id}
                    className="flex min-w-0 flex-col border border-adm-fio bg-adm-cartao"
                  >
                    {a.retrato ? (
                      <Imagem
                        media={a.retrato}
                        alt=""
                        proporcao="1/1"
                        legenda={a.nome}
                        sizes="200px"
                        revelar={false}
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="titulo flex aspect-square items-center justify-center bg-tinta-elevada text-[34px] text-claro-65"
                      >
                        {iniciais(a.nome)}
                      </div>
                    )}
                    <div className="flex flex-col gap-1 px-3 pt-3 pb-1.5">
                      <span className="min-w-0 truncate text-[14px] font-semibold">
                        {a.nome}
                      </span>
                      <div className="-mx-1.5 flex items-center">
                        <BotaoCartao
                          rotulo={`Passar ${a.nome} para antes`}
                          disabled={i === 0}
                          onClick={() => mover(i, -1)}
                        >
                          ←
                        </BotaoCartao>
                        <BotaoCartao
                          rotulo={`Passar ${a.nome} para depois`}
                          disabled={i === naExposicao.length - 1}
                          onClick={() => mover(i, 1)}
                        >
                          →
                        </BotaoCartao>
                        <span className="flex-1" />
                        <BotaoCartao
                          rotulo={`Tirar ${a.nome} da exposição`}
                          onClick={() =>
                            muda(
                              "artistas",
                              dados.artistas.filter((x) => x !== a.id),
                            )
                          }
                        >
                          ×
                        </BotaoCartao>
                      </div>
                    </div>
                  </li>
                ))}

                {porJuntar.length > 0 && (
                  <li className="flex min-h-[200px] flex-col items-stretch justify-center gap-2.5 border border-dashed border-adm-fio-forte p-4 text-center">
                    <span aria-hidden="true" className="text-[26px] leading-none">
                      +
                    </span>
                    <label
                      htmlFor="campo-juntar-artista"
                      className="text-[12px] tracking-[0.12em] uppercase"
                    >
                      Juntar artista
                    </label>
                    <select
                      id="campo-juntar-artista"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          muda("artistas", [...dados.artistas, e.target.value]);
                        }
                      }}
                    >
                      <option value="">Escolher…</option>
                      {porJuntar.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                        </option>
                      ))}
                    </select>
                  </li>
                )}
              </ul>

              {naExposicao.length === 0 && (
                <p className="m-0 text-[13px] text-adm-suave">
                  Sem artistas, a página não mostra a secção Artistas em
                  exposição.
                </p>
              )}
            </section>

            {/* O catálogo é um descarregável ligado a esta exposição. */}
            <section
              aria-labelledby="t-catalogo"
              className="flex min-w-0 flex-[1_1_360px] flex-col gap-3.5"
            >
              <Titulo id="t-catalogo">Catálogo em PDF</Titulo>

              {catalogos.length > 0 ? (
                <div className="flex flex-col gap-4 border border-adm-fio bg-adm-cartao p-[18px]">
                  <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                    {catalogos.map((c) => (
                      <li key={c.id} className="flex items-center gap-3.5">
                        <span
                          aria-hidden="true"
                          className="flex h-[70px] w-[54px] shrink-0 items-end bg-tinta p-1.5 text-[10px] tracking-[0.14em] text-papel"
                        >
                          PDF
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5 text-[14px]">
                          <strong className="truncate font-semibold">
                            {texto(c.nome, "pt")}
                          </strong>
                          <span className="text-[13px] text-adm-suave">
                            {[
                              c.ficheiro ?? "Ainda sem ficheiro",
                              c.estado === "publicado" ? "No site" : "Rascunho",
                              c.descargas === 1
                                ? "1 descarga"
                                : `${c.descargas} descargas`,
                            ].join(" · ")}
                          </span>
                          <Link
                            href={`/admin/descarregaveis/${c.id}`}
                            className="inline-flex min-h-11 items-center self-start text-[13px]"
                          >
                            Abrir o documento
                          </Link>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <span className="text-[12px] tracking-[0.16em] text-adm-suave uppercase">
                    No site, por baixo da ficha de visita:
                  </span>
                  {noSite.length > 0 ? (
                    <div className="previa-site flex flex-wrap gap-3 bg-tinta p-4">
                      <div inert className="flex flex-wrap gap-3">
                        <BotoesCatalogo
                          catalogos={noSite}
                          idioma={lingua}
                          className="px-6 py-[15px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="m-0 border-l-2 border-l-ouro bg-ouro-lavado px-4 py-3 text-[14px]">
                      Ainda nenhum botão: o documento tem de estar publicado e
                      ter o PDF.
                    </p>
                  )}

                  {enderecoNovo && (
                    <Link
                      href={enderecoNovo}
                      className="inline-flex min-h-11 items-center self-start text-[13px]"
                    >
                      Ligar outro PDF a esta exposição
                    </Link>
                  )}
                </div>
              ) : enderecoNovo ? (
                <Link
                  href={enderecoNovo}
                  className="flex min-h-[200px] flex-col items-center justify-center gap-2.5 border border-dashed border-adm-fio-forte bg-adm-cartao p-6 text-center no-underline hover:border-ouro"
                >
                  <svg
                    aria-hidden="true"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
                  </svg>
                  <span className="text-[15px] font-semibold">
                    Juntar o catálogo em PDF
                  </span>
                  <span className="text-[13px] text-adm-suave">
                    Abre um documento novo, já ligado a esta exposição. Depois
                    de publicado com o PDF, a página da exposição ganha o botão
                    &ldquo;Descarregar o catálogo (PDF) ↓&rdquo;, por baixo da
                    ficha de visita.
                  </span>
                </Link>
              ) : (
                <p className="m-0 flex min-h-[200px] items-center justify-center border border-dashed border-adm-fio-forte bg-adm-cartao p-6 text-center text-[14px] text-adm-suave">
                  Guarde a exposição primeiro. Depois pode ligar-lhe o
                  catálogo em PDF.
                </p>
              )}
            </section>
          </div>

          {/* A ficha de visita, no bloco escuro onde o visitante a lê. */}
          <section aria-labelledby="t-visita" className="flex flex-col gap-3.5">
            <Titulo
              id="t-visita"
              nota="O quadro ao lado do texto, na página. Uma linha vazia não aparece."
            >
              Ficha de visita
            </Titulo>
            <div className="previa-site bg-tinta px-6 py-6 text-papel sm:px-8">
              <div className="max-w-[640px]">
                <FichaVisita
                  linhas={[
                    [
                      rotulos.local,
                      <span key="local" className="text-claro-80">
                        {linhaLugar(lugar, lingua) || "Sem lugar"}
                        <span className="mt-1 block text-[13px] text-claro-55">
                          Escolhe-se no cabeçalho, em Lugar.
                        </span>
                      </span>,
                    ],
                    [
                      rotulos.visitas,
                      <CampoEscuro
                        key="horario"
                        campo="horario"
                        rotulo="Horário"
                        lingua={lingua}
                        valor={dados.horario}
                        aoMudar={mudaTraducao}
                        exemplo="Ex. Quarta a domingo, 9h30 às 18h00."
                      />,
                    ],
                    [
                      rotulos.inclui,
                      <CampoEscuro
                        key="inclui"
                        campo="inclui"
                        rotulo="O que inclui"
                        lingua={lingua}
                        valor={dados.inclui}
                        aoMudar={mudaTraducao}
                        exemplo="Ex. Acesso à adega e prova de vinhos."
                      />,
                    ],
                    [
                      rotulos.reservas,
                      <CampoEscuro
                        key="reservas"
                        campo="reservas"
                        rotulo="Reservas"
                        lingua={lingua}
                        valor={dados.reservas}
                        aoMudar={mudaTraducao}
                        exemplo="Ex. telefone e email da reserva."
                      />,
                    ],
                  ]}
                />
              </div>
            </div>
          </section>

          <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
            <legend className="titulo mb-4 p-0 text-[22px]">
              O texto da exposição{" "}
              <span className="font-[family-name:var(--font-texto)] text-[13px] font-normal tracking-normal text-adm-suave">
                em {NOME_LINGUA[lingua]}
              </span>
            </legend>
            <CampoTraduzivel
              campo="texto"
              rotulo="Texto curatorial"
              lingua={lingua}
              valor={dados.texto}
              aoMudar={mudaTraducao}
              linhas={10}
              nota="Separe parágrafos com uma linha em branco. O primeiro aparece maior, logo por baixo da capa."
            />
            <Campo
              rotulo="Curadoria"
              id="campo-curadoria"
              nota="Linha pequena no fim do texto. Ex. Curadoria de Ana Silva."
            >
              <input
                id="campo-curadoria"
                name="curadoria"
                value={dados.curadoria}
                onChange={(e) => muda("curadoria", e.target.value)}
              />
            </Campo>
          </fieldset>

          <fieldset className="m-0 flex flex-col gap-5 border-0 p-0">
            <legend className="titulo mb-4 p-0 text-[22px]">A citação</legend>
            <CampoTraduzivel
              campo="citacao"
              rotulo="Citação"
              lingua={lingua}
              valor={dados.citacao}
              aoMudar={mudaTraducao}
              linhas={3}
              nota="Aparece em letra grande, num bloco claro a meio da página. Vazia, o bloco não aparece."
            />
            <Campo rotulo="Autor da citação" id="campo-citacao-autor">
              <input
                id="campo-citacao-autor"
                name="citacaoAutor"
                value={dados.citacaoAutor}
                onChange={(e) => muda("citacaoAutor", e.target.value)}
              />
            </Campo>
          </fieldset>

          <details className="group border-t border-adm-fio pt-2">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-[15px]">
              <span
                aria-hidden="true"
                className="inline-block w-3 group-open:rotate-90"
              >
                ›
              </span>
              Mais opções: endereço, subtítulo, ordem e estado
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

              <div className="sm:col-span-2">
                <CampoTraduzivel
                  campo="subtitulo"
                  rotulo="Subtítulo"
                  lingua={lingua}
                  valor={dados.subtitulo}
                  aoMudar={mudaTraducao}
                  nota="Fica guardado, mas a página da exposição ainda não o mostra."
                />
              </div>

              <Campo
                rotulo="Ordem"
                id="campo-ordem"
                nota="Entre exposições com a mesma data, número mais baixo aparece primeiro."
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
            </div>
          </details>
        </div>

        <PreviaExposicao
          idioma={lingua}
          publicada={publicada}
          slug={dados.slug.trim() || inicial.slug}
          className={cx("lg:hidden", modo === "editar" && "hidden")}
          imagem={dados.imagem ? { chave: dados.imagem.chave } : null}
          titulo={titulo}
          etiqueta={etiqueta}
          texto={lido(dados.texto, lingua)}
          curadoria={dados.curadoria.trim() || null}
          ficha={(
            [
              [rotulos.local, linhaLugar(lugar, lingua)],
              [rotulos.visitas, lido(dados.horario, lingua)],
              [rotulos.inclui, lido(dados.inclui, lingua)],
              [rotulos.reservas, lido(dados.reservas, lingua)],
            ] as Array<[string, string]>
          ).filter(([, v]) => v)}
          citacao={lido(dados.citacao, lingua)}
          citacaoAutor={dados.citacaoAutor.trim() || null}
          artistas={naExposicao}
          catalogos={noSite}
          temPercurso={temPercurso}
          whatsapp={whatsapp}
        />
      </div>

      <BarraAlteracoes
        mudancas={mudancas}
        publicar={dados.estado === "publicado"}
        aoDesfazer={desfazer}
        aoPublicar={publicar}
        repouso={
          nova
            ? "Exposição nova. Comece pelo título, em cima da capa."
            : publicada
              ? "Tudo guardado. O que vê aqui é o que está no site."
              : "Tudo guardado. Esta exposição ainda não aparece no site."
        }
        accoesRepouso={
          nova ? (
            <Link
              href="/admin/exposicoes"
              className="adm-botao adm-botao-linha no-underline"
            >
              Cancelar
            </Link>
          ) : (
            <>
              {!publicada && <BotaoGuardar rotulo="Publicar" aoClicar={publicar} />}
              {apagar && (
                <BotaoApagar
                  accao={apagar}
                  rotulo="Apagar exposição"
                  pergunta="Apagar esta exposição? As salas do percurso vão com ela."
                />
              )}
            </>
          )
        }
      />
    </form>
  );
}

/** Título de bloco, com uma nota curta ao lado. */
function Titulo({
  id,
  nota,
  children,
}: {
  id: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id={id} className="titulo m-0 text-[22px]">
        {children}
      </h2>
      {nota && <span className="text-[13px] text-adm-suave">{nota}</span>}
    </div>
  );
}

/**
 * O título escreve-se em cima da capa, com a letra do site. Uma
 * caixa de texto não cresce sozinha: por baixo dela vai uma cópia
 * invisível do que está escrito, que dá a altura, e o título pode
 * ocupar as linhas que ocupa na página.
 */
function TituloSobreCapa({
  lingua,
  valor,
  aoMudar,
  nova,
}: {
  lingua: Idioma;
  valor: TresLinguas;
  aoMudar: (v: string) => void;
  nova: boolean;
}) {
  const letra =
    "titulo mt-3.5 tracking-[-0.02em] uppercase text-[length:clamp(34px,8cqi,104px)] leading-[0.92]";
  const exemplo =
    lingua === "pt" ? (nova ? "Título da exposição" : "") : valor.pt;
  return (
    <div className="pointer-events-auto grid">
      <label htmlFor="campo-titulo" className="so-leitor">
        Título{lingua !== "pt" ? ` (${NOME_LINGUA[lingua]})` : ""}
      </label>
      <span
        aria-hidden="true"
        className={cx(
          letra,
          "invisible col-start-1 row-start-1 border-b border-transparent break-words whitespace-pre-wrap",
        )}
      >
        {(valor[lingua] || exemplo) + " "}
      </span>
      <textarea
        id="campo-titulo"
        name={`titulo.${lingua}`}
        rows={1}
        value={valor[lingua]}
        required={lingua === "pt"}
        placeholder={exemplo || undefined}
        onChange={(e) => aoMudar(e.target.value.replace(/\n/g, " "))}
        onKeyDown={(e) => {
          // Um título não tem parágrafos: Enter não parte a linha.
          if (e.key === "Enter") e.preventDefault();
        }}
        className={cx(
          letra,
          SOBRE_ESCURO,
          "col-start-1 row-start-1 resize-none overflow-hidden",
        )}
      />
      <OutrasLinguas campo="titulo" lingua={lingua} valor={valor} />
    </div>
  );
}

/** Uma das caixinhas por baixo do título: rótulo e campo. */
function Fichinha({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 border border-fio-controlo px-3 text-[13px]">
      {rotulo}
      {children}
    </label>
  );
}

/** Um valor da ficha de visita, escrito no próprio bloco escuro. */
function CampoEscuro({
  campo,
  rotulo,
  lingua,
  valor,
  aoMudar,
  exemplo,
}: {
  campo: Traduzivel;
  rotulo: string;
  lingua: Idioma;
  valor: TresLinguas;
  aoMudar: (campo: Traduzivel, valor: string) => void;
  exemplo: string;
}) {
  const id = `campo-${campo}`;
  return (
    <>
      <label htmlFor={id} className="so-leitor">
        {rotulo}
        {lingua !== "pt" ? ` (${NOME_LINGUA[lingua]})` : ""}
      </label>
      <textarea
        id={id}
        name={`${campo}.${lingua}`}
        rows={2}
        value={valor[lingua]}
        placeholder={lingua === "pt" ? exemplo : valor.pt || exemplo}
        onChange={(e) => aoMudar(campo, e.target.value)}
        className={cx(SOBRE_ESCURO, "corpo resize-y py-1")}
      />
      <OutrasLinguas campo={campo} lingua={lingua} valor={valor} />
    </>
  );
}

/** Os botões pequenos dos cartões de artista. */
function BotaoCartao({
  rotulo,
  disabled = false,
  onClick,
  children,
}: {
  rotulo: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 cursor-pointer items-center justify-center border-0 bg-transparent text-[20px] text-tinta hover:text-ouro disabled:cursor-default disabled:opacity-30"
    >
      {children}
    </button>
  );
}
