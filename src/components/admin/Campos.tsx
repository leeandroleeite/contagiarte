"use client";

import { useState } from "react";
import type { Localizado } from "@/lib/db/schema";
import { IDIOMAS, NOME_IDIOMA, type Idioma } from "@/lib/i18n/config";
import { cx } from "@/lib/utils";

/** Envolve um campo com rótulo e nota de ajuda. */
export function Bloco({
  rotulo,
  nota,
  htmlFor,
  children,
  largo = false,
}: {
  rotulo: string;
  nota?: string;
  htmlFor?: string;
  children: React.ReactNode;
  largo?: boolean;
}) {
  return (
    <div className={cx("flex flex-col", largo && "sm:col-span-2")}>
      <label className="adm-rotulo" htmlFor={htmlFor}>
        {rotulo}
      </label>
      {children}
      {nota && (
        <span className="mt-1.5 text-[13px] text-adm-suave">{nota}</span>
      )}
    </div>
  );
}

export function CampoTexto({
  nome,
  rotulo,
  valor,
  nota,
  tipo = "text",
  obrigatorio = false,
  placeholder,
  largo = false,
}: {
  nome: string;
  rotulo: string;
  valor?: string | number | null;
  nota?: string;
  tipo?: "text" | "number" | "email" | "url" | "date" | "password";
  obrigatorio?: boolean;
  placeholder?: string;
  largo?: boolean;
}) {
  return (
    <Bloco rotulo={rotulo} nota={nota} htmlFor={nome} largo={largo}>
      <input
        id={nome}
        name={nome}
        type={tipo}
        defaultValue={valor ?? ""}
        required={obrigatorio}
        placeholder={placeholder}
      />
    </Bloco>
  );
}

export function CampoSelect({
  nome,
  rotulo,
  valor,
  opcoes,
  nota,
  largo = false,
}: {
  nome: string;
  rotulo: string;
  valor?: string | null;
  opcoes: Array<{ valor: string; rotulo: string }>;
  nota?: string;
  largo?: boolean;
}) {
  return (
    <Bloco rotulo={rotulo} nota={nota} htmlFor={nome} largo={largo}>
      <select id={nome} name={nome} defaultValue={valor ?? ""}>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </Bloco>
  );
}

export function CampoInterruptor({
  nome,
  rotulo,
  valor,
  nota,
}: {
  nome: string;
  rotulo: string;
  valor?: boolean;
  nota?: string;
}) {
  return (
    <div className="flex flex-col">
      <label className="flex items-center gap-3 text-[15px]">
        <input type="checkbox" name={nome} defaultChecked={valor} value="1" />
        {rotulo}
      </label>
      {nota && (
        <span className="mt-1.5 text-[13px] text-adm-suave">{nota}</span>
      )}
    </div>
  );
}

/**
 * Escala de 0 a 100, com o número à vista enquanto se arrasta.
 *
 * Um cursor sem valor obriga a guardar para saber onde se ficou, e a
 * diferença entre 30 e 40 não se vê no cursor.
 */
export function CampoEscala({
  nome,
  rotulo,
  valor = 0,
  passo = 5,
  nota,
  legendas,
  largo = false,
}: {
  nome: string;
  rotulo: string;
  valor?: number;
  passo?: number;
  nota?: string;
  /** O que significam as pontas, ex. ["fundido", "destacado"]. */
  legendas?: [string, string];
  largo?: boolean;
}) {
  const [actual, setActual] = useState(valor);

  return (
    <Bloco rotulo={rotulo} nota={nota} htmlFor={nome} largo={largo}>
      <div className="flex items-center gap-4">
        <input
          id={nome}
          name={nome}
          type="range"
          min={0}
          max={100}
          step={passo}
          value={actual}
          onChange={(e) => setActual(Number(e.target.value))}
          className="min-w-0 flex-1"
        />
        <output
          htmlFor={nome}
          className="w-12 shrink-0 text-right text-[15px] tabular-nums"
        >
          {actual}
        </output>
      </div>
      {legendas && (
        <div className="mt-1 flex justify-between text-[12px] text-adm-suave">
          <span>{legendas[0]}</span>
          <span>{legendas[1]}</span>
        </div>
      )}
    </Bloco>
  );
}

/**
 * Campo traduzível. Guarda um valor por idioma no mesmo formulário,
 * com separadores PT / EN / ES. O português é obrigatório porque é a
 * língua de origem; os outros dois caem para ele quando ficam vazios.
 *
 * Os três valores viajam como `<nome>.pt`, `<nome>.en` e `<nome>.es`.
 */
export function CampoLocalizado({
  nome,
  rotulo,
  valor,
  nota,
  linhas = 0,
  obrigatorio = false,
  largo = false,
}: {
  nome: string;
  rotulo: string;
  valor?: Localizado | null;
  nota?: string;
  /** Maior que zero desenha uma caixa de texto com esse número de linhas. */
  linhas?: number;
  obrigatorio?: boolean;
  largo?: boolean;
}) {
  const [activo, setActivo] = useState<Idioma>("pt");

  return (
    // `data-campo` identifica este campo sem depender da estrutura à
    // volta: serve para os testes e para qualquer código que precise
    // de chegar a um campo traduzível em concreto.
    <div
      data-campo={nome}
      className={cx("flex flex-col", largo && "sm:col-span-2")}
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="adm-rotulo mb-0">{rotulo}</span>
        <div
          className="flex gap-1"
          role="group"
          aria-label={`Idioma de ${rotulo}`}
        >
          {IDIOMAS.map((id) => {
            const preenchido = Boolean(valor?.[id]?.trim());
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActivo(id)}
                aria-pressed={id === activo}
                title={
                  preenchido
                    ? NOME_IDIOMA[id]
                    : `${NOME_IDIOMA[id]} (por traduzir)`
                }
                className={cx(
                  "cursor-pointer border px-2 py-1 text-[10px] tracking-[0.16em] uppercase",
                  id === activo
                    ? "border-tinta bg-tinta text-papel"
                    : preenchido
                      ? "border-adm-fio-forte text-tinta"
                      : "border-adm-fio text-adm-suave",
                )}
              >
                {id}
                {!preenchido && id !== "pt" && (
                  <span aria-hidden="true"> ·</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {IDIOMAS.map((id) => (
        <div key={id} hidden={id !== activo}>
          {linhas > 0 ? (
            <textarea
              name={`${nome}.${id}`}
              rows={linhas}
              defaultValue={valor?.[id] ?? ""}
              required={obrigatorio && id === "pt"}
              placeholder={
                id === "pt" ? "" : "Vazio significa: mostrar o português."
              }
            />
          ) : (
            <input
              type="text"
              name={`${nome}.${id}`}
              defaultValue={valor?.[id] ?? ""}
              required={obrigatorio && id === "pt"}
              placeholder={
                id === "pt" ? "" : "Vazio significa: mostrar o português."
              }
            />
          )}
        </div>
      ))}

      {nota && <span className="mt-1.5 text-[13px] text-adm-suave">{nota}</span>}
    </div>
  );
}
