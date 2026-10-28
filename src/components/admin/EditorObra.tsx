"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { ObraFicha, ParteFicha } from "@/components/FichaObra";
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
  SeloEstado,
  TopoFicha,
  useAvisoAoSair,
  type TresLinguas,
} from "@/components/admin/Ficha";
import { PreviaObra } from "@/components/admin/PreviaObra";
import type { Localizado } from "@/lib/db/schema";
import { texto } from "@/lib/i18n";
import { caminho, type Idioma } from "@/lib/i18n/config";
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

  const mudancas = listarAlteracoes(inicial, dados, ROTULOS);
  const porGuardar = mudancas.length > 0;
  const publicada = inicial.estado === "publicado";

  const muda = <C extends keyof DadosObra>(campo: C, valor: DadosObra[C]) =>
    setDados((d) => ({ ...d, [campo]: valor }));
  const mudaTraducao = (campo: Traduzivel, valor: string) =>
    setDados((d) => ({ ...d, [campo]: { ...d[campo], [lingua]: valor } }));

  useAvisoAoSair(porGuardar, aEnviar);

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
      <TopoFicha
        voltar={{ href: "/admin/obras", rotulo: "Obras" }}
        titulo={tituloPagina}
        selos={<SeloEstado nova={nova} estado={inicial.estado} />}
        lingua={lingua}
        aoMudarLingua={setLingua}
        completa={(l) => completa(dados, l)}
        verNoSite={publicada ? caminho(lingua, `/obras/${inicial.slug}`) : null}
        modo={modo}
        aoMudarModo={setModo}
      />

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

            {semTraducao && <AvisoTraducao lingua={lingua} />}

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
      <BarraAlteracoes
        mudancas={mudancas}
        publicar={dados.estado === "publicado"}
        aoDesfazer={desfazer}
        aoPublicar={publicar}
        repouso={
          nova
            ? "Obra nova. Comece pela fotografia e pelo título."
            : publicada
              ? "Tudo guardado. O que vê na pré-visualização é o que está no site."
              : "Tudo guardado. Esta obra ainda não aparece no site."
        }
        accoesRepouso={
          nova ? (
            <Link href="/admin/obras" className="adm-botao adm-botao-linha no-underline">
              Cancelar
            </Link>
          ) : (
            <>
              {!publicada && <BotaoGuardar rotulo="Publicar" aoClicar={publicar} />}
              {apagar && <BotaoApagar accao={apagar} rotulo="Apagar obra" />}
            </>
          )
        }
      />
    </form>
  );
}
