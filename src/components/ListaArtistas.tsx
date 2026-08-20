"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { rotuloDisciplina, t } from "@/lib/i18n";
import { caminho, type Idioma } from "@/lib/i18n/config";
import { cx } from "@/lib/utils";

export type ArtistaLinha = {
  slug: string;
  nome: string;
  disciplina: string;
  nota: string;
  temPagina: boolean;
};

/**
 * Lista tipográfica de artistas com filtro por disciplina. Uma linha
 * por artista, como no design: a lista cresce sem mudar o layout.
 */
export function ListaArtistas({
  artistas,
  idioma,
  nota,
}: {
  artistas: ArtistaLinha[];
  idioma: Idioma;
  nota?: string;
}) {
  const [filtro, setFiltro] = useState("todos");

  const disciplinas = useMemo(() => {
    const vistas: string[] = [];
    for (const a of artistas) {
      if (!vistas.includes(a.disciplina)) vistas.push(a.disciplina);
    }
    return vistas;
  }, [artistas]);

  const visiveis =
    filtro === "todos"
      ? artistas
      : artistas.filter((a) => a.disciplina === filtro);

  return (
    <>
      {disciplinas.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2.5" role="group">
          <Chip
            activo={filtro === "todos"}
            onClick={() => setFiltro("todos")}
            rotulo={t("filtro.todos", idioma)}
          />
          {disciplinas.map((d) => (
            <Chip
              key={d}
              activo={filtro === d}
              onClick={() => setFiltro(d)}
              rotulo={rotuloDisciplina(d, idioma)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col">
        {visiveis.map((a) => (
          <Link
            key={a.slug}
            href={caminho(idioma, `/artistas/${a.slug}`)}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-[rgba(242,237,228,0.16)] py-6 text-papel transition-colors hover:text-ouro sm:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_auto] sm:gap-8 sm:py-[34px]"
          >
            <span className="titulo text-[clamp(24px,3.4vw,52px)] leading-none uppercase">
              {a.nome}
            </span>
            <span className="hidden text-[15px] text-[rgba(242,237,228,0.6)] sm:block">
              {a.nota}
            </span>
            <span className="text-[12px] tracking-[0.18em] text-[rgba(242,237,228,0.45)]">
              {a.temPagina
                ? t("acao.ver", idioma)
                : t("estado.em_breve", idioma)}
            </span>
          </Link>
        ))}

        {visiveis.length === 0 && (
          <p className="border-t border-[rgba(242,237,228,0.16)] pt-6 text-[15px] text-claro-55">
            {t("msg.sem_resultados", idioma)}
          </p>
        )}

        {nota && (
          <span className="border-t border-[rgba(242,237,228,0.16)] pt-6 text-[13px] text-[rgba(242,237,228,0.4)]">
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
}: {
  activo: boolean;
  onClick: () => void;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cx(
        "min-h-11 cursor-pointer border px-5 py-3 text-[11px] tracking-[0.18em] uppercase transition-colors",
        activo
          ? "border-papel bg-papel text-tinta"
          : "border-[rgba(242,237,228,0.25)] bg-transparent text-[rgba(242,237,228,0.7)] hover:border-papel hover:text-papel",
      )}
    >
      {rotulo}
    </button>
  );
}
