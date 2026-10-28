"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { IDIOMAS, type Idioma } from "@/lib/i18n/config";
import { cx } from "@/lib/utils";

/**
 * As peças comuns às fichas novas do backoffice (a obra, a exposição):
 * o topo com a língua escolhida uma vez, o "Editar | Ver no site" do
 * telemóvel, a barra de baixo que diz o que está por guardar, o aviso
 * ao sair, e os campos com a parte do site que mexem.
 *
 * Saíram da ficha da obra tal como estavam. Uma segunda cópia ia
 * divergir na primeira correcção, e o dono da galeria deve encontrar
 * a mesma barra e o mesmo selector em todas as fichas.
 */

export type TresLinguas = Record<Idioma, string>;

export const NOME_LINGUA: Record<Idioma, string> = {
  pt: "português",
  en: "inglês",
  es: "espanhol",
};

/** O selo ao lado do título, com o estado guardado. */
export const SELO: Record<string, string> = {
  publicado: "No site",
  rascunho: "Rascunho",
  arquivado: "Arquivada",
};

const eTresLinguas = (v: unknown): v is TresLinguas =>
  typeof v === "object" && v !== null && "pt" in v && "en" in v && "es" in v;

/**
 * Lista os campos que mudaram, pela ordem dos rótulos, com a língua
 * quando não é o português. Um media compara-se pelo id, uma lista
 * pela sequência (a ordem conta).
 */
export function listarAlteracoes<T extends Record<string, unknown>>(
  antes: T,
  agora: T,
  rotulos: Record<keyof T, string>,
): string[] {
  const lista: string[] = [];
  for (const campo of Object.keys(rotulos) as Array<keyof T>) {
    const a = antes[campo];
    const b = agora[campo];
    if (eTresLinguas(a) && eTresLinguas(b)) {
      for (const l of IDIOMAS) {
        if (a[l] !== b[l]) {
          lista.push(
            l === "pt" ? rotulos[campo] : `${rotulos[campo]} (${l.toUpperCase()})`,
          );
        }
      }
    } else if (Array.isArray(a) || Array.isArray(b)) {
      if (JSON.stringify(a) !== JSON.stringify(b)) lista.push(rotulos[campo]);
    } else if (
      (typeof a === "object" && a !== null) ||
      (typeof b === "object" && b !== null)
    ) {
      const id = (v: unknown) => (v as { id?: string } | null)?.id ?? null;
      if (id(a) !== id(b)) lista.push(rotulos[campo]);
    } else if (a !== b) {
      lista.push(rotulos[campo]);
    }
  }
  return lista;
}

/**
 * Sair com alterações por guardar pede confirmação: ao fechar o
 * separador ou recarregar (beforeunload), e ao carregar num link do
 * painel, que muda de página sem o navegador perguntar nada.
 */
export function useAvisoAoSair(
  porGuardar: boolean,
  aEnviar: React.RefObject<boolean>,
) {
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
  }, [porGuardar, aEnviar]);
}

