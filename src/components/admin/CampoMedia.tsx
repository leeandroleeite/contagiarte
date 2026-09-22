"use client";

import { useRef, useState, useTransition } from "react";
import { carregarFicheiro } from "@/lib/admin/media";
import { urlMedia } from "@/lib/media/url";
import { cx } from "@/lib/utils";

export type MediaEscolhivel = {
  id: string;
  chave: string;
  nomeOriginal: string;
  tipoMime: string;
};

/**
 * Escolha de ficheiro para um registo: mostra o que já está associado,
 * deixa carregar um novo, ou escolher um da biblioteca já existente.
 * O valor guardado no formulário é o id do media (ou vazio).
 */
export function CampoMedia({
  nome,
  rotulo,
  valor,
  biblioteca,
  tipo = "imagem",
  nota,
  largo = false,
}: {
  nome: string;
  rotulo: string;
  valor?: MediaEscolhivel | null;
  biblioteca: MediaEscolhivel[];
  tipo?: "imagem" | "documento";
  nota?: string;
  largo?: boolean;
}) {
  const [escolhido, setEscolhido] = useState<MediaEscolhivel | null>(
    valor ?? null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [aCarregar, iniciar] = useTransition();
  const [aBiblioteca, setABiblioteca] = useState(false);
  // Com trezentas e cinquenta imagens, uma grelha sem filtro é uma
  // parede. A procura é do lado do navegador porque a biblioteca já
  // veio toda com a página.
  const [procura, setProcura] = useState("");
  const entrada = useRef<HTMLInputElement>(null);

  const termo = procura.trim().toLowerCase();
  const visiveis = termo
    ? biblioteca.filter((m) => m.nomeOriginal.toLowerCase().includes(termo))
    : biblioteca;

  const enviar = (ficheiro: File) => {
    setErro(null);
    const dados = new FormData();
    dados.set("ficheiro", ficheiro);
    iniciar(async () => {
      const r = await carregarFicheiro(dados);
      if (r.ok) {
        setEscolhido({
          id: r.id,
          chave: r.chave,
          nomeOriginal: r.nome,
          tipoMime: r.tipoMime,
        });
        setABiblioteca(false);
      } else {
        setErro(r.erro);
      }
    });
  };

  const url = urlMedia(escolhido?.chave);
  const ePdf = escolhido?.tipoMime === "application/pdf";

  return (
    <div className={cx("flex flex-col", largo && "sm:col-span-2")}>
      <span className="adm-rotulo">{rotulo}</span>
      <input type="hidden" name={nome} value={escolhido?.id ?? ""} />

      <div className="flex flex-wrap items-start gap-4 border border-adm-fio bg-adm-cartao p-4">
        <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center border border-adm-fio bg-white">
          {url && !ePdf ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={url}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="px-2 text-center text-[11px] tracking-[0.16em] text-adm-suave uppercase">
              {ePdf ? "PDF" : "Sem ficheiro"}
            </span>
          )}
        </div>

        <div className="flex min-w-[220px] flex-1 flex-col gap-2.5">
          {escolhido && (
            <span className="text-[14px] break-all">
              {escolhido.nomeOriginal}
            </span>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="adm-botao adm-botao-linha"
              onClick={() => entrada.current?.click()}
              disabled={aCarregar}
            >
              {aCarregar ? "A carregar…" : "Carregar ficheiro"}
            </button>

            {biblioteca.length > 0 && (
              <button
                type="button"
                className="adm-botao adm-botao-linha"
                onClick={() => setABiblioteca((v) => !v)}
              >
                {aBiblioteca ? "Fechar biblioteca" : "Escolher da biblioteca"}
              </button>
            )}

            {escolhido && (
              <button
                type="button"
                className="adm-botao adm-botao-linha"
                onClick={() => setEscolhido(null)}
              >
                Remover
              </button>
            )}
          </div>

          {/* Escondido à vista mas não a quem ouve: carrega-se no
              botão ao lado, e sem nome este campo não dizia de que
              ficha era. */}
          <input
            ref={entrada}
            type="file"
            accept={tipo === "documento" ? "application/pdf" : "image/*"}
            aria-label={`Carregar ${tipo === "documento" ? "PDF" : "imagem"} para ${rotulo}`}
            className="so-leitor"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) enviar(f);
              e.target.value = "";
            }}
          />

          {erro && (
            <span role="alert" className="text-[13px] text-[#9B3226]">
              {erro}
            </span>
          )}
          {nota && <span className="text-[13px] text-adm-suave">{nota}</span>}
        </div>

        {aBiblioteca && (
          <div className="w-full border-t border-adm-fio pt-4">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <input
                type="search"
                value={procura}
                onChange={(e) => setProcura(e.target.value)}
                placeholder="Procurar por nome"
                aria-label="Procurar na biblioteca"
                className="min-w-[14rem] flex-1"
              />
              <span className="text-[13px] text-adm-suave">
                {visiveis.length} de {biblioteca.length}
              </span>
            </div>

            <ul className="flex max-h-[260px] w-full flex-wrap gap-2 overflow-y-auto">
            {visiveis.map((m) => {
              const src = urlMedia(m.chave);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    title={m.nomeOriginal}
                    onClick={() => {
                      setEscolhido(m);
                      setABiblioteca(false);
                    }}
                    className={cx(
                      "flex h-[74px] w-[74px] cursor-pointer items-center justify-center border bg-white p-1",
                      m.id === escolhido?.id
                        ? "border-ouro"
                        : "border-adm-fio hover:border-tinta",
                    )}
                  >
                    {src && m.tipoMime !== "application/pdf" ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={src}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] tracking-[0.14em] text-adm-suave">
                        PDF
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
            </ul>

            {visiveis.length === 0 && (
              <p className="py-4 text-[13px] text-adm-suave">
                Nada encontrado para “{procura}”.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
