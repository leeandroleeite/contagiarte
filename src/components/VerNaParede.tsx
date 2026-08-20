"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { urlMedia } from "@/lib/media/url";
import { cx, linkWhatsApp } from "@/lib/utils";

export type ObraParede = {
  slug: string;
  titulo: string;
  autor: string;
  chave: string | null;
  larguraCm: number | null;
};

export type MolduraParede = {
  slug: string;
  nome: string;
  cor: string;
  espessuraMm: number;
};

/**
 * Simulador "a obra na sua parede".
 *
 * A fotografia da parede fica só no navegador (object URL): nunca é
 * enviada para o servidor, e é isso que a nota de privacidade promete.
 * A escala sai da razão entre a largura real da parede indicada pelo
 * visitante e a largura da fotografia no ecrã.
 */
export function VerNaParede({
  idioma,
  obras,
  molduras,
  whatsapp,
  obraInicial,
}: {
  idioma: Idioma;
  obras: ObraParede[];
  molduras: MolduraParede[];
  whatsapp: string;
  obraInicial?: string;
}) {
  const palco = useRef<HTMLDivElement>(null);
  const [parede, setParede] = useState<string | null>(null);
  const [obraSlug, setObraSlug] = useState(
    obraInicial && obras.some((o) => o.slug === obraInicial)
      ? obraInicial
      : (obras[0]?.slug ?? ""),
  );
  const [molduraSlug, setMolduraSlug] = useState(
    molduras[0]?.slug ?? "sem-moldura",
  );
  // `null` significa "usar a largura real da obra"; assim que o
  // visitante mexe no cursor, passa a mandar o valor escolhido.
  const [larguraEscolhida, setLarguraEscolhida] = useState<number | null>(null);
  const [larguraParede, setLarguraParede] = useState(300);
  const [pos, setPos] = useState({ x: 50, y: 45 });
  const [aArrastar, setAArrastar] = useState(false);

  const obra = obras.find((o) => o.slug === obraSlug) ?? obras[0];
  const moldura =
    molduras.find((m) => m.slug === molduraSlug) ?? molduras[0];

  const larguraObra = larguraEscolhida ?? obra?.larguraCm ?? 70;

  // Liberta o object URL quando a fotografia muda ou o componente sai.
  useEffect(() => {
    return () => {
      if (parede) URL.revokeObjectURL(parede);
    };
  }, [parede]);

  const escolherFicheiro = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ficheiro = e.target.files?.[0];
    if (!ficheiro) return;
    if (parede) URL.revokeObjectURL(parede);
    setParede(URL.createObjectURL(ficheiro));
  };

  const mover = (e: React.PointerEvent) => {
    if (!aArrastar || !palco.current) return;
    const r = palco.current.getBoundingClientRect();
    setPos({
      x: Math.min(97, Math.max(3, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.min(97, Math.max(3, ((e.clientY - r.top) / r.height) * 100)),
    });
  };

  // Percentagem da largura do palco que a obra deve ocupar.
  const proporcao = Math.min(
    90,
    Math.max(2, (larguraObra / Math.max(larguraParede, 1)) * 100),
  );

  const mensagem = obra
    ? `Olá, vi a obra "${obra.titulo}"${obra.autor ? `, de ${obra.autor}` : ""} no simulador do site, com ${larguraObra} cm de largura e moldura "${moldura?.nome ?? "sem moldura"}". Queria saber o preço.`
    : "Olá, queria saber o preço de uma obra com moldura.";

  const srcObra = urlMedia(obra?.chave);

  return (
    <div
      className="grid gap-12"
      style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}
    >
      {/* Palco -------------------------------------------------------- */}
      <div className="flex flex-col gap-3">
        <div
          ref={palco}
          onPointerMove={mover}
          onPointerUp={() => setAArrastar(false)}
          onPointerLeave={() => setAArrastar(false)}
          className="relative aspect-[4/3] w-full touch-none overflow-hidden border border-[rgba(242,237,228,0.2)] bg-[#151211]"
          style={
            parede
              ? {
                  backgroundImage: `url(${parede})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {!parede && (
            <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="text-[11px] tracking-[0.24em] text-[rgba(242,237,228,0.55)] uppercase">
                {t("parede.carregar", idioma)}
              </span>
              <span className="text-[13px] text-[rgba(242,237,228,0.35)]">
                {t("parede.privado", idioma)}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={escolherFicheiro}
                className="so-leitor"
              />
            </label>
          )}

          {parede && srcObra && obra && (
            <div
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setAArrastar(true);
              }}
              role="img"
              aria-label={`${obra.titulo}, na sua parede`}
              className={cx(
                "absolute -translate-x-1/2 -translate-y-1/2 select-none",
                aArrastar ? "cursor-grabbing" : "cursor-grab",
              )}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${proporcao}%`,
                padding: moldura?.espessuraMm
                  ? `${Math.max(2, moldura.espessuraMm / 6)}%`
                  : 0,
                background:
                  moldura?.cor === "transparent"
                    ? "transparent"
                    : (moldura?.cor ?? "transparent"),
                boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
              }}
            >
              {/* Imagem simples: o next/image não ajuda num elemento
                  que muda de tamanho a cada movimento do cursor. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={srcObra}
                alt=""
                draggable={false}
                className="block w-full"
              />
            </div>
          )}

          {parede && !srcObra && (
            <p className="absolute inset-x-6 bottom-6 text-[13px] text-[rgba(242,237,228,0.6)]">
              {t("msg.sem_imagem", idioma)}
            </p>
          )}
        </div>

        <p className="text-[12px] tracking-[0.16em] text-[rgba(242,237,228,0.45)] uppercase">
          {parede ? t("parede.arraste", idioma) : t("parede.privado", idioma)}
        </p>

        {parede && (
          <label className="cursor-pointer self-start text-[12px] tracking-[0.18em] text-ouro uppercase">
            {t("acao.escolher", idioma)}
            <input
              type="file"
              accept="image/*"
              onChange={escolherFicheiro}
              className="so-leitor"
            />
          </label>
        )}
      </div>

      {/* Controlos ---------------------------------------------------- */}
      <div className="flex flex-col gap-7">
        <Campo rotulo={t("parede.obra", idioma)}>
          <select
            value={obraSlug}
            onChange={(e) => {
              setObraSlug(e.target.value);
              // Volta a seguir a medida real da obra escolhida.
              setLarguraEscolhida(null);
            }}
            className="campo cursor-pointer"
          >
            {obras.map((o) => (
              <option key={o.slug} value={o.slug} className="bg-tinta">
                {o.titulo}
                {o.autor ? ` · ${o.autor}` : ""}
              </option>
            ))}
          </select>
        </Campo>

        <Campo rotulo={`${t("parede.largura_obra", idioma)}: ${larguraObra} cm`}>
          <input
            type="range"
            min={15}
            max={250}
            step={1}
            value={larguraObra}
            onChange={(e) => setLarguraEscolhida(Number(e.target.value))}
            className="w-full accent-[#B4884A]"
          />
        </Campo>

        <Campo
          rotulo={`${t("parede.largura_parede", idioma)}: ${larguraParede} cm`}
          nota={t("parede.escala", idioma)}
        >
          <input
            type="range"
            min={100}
            max={800}
            step={10}
            value={larguraParede}
            onChange={(e) => setLarguraParede(Number(e.target.value))}
            className="w-full accent-[#B4884A]"
          />
        </Campo>

        <Campo rotulo={t("parede.moldura", idioma)}>
          <div className="flex flex-wrap gap-2.5">
            {molduras.map((m) => (
              <button
                key={m.slug}
                type="button"
                onClick={() => setMolduraSlug(m.slug)}
                aria-pressed={m.slug === molduraSlug}
                className={cx(
                  "flex min-h-11 cursor-pointer items-center gap-2.5 border px-4 py-2.5 text-[11px] tracking-[0.16em] uppercase transition-colors",
                  m.slug === molduraSlug
                    ? "border-papel text-papel"
                    : "border-[rgba(242,237,228,0.25)] text-[rgba(242,237,228,0.6)] hover:border-papel",
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 border border-[rgba(242,237,228,0.3)]"
                  style={{
                    background: m.cor === "transparent" ? "transparent" : m.cor,
                  }}
                />
                {m.nome}
              </button>
            ))}
          </div>
        </Campo>

        <a
          href={linkWhatsApp(whatsapp, mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center self-start bg-ouro px-8 py-[18px] text-[12px] tracking-[0.18em] text-tinta uppercase transition-colors hover:bg-papel"
        >
          {t("parede.pedir", idioma)}
        </a>

        <p className="text-[13px] text-claro-55">
          {t("parede.nota_preco", idioma)}
        </p>
      </div>
    </div>
  );
}

function Campo({
  rotulo,
  nota,
  children,
}: {
  rotulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.5)] uppercase">
        {rotulo}
      </span>
      {children}
      {nota && (
        <span className="text-[13px] text-[rgba(242,237,228,0.45)]">{nota}</span>
      )}
    </label>
  );
}
