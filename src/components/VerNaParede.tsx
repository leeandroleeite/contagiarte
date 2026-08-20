"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { urlMedia } from "@/lib/media/url";
import { colunas, cx, linkWhatsApp } from "@/lib/utils";

export type ObraParede = {
  slug: string;
  titulo: string;
  autor: string;
  chave: string | null;
  larguraCm: number | null;
  /** Altura a dividir pela largura. 1 é quadrado, >1 é mais alta. */
  proporcao: number;
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
 * visitante e a largura da obra, tal como no design.
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
  const arrasto = useRef(false);

  const [parede, setParede] = useState<string | null>(null);
  const [obraSlug, setObraSlug] = useState(
    obraInicial && obras.some((o) => o.slug === obraInicial)
      ? obraInicial
      : (obras[0]?.slug ?? ""),
  );
  const [molduraSlug, setMolduraSlug] = useState(
    molduras.find((m) => m.espessuraMm > 0)?.slug ??
      molduras[0]?.slug ??
      "sem-moldura",
  );
  // `null` significa "usar a largura real da obra"; assim que o
  // visitante mexe no cursor, passa a mandar o valor escolhido.
  const [larguraEscolhida, setLarguraEscolhida] = useState<number | null>(null);
  const [larguraParede, setLarguraParede] = useState(320);
  const [pos, setPos] = useState({ x: 0.5, y: 0.45 });

  const obra = obras.find((o) => o.slug === obraSlug) ?? obras[0];
  const moldura =
    molduras.find((m) => m.slug === molduraSlug) ?? molduras[0];
  const larguraObra = larguraEscolhida ?? obra?.larguraCm ?? 90;

  // O arrasto continua mesmo quando o cursor sai do palco, como no
  // design: os ouvintes vivem na janela, não no elemento.
  useEffect(() => {
    const mover = (e: PointerEvent) => {
      if (!arrasto.current || !palco.current) return;
      const r = palco.current.getBoundingClientRect();
      setPos({
        x: Math.min(0.98, Math.max(0.02, (e.clientX - r.left) / r.width)),
        y: Math.min(0.98, Math.max(0.02, (e.clientY - r.top) / r.height)),
      });
    };
    const largar = () => {
      arrasto.current = false;
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", largar);
    window.addEventListener("pointercancel", largar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", largar);
      window.removeEventListener("pointercancel", largar);
    };
  }, []);

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
    e.target.value = "";
  };

  const fraccao = Math.min(0.92, larguraObra / Math.max(larguraParede, 1));
  const alturaCm = Math.round(larguraObra * (obra?.proporcao ?? 1));
  const srcObra = urlMedia(obra?.chave);

  const legenda = obra
    ? `${obra.titulo} · ${larguraObra} × ${alturaCm} cm · ${(moldura?.nome ?? "").toLowerCase()}`
    : "";

  const mensagem = obra
    ? `Olá, experimentei no site: “${obra.titulo}”${obra.autor ? ` de ${obra.autor}` : ""}, a ${larguraObra} × ${alturaCm} cm, com ${(moldura?.nome ?? "sem moldura").toLowerCase()}. Podem dizer-me o preço?`
    : "Olá, queria saber o preço de uma obra com moldura.";

  return (
    <div className="grid items-start gap-10" style={colunas(320)}>
      {/* Palco -------------------------------------------------------- */}
      <div>
        <div
          ref={palco}
          /* `w-full` é obrigatório: com `aspect-[4/3]` e `min-h`, sem
             largura explícita o browser deduz a largura a partir da
             altura mínima e o palco fica maior do que o ecrã. */
          className="relative aspect-[4/3] min-h-[260px] w-full touch-none overflow-hidden bg-tinta-obra"
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
            <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-[rgba(242,237,228,0.2)] p-6 text-center">
              <span className="text-[11px] tracking-[0.24em] text-[rgba(242,237,228,0.55)] uppercase">
                {t("parede.carregar", idioma)}
              </span>
              <span className="max-w-[34ch] text-[13px] text-[rgba(242,237,228,0.55)]">
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

          {parede && obra && (
            <div
              onPointerDown={(e) => {
                e.preventDefault();
                arrasto.current = true;
              }}
              role="img"
              aria-label={`${obra.titulo}, na sua parede`}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing"
              style={{
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                width: `${fraccao * 100}%`,
                filter: "drop-shadow(0 18px 34px rgba(0,0,0,0.45))",
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: `1 / ${obra.proporcao}`,
                  padding: moldura?.espessuraMm
                    ? `${moldura.espessuraMm}px`
                    : 0,
                  background:
                    moldura?.cor === "transparent"
                      ? "transparent"
                      : (moldura?.cor ?? "transparent"),
                  boxShadow: moldura?.espessuraMm
                    ? "inset 0 0 0 1px rgba(0,0,0,0.35)"
                    : undefined,
                }}
              >
                <div
                  className="h-full w-full"
                  style={
                    srcObra
                      ? {
                          backgroundImage: `url(${srcObra})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : {
                          background: "#1b1715",
                          border: "1px dashed rgba(242,237,228,0.25)",
                        }
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-between gap-4 pt-3.5 text-[13px] text-[rgba(242,237,228,0.55)]">
          <span>{parede ? legenda : t("parede.privado", idioma)}</span>
          {parede && <span>{t("parede.arraste", idioma)}</span>}
        </div>

        {parede && (
          <label className="mt-2 inline-block cursor-pointer text-[12px] tracking-[0.18em] text-ouro uppercase">
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
      <aside className="flex flex-col gap-8">
        <div className="flex flex-col gap-3.5">
          <span className="text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.55)] uppercase">
            {t("parede.obra", idioma)}
          </span>

          <div className="grid gap-2.5" style={colunas(74)}>
            {obras.map((o) => {
              const src = urlMedia(o.chave);
              return (
                <button
                  key={o.slug}
                  type="button"
                  onClick={() => {
                    setObraSlug(o.slug);
                    setLarguraEscolhida(null);
                  }}
                  aria-pressed={o.slug === obraSlug}
                  title={`${o.titulo}${o.autor ? ` · ${o.autor}` : ""}`}
                  className={cx(
                    "aspect-square cursor-pointer border-2 p-0",
                    o.slug === obraSlug
                      ? "border-ouro"
                      : "border-[rgba(242,237,228,0.25)] hover:border-papel",
                  )}
                >
                  <span
                    role="img"
                    aria-label={o.titulo}
                    className="block h-full w-full"
                    style={
                      src
                        ? {
                            backgroundImage: `url(${src})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : { background: "#1b1715" }
                    }
                  />
                </button>
              );
            })}
          </div>

          <span className="text-[15px]">
            {obra?.titulo}
            {obra?.autor && (
              <span className="text-[rgba(242,237,228,0.55)]">
                {" · "}
                {obra.autor}
              </span>
            )}
          </span>
        </div>

        <div className="flex flex-col gap-3.5">
          <label
            htmlFor="largura-obra"
            className="flex justify-between text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.55)] uppercase"
          >
            <span>{t("parede.largura_obra", idioma)}</span>
            <span>{larguraObra} cm</span>
          </label>
          <input
            id="largura-obra"
            type="range"
            min={30}
            max={200}
            step={5}
            value={larguraObra}
            onChange={(e) => setLarguraEscolhida(Number(e.target.value))}
            className="h-8 w-full accent-[#B4884A]"
          />

          <label
            htmlFor="largura-parede"
            className="flex justify-between text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.55)] uppercase"
          >
            <span>{t("parede.largura_parede", idioma)}</span>
            <span>{larguraParede} cm</span>
          </label>
          <input
            id="largura-parede"
            type="range"
            min={150}
            max={600}
            step={10}
            value={larguraParede}
            onChange={(e) => setLarguraParede(Number(e.target.value))}
            className="h-8 w-full accent-[#B4884A]"
          />

          <span className="text-[13px] text-[rgba(242,237,228,0.55)]">
            {t("parede.escala", idioma)}
          </span>
        </div>

        <div className="flex flex-col gap-3.5">
          <span className="text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.55)] uppercase">
            {t("parede.moldura", idioma)}
          </span>
          <div className="flex flex-wrap gap-2.5">
            {molduras.map((m) => (
              <button
                key={m.slug}
                type="button"
                onClick={() => setMolduraSlug(m.slug)}
                aria-pressed={m.slug === molduraSlug}
                className={cx(
                  "flex min-h-11 cursor-pointer items-center gap-2.5 border px-4 py-2.5 text-[11px] tracking-[0.14em] uppercase transition-colors",
                  m.slug === molduraSlug
                    ? "border-papel bg-papel text-tinta"
                    : "border-[rgba(242,237,228,0.25)] text-[rgba(242,237,228,0.7)] hover:border-papel",
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 border border-[rgba(14,12,11,0.25)]"
                  style={{
                    background: m.cor === "transparent" ? "transparent" : m.cor,
                  }}
                />
                {m.nome}
              </button>
            ))}
          </div>
          <span className="text-[13px] leading-[1.55] text-[rgba(242,237,228,0.55)]">
            {idioma === "pt"
              ? "Produzidas com a MOLDARTPÓVOA: vidro museu Tru-Vue®, madeiras naturais e alumínio de precisão."
              : idioma === "en"
                ? "Made with MOLDARTPÓVOA: Tru-Vue® museum glass, natural woods and precision aluminium."
                : "Producidos con MOLDARTPÓVOA: vidrio museo Tru-Vue®, maderas naturales y aluminio de precisión."}
          </span>
        </div>

        <div className="flex flex-col gap-3 border-t border-[rgba(242,237,228,0.16)] pt-6">
          <a
            href={linkWhatsApp(whatsapp, mensagem)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center bg-ouro px-6 py-[17px] text-center text-[12px] tracking-[0.18em] text-tinta uppercase transition-colors hover:bg-papel"
          >
            {t("parede.pedir", idioma)}
          </a>
          <span className="text-center text-[13px] text-[rgba(242,237,228,0.55)]">
            {t("parede.nota_preco", idioma)}
          </span>
        </div>
      </aside>
    </div>
  );
}