/** Topo de uma ficha: de que registo se trata, se está no site, e a língua. */
export function TopoFicha({
  voltar,
  titulo,
  selos,
  lingua,
  aoMudarLingua,
  completa,
  verNoSite,
  extra,
  modo,
  aoMudarModo,
}: {
  voltar: { href: string; rotulo: string };
  titulo: string;
  /** O estado guardado, e o que mais houver a dizer ao lado do título. */
  selos: React.ReactNode;
  lingua: Idioma;
  aoMudarLingua: (l: Idioma) => void;
  /** Se uma língua já tem tudo o que o português tem. */
  completa: (l: Idioma) => boolean;
  /** Endereço da página no site, quando a versão guardada lá está. */
  verNoSite?: string | null;
  /** Antes da língua: interruptores que valem para a página inteira. */
  extra?: React.ReactNode;
  modo: "editar" | "ver";
  aoMudarModo: (m: "editar" | "ver") => void;
}) {
  return (
    <header className="z-30 flex flex-col gap-3 border-b border-adm-fio bg-adm-cartao px-6 py-3 lg:sticky lg:top-0 lg:px-8">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href={voltar.href}
          className="inline-flex min-h-11 items-center gap-2 text-[13px] no-underline"
        >
          <span aria-hidden="true">←</span> {voltar.rotulo}
        </Link>

        <div className="flex min-w-[12rem] flex-1 items-center gap-3">
          <h1
            className="titulo min-w-0 truncate text-[clamp(22px,2.4vw,28px)] leading-[1.1]"
            style={{ fontStretch: "112%" }}
          >
            {titulo}
          </h1>
          {selos}
        </div>

        {extra}

        <div className="flex items-center gap-4">
          <div
            role="group"
            aria-label="Língua a editar"
            className="flex border border-adm-fio-forte"
          >
            {IDIOMAS.map((l) => {
              const cheia = completa(l);
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={l === lingua}
                  onClick={() => aoMudarLingua(l)}
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

          {verNoSite && (
            <a
              href={verNoSite}
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
              aoMudarModo(valor);
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
  );
}

/** O selo do estado guardado, preto quando já está no site. */
export function SeloEstado({
  nova,
  estado,
  rotuloNova = "Nova",
}: {
  nova: boolean;
  estado: string;
  rotuloNova?: string;
}) {
  return (
    <span
      className={cx(
        "shrink-0 px-2 py-1 text-[10px] tracking-[0.16em] uppercase",
        estado === "publicado" && !nova
          ? "bg-tinta text-papel"
          : "border border-adm-fio-forte text-adm-suave",
      )}
    >
      {nova ? rotuloNova : (SELO[estado] ?? estado)}
    </span>
  );
}

/**
 * A barra de baixo diz sempre em que pé se está: o que está por
 * guardar, com Desfazer e Guardar, ou, com tudo guardado, a frase de
 * repouso e as acções que fazem sentido nesse momento.
 */
export function BarraAlteracoes({
  mudancas,
  publicar,
  aoDesfazer,
  aoPublicar,
  repouso,
  accoesRepouso,
}: {
  mudancas: string[];
  /** Se o estado escolhido já é publicado: então guardar é publicar. */
  publicar: boolean;
  aoDesfazer: () => void;
  aoPublicar: () => void;
  repouso: string;
  accoesRepouso: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-adm-fio-forte bg-adm-cartao px-6 py-3.5 lg:px-8">
      {mudancas.length > 0 ? (
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
              onClick={aoDesfazer}
              className="adm-botao adm-botao-linha"
            >
              Desfazer
            </button>
            {publicar ? (
              <BotaoGuardar rotulo="Guardar e publicar" />
            ) : (
              <>
                <BotaoGuardar rotulo="Guardar sem publicar" linha />
                <BotaoGuardar rotulo="Guardar e publicar" aoClicar={aoPublicar} />
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <p role="status" className="m-0 min-w-0 flex-1 basis-64 text-[14px] text-adm-suave">
            {repouso}
          </p>
          <div className="flex flex-wrap gap-2.5">{accoesRepouso}</div>
        </>
      )}
    </div>
  );
}

/** Enquanto a acção corre, o botão diz que está a guardar. */
export function BotaoGuardar({
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

/** Rótulo, campo e nota, com a parte do site que o campo mexe. */
export function Campo({
  rotulo,
  id,
  parte,
  nota,
  largo = false,
  children,
}: {
  rotulo: React.ReactNode;
  id: string;
  parte?: string;
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
export function CampoTraduzivel<C extends string>({
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
  campo: C;
  parte?: string;
  rotulo: string;
  lingua: Idioma;
  valor: TresLinguas;
  aoMudar: (campo: C, valor: string) => void;
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
      <OutrasLinguas campo={campo} lingua={lingua} valor={valor} />
    </Campo>
  );
}

/** As línguas que não estão à vista seguem escondidas no formulário. */
export function OutrasLinguas({
  campo,
  lingua,
  valor,
}: {
  campo: string;
  lingua: Idioma;
  valor: TresLinguas;
}) {
  return IDIOMAS.filter((l) => l !== lingua).map((l) => (
    <input key={l} type="hidden" name={`${campo}.${l}`} value={valor[l]} />
  ));
}

/** O aviso de que a língua escolhida ainda não está toda traduzida. */
export function AvisoTraducao({ lingua }: { lingua: Idioma }) {
  return (
    <p className="m-0 border-l-2 border-l-ouro bg-ouro-lavado px-4 py-3 text-[14px]">
      Ainda sem tradução completa: quem visita em {NOME_LINGUA[lingua]} lê o
      português onde estiver vazio. O que escrever aqui só muda a versão em{" "}
      {NOME_LINGUA[lingua]}.
    </p>
  );
}
