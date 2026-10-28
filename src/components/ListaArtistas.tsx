"use client";

import Link from "next/link";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { caminho, type Idioma } from "@/lib/i18n/config";
import { cx } from "@/lib/utils";

export type ArtistaLinha = {
  slug: string;
  nome: string;
  /** Slug da tipologia, ou nada quando o artista ainda não tem. */
  disciplina: string | null;
  nota: string;
  temPagina: boolean;
};

/** Uma tipologia do filtro, já traduzida. */
export type TipologiaFiltro = {
  slug: string;
  nome: string;
  nota: string;
};

/**
 * Lista tipográfica de artistas com filtro por tipologia. Uma linha
 * por artista, como no design: a lista cresce sem mudar o layout.
 *
 * As tipologias vêm do backoffice, já pela ordem certa e só as que têm
 * artistas publicados.
 */
export function ListaArtistas({
  artistas,
  tipologias,
  idioma,
  nota,
}: {
  artistas: ArtistaLinha[];
  tipologias: TipologiaFiltro[];
  idioma: Idioma;
  nota?: string;
}) {
  const [filtro, setFiltro] = useState("todos");

  const visiveis =
    filtro === "todos"
      ? artistas
      : artistas.filter((a) => a.disciplina === filtro);

  return (
    <>
      {tipologias.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2.5" role="group">
          <Chip
            activo={filtro === "todos"}
            onClick={() => setFiltro("todos")}
            rotulo={t("filtro.todos", idioma)}
          />
          {tipologias.map((d) => (
            <Chip
              key={d.slug}
              activo={filtro === d.slug}
              onClick={() => setFiltro(d.slug)}
              rotulo={d.nome}
              dica={d.nota}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col">
        {visiveis.map((a) => (
          <Link
            key={a.slug}
            href={caminho(idioma, `/artistas/${a.slug}`)}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-fio py-6 text-papel transition-colors hover:text-ouro sm:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_auto] sm:gap-8 sm:py-[34px]"
          >
            <span className="titulo d-apoio leading-none uppercase">
              {a.nome}
            </span>
            <span className="hidden text-[15px] text-claro-65 sm:block">
              {a.nota}
            </span>
            <span className="text-[12px] tracking-[0.18em] text-claro-55">
              {a.temPagina
                ? t("acao.ver", idioma)
                : t("estado.em_breve", idioma)}
            </span>
          </Link>
        ))}

        {visiveis.length === 0 && (
          <p className="corpo border-t border-fio pt-6 text-claro-55">
            {t("msg.sem_resultados", idioma)}
          </p>
        )}

        {nota && (
          <span className="meta border-t border-fio pt-6 text-claro-55">
            {nota}
          </span>
        )}
      </div>
    </>
  );
}

function Chip({
  activo,
  onClick,
  rotulo,
  dica,
}: {
  activo: boolean;
  onClick: () => void;
  rotulo: string;
  /** O que a tipologia abrange, ex. "serigrafia, gravura". */
  dica?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      title={dica || undefined}
      className={cx(
        "etiqueta min-h-11 cursor-pointer border px-5 py-3 transition-colors",
        activo
          ? "border-papel bg-papel text-tinta"
          : "border-fio-forte bg-transparent text-claro-65 hover:border-papel hover:text-papel",
      )}
    >
      {rotulo}
    </button>
  );
}
