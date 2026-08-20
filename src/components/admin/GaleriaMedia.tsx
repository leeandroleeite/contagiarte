"use client";

import { useRef, useState, useTransition } from "react";
import { apagarMedia, carregarFicheiro, guardarAlt } from "@/lib/admin/media";
import type { Localizado } from "@/lib/db/schema";
import { urlMedia } from "@/lib/media/url";

export type ItemMedia = {
  id: string;
  chave: string;
  nomeOriginal: string;
  tipoMime: string;
  tamanho: number;
  largura: number | null;
  altura: number | null;
  alt: Localizado | null;
};

/**
 * Biblioteca de ficheiros. Carregar, editar o texto alternativo e
 * apagar. O texto alternativo é o que os leitores de ecrã anunciam,
 * por isso vale a pena estar aqui à mão.
 */
export function GaleriaMedia({ itens }: { itens: ItemMedia[] }) {
  const [aCarregar, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const enviar = (ficheiros: FileList) => {
    setErro(null);
    iniciar(async () => {
      for (const f of Array.from(ficheiros)) {
        const dados = new FormData();
        dados.set("ficheiro", f);
        const r = await carregarFicheiro(dados);
        if (!r.ok) {
          setErro(`${f.name}: ${r.erro}`);
          break;
        }
      }
    });
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="adm-botao"
          disabled={aCarregar}
          onClick={() => entrada.current?.click()}
        >
          {aCarregar ? "A carregar…" : "Carregar ficheiros"}
        </button>
        <input
          ref={entrada}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="so-leitor"
          onChange={(e) => {
            if (e.target.files?.length) enviar(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="text-[14px] text-adm-suave">
          Imagens e PDFs, até 25 MB cada.
        </span>
      </div>

      {erro && (
        <p role="alert" className="mb-6 text-[14px] text-[#9B3226]">
          {erro}
        </p>
      )}

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {itens.map((m) => (
          <Cartao key={m.id} media={m} />
        ))}
      </ul>
    </>
  );
}

function Cartao({ media }: { media: ItemMedia }) {
  const [alt, setAlt] = useState(media.alt?.pt ?? "");
  const [guardado, setGuardado] = useState(false);
  const [aGuardar, iniciar] = useTransition();
  const url = urlMedia(media.chave);
  const ePdf = media.tipoMime === "application/pdf";

  return (
    <li className="flex flex-col gap-3 border border-adm-fio bg-adm-cartao p-4">
      <div className="flex h-[160px] items-center justify-center border border-adm-fio bg-white">
        {url && !ePdf ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={url}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-[12px] tracking-[0.16em] text-adm-suave uppercase">
            PDF
          </span>
        )}
      </div>

      <span className="text-[13px] break-all">{media.nomeOriginal}</span>
      <span className="text-[12px] text-adm-suave">
        {media.largura && media.altura
          ? `${media.largura} × ${media.altura} px · `
          : ""}
        {(media.tamanho / 1024 / 1024).toFixed(2)} MB
      </span>

      <div>
        <label className="adm-rotulo" htmlFor={`alt-${media.id}`}>
          Texto alternativo
        </label>
        <input
          id={`alt-${media.id}`}
          value={alt}
          onChange={(e) => {
            setAlt(e.target.value);
            setGuardado(false);
          }}
          placeholder="O que se vê nesta imagem"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="adm-botao adm-botao-linha"
          disabled={aGuardar}
          onClick={() =>
            iniciar(async () => {
              await guardarAlt(media.id, { pt: alt });
              setGuardado(true);
            })
          }
        >
          {aGuardar ? "A guardar…" : "Guardar"}
        </button>

        <button
          type="button"
          className="adm-botao adm-botao-perigo"
          onClick={() => {
            if (
              !window.confirm(
                "Apagar este ficheiro? Sai do armazenamento e das páginas que o usam.",
              )
            )
              return;
            iniciar(async () => {
              await apagarMedia(media.id);
            });
          }}
        >
          Apagar
        </button>

        {guardado && (
          <span role="status" className="text-[13px] text-[#3D633D]">
            guardado
          </span>
        )}
      </div>
    </li>
  );
}
