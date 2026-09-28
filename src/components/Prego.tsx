"use client";

import Link from "next/link";
import { useState } from "react";
import { ImagemObra } from "@/components/ImagemObra";
import type { MediaLeve } from "@/components/Imagem";
import { t, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";

export type ObraPrego = { slug: string; titulo: string; fotografia: MediaLeve };

/**
 * O prego da parede vazia do 404. Carregar nele pendura lá uma obra
 * disponível, ao acaso, a balançar até assentar; carregar outra vez
 * troca-a. O erro passa a ser uma descoberta.
 */
export function Prego({ obras, idioma }: { obras: ObraPrego[]; idioma: Idioma }) {
  const [escolhida, setEscolhida] = useState<ObraPrego | null>(null);

  if (obras.length === 0) return null;

  const pendurar = () => {
    const outras = obras.filter((o) => o.slug !== escolhida?.slug);
    const lista = outras.length > 0 ? outras : obras;
    setEscolhida(lista[Math.floor(Math.random() * lista.length)]);
  };

  return (
    <div className="flex flex-col items-center gap-0" aria-live="polite">
      <button
        type="button"
        onClick={pendurar}
        aria-label={t("404.prego", idioma)}
        title={t("404.prego", idioma)}
        className="prego flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
      >
        <span aria-hidden="true" className="block h-2.5 w-2.5 bg-ouro" />
      </button>

      {escolhida && (
        <figure key={escolhida.slug} className="prego-obra m-0 flex w-[min(260px,70vw)] flex-col gap-3">
          <ImagemObra
            media={escolhida.fotografia}
            alt={escolhida.titulo}
            legenda={escolhida.titulo}
            sizes="260px"
          />
          <figcaption className="flex flex-col gap-1">
            <span className="etiqueta text-claro-55">
              {t("404.prego_legenda", idioma)}
            </span>
            <Link
              href={caminho(idioma, `/obras/${escolhida.slug}`)}
              className="titulo-med text-[17px]"
            >
              {escolhida.titulo} →
            </Link>
          </figcaption>
        </figure>
      )}
    </div>
  );
}
