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
  alturaCm: number | null;
  /** Altura a dividir pela largura. 1 é quadrado, >1 é mais alta. */
  proporcao: number;
  /**
   * De onde veio a proporção. Com medidas reais na ficha, é a verdade;
   * com os pixéis da fotografia, é a forma certa mas o tamanho é o que
   * o visitante escolher. Nunca mais o quadrado por omissão, que era o
   * que fazia a Censored Hero, um retrato, aparecer quadrada.
   */
  origemProporcao: "medidas" | "fotografia";
};

export type MolduraParede = {
  slug: string;
  nome: string;
  cor: string;
  espessuraMm: number;
};

/** Parede da própria galeria, para a ferramenta abrir a funcionar. */
const PAREDE_EXEMPLO = "/parede-exemplo.jpg";

/** A perfilaria em centímetros, que é a unidade de tudo o resto aqui. */
function molduraCm(m: MolduraParede | undefined): number {
  return (m?.espessuraMm ?? 0) / 10;
}

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
  /** Meia peça, em fracção do palco. Alimenta os limites do arrasto. */
  const limites = useRef({ x: 0.06, y: 0.06 });

  /**
   * Abre com uma parede de exemplo: uma parede a sério da galeria, com
   * um aplique que dá a escala. Antes a página abria com um rectângulo
   * tracejado vazio e cem por cento do valor ficava atrás de um upload,
   * o que exige que a pessoa já tenha a fotografia à mão. Quem chegava
   * de uma pesquisa, saía.
   */
  const [parede, setParede] = useState<string>(PAREDE_EXEMPLO);
  const daGaleria = parede === PAREDE_EXEMPLO;
  const [obraSlug, setObraSlug] = useState(
    obraInicial && obras.some((o) => o.slug === obraInicial)
      ? obraInicial
      : (obras[0]?.slug ?? ""),
  );
  // Começa sem moldura: primeiro a obra como ela é, e depois a moldura
  // como uma escolha que se vê acrescentar.
  const [molduraSlug, setMolduraSlug] = useState(
    molduras.find((m) => m.espessuraMm === 0)?.slug ??
      molduras[0]?.slug ??
      "sem-moldura",
  );
  // `null` significa "usar a largura real da obra"; assim que o
  // visitante mexe no cursor, passa a mandar o valor escolhido.
  const [larguraEscolhida, setLarguraEscolhida] = useState<number | null>(null);
  const [larguraParede, setLarguraParede] = useState(320);
  const [pos, setPos] = useState({ x: 0.5, y: 0.45 });
  const [erroFicheiro, setErroFicheiro] = useState<string | null>(null);
  // O palco toma a forma da fotografia. Fixo em 4:3, uma foto de
  // telemóvel na vertical perdia o tecto e o chão, que são justamente
  // as referências que dão credibilidade à simulação.
  const [formaParede, setFormaParede] = useState(4 / 3);
  const [aArrastarFicheiro, setAArrastarFicheiro] = useState(false);

  const obra = obras.find((o) => o.slug === obraSlug) ?? obras[0];
  const moldura = molduras.find((m) => m.slug === molduraSlug) ?? molduras[0];
  const larguraObra = larguraEscolhida ?? obra?.larguraCm ?? 90;

  // O arrasto continua mesmo quando o cursor sai do palco, como no
  // design: os ouvintes vivem na janela, não no elemento.
  useEffect(() => {
    const mover = (e: PointerEvent) => {
      if (!arrasto.current || !palco.current) return;
      const r = palco.current.getBoundingClientRect();
      // Metade da peça, para o centro nunca sair tanto que a obra
      // desapareça pela borda e fique sem forma de a trazer de volta.
      const meia = limites.current;
      setPos({
        x: Math.min(
          1 - meia.x,
          Math.max(meia.x, (e.clientX - r.left) / r.width),
        ),
        y: Math.min(
          1 - meia.y,
          Math.max(meia.y, (e.clientY - r.top) / r.height),
        ),
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
      // Só os endereços que este componente criou. Revogar a parede de
      // exemplo, que é um ficheiro do site, não faria nada de bom.
      if (parede.startsWith("blob:")) URL.revokeObjectURL(parede);
    };
  }, [parede]);

  /**
   * Aceita a fotografia depois de a conseguir descodificar.
   *
   * O `accept="image/*"` só filtra o selector de ficheiros: não protege
   * de arrastar e largar, de um HEIC que o navegador não leia, nem de um
   * ficheiro corrompido. Antes, um .txt dava um ecrã preto sem uma
   * palavra e sem forma de voltar atrás.
   */
  const aceitarFicheiro = (ficheiro: File | undefined) => {
    if (!ficheiro) return;

    const recusar = () =>
      setErroFicheiro(
        idioma === "en"
          ? "We could not read that file. Try a JPG or a PNG."
          : idioma === "es"
            ? "No pudimos leer ese archivo. Pruebe un JPG o un PNG."
            : "Não conseguimos ler esse ficheiro. Tente um JPG ou um PNG.",
      );

    if (!ficheiro.type.startsWith("image/")) return recusar();

    const url = URL.createObjectURL(ficheiro);
    const teste = new Image();
    teste.onload = () => {
      if (parede.startsWith("blob:")) URL.revokeObjectURL(parede);
      setErroFicheiro(null);
      // Entre 3:4 e 16:9: respeita a forma da fotografia sem deixar o
      // palco ficar tão alto que os controlos saiam do ecrã.
      const forma = teste.naturalWidth / teste.naturalHeight;
      setFormaParede(Math.min(16 / 9, Math.max(3 / 4, forma)));
      setParede(url);
      // Fotografia nova, obra ao centro: sem isto ela ficava no canto
      // onde tivesse sido largada na fotografia anterior.
      setPos({ x: 0.5, y: 0.45 });
    };
    teste.onerror = () => {
      URL.revokeObjectURL(url);
      recusar();
    };
    teste.src = url;
  };

  const escolherFicheiro = (e: React.ChangeEvent<HTMLInputElement>) => {
    aceitarFicheiro(e.target.files?.[0]);
    e.target.value = "";
  };

  const alturaCm = Math.round(larguraObra * (obra?.proporcao ?? 1));

  // A moldura acrescenta-se por fora, como na parede. Antes era um
  // padding para dentro, e escolher madeira natural encolhia a obra de
  // 100 para 81 cm: a ferramenta invertia exactamente aquilo que o
  // visitante ali foi perceber.
  const perfil = molduraCm(moldura);
  const conjuntoLargura = larguraObra + perfil * 2;
  const conjuntoAltura = alturaCm + perfil * 2;

  const fraccao = conjuntoLargura / Math.max(larguraParede, 1);
  // Percentagem da largura do conjunto que a perfilaria ocupa de cada
  // lado. É o que desenha a moldura à escala certa.
  const perfilPct = conjuntoLargura > 0 ? (perfil / conjuntoLargura) * 100 : 0;
  const naoCabe = conjuntoLargura > larguraParede;

  const srcObra = urlMedia(obra?.chave);

  // Metade da peça em fracção do palco, nas duas direcções. O palco é
  // mais largo do que alto, por isso a altura em fracção não é igual.
  // Vive num ref porque quem a lê é o arrasto, não o render.
  useEffect(() => {
    limites.current = {
      x: Math.min(0.45, fraccao / 2),
      y: Math.min(
        0.45,
        (fraccao * (conjuntoAltura / conjuntoLargura) * formaParede) / 2,
      ),
    };
  }, [fraccao, conjuntoAltura, conjuntoLargura, formaParede]);

  const medidas = perfil
    ? `${larguraObra} × ${alturaCm} cm · com moldura ${Math.round(conjuntoLargura)} × ${Math.round(conjuntoAltura)} cm`
    : `${larguraObra} × ${alturaCm} cm`;

  const legenda = obra
    ? `${obra.titulo} · ${medidas} · ${(moldura?.nome ?? "").toLowerCase()}`
    : "";

  const mensagem = obra
    ? `Olá, experimentei no site: “${obra.titulo}”${obra.autor ? ` de ${obra.autor}` : ""}, a ${larguraObra} × ${alturaCm} cm${perfil ? `, que com ${(moldura?.nome ?? "").toLowerCase()} fica ${Math.round(conjuntoLargura)} × ${Math.round(conjuntoAltura)} cm` : ", sem moldura"}. Podem dizer-me o preço?`
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
          /* Sem `touch-none` aqui: o dedo tem de poder deslizar a
             página por cima da pré-visualização. Só a peça arrastável o
             leva. */
          className="relative min-h-[260px] w-full overflow-hidden bg-tinta-obra"
          onDragOver={(e) => {
            e.preventDefault();
            setAArrastarFicheiro(true);
          }}
          onDragLeave={() => setAArrastarFicheiro(false)}
          onDrop={(e) => {
            e.preventDefault();
            setAArrastarFicheiro(false);
            aceitarFicheiro(e.dataTransfer.files?.[0]);
          }}
          style={{
            aspectRatio: String(formaParede),
            ...(parede
              ? {
                  backgroundImage: `url(${parede})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined),
          }}
        >
          {/* O convite para usar a parede própria fica num canto, sem
              tapar a de exemplo. Aceita clique e também arrastar. */}
          {aArrastarFicheiro && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 border-2 border-dashed border-ouro bg-[rgba(180,136,74,0.12)]"
            />
          )}

          {obra && (
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
                // Duas sombras: uma curta de contacto, que diz que a
                // peça assenta na parede, e uma longa e difusa, que diz
                // a que distância. É o sinal que o olho usa para
                // decidir se algo está pendurado ou colado por cima.
                filter:
                  "drop-shadow(0 2px 3px rgba(0,0,0,0.5)) drop-shadow(0 18px 34px rgba(0,0,0,0.38))",
              }}
            >
              {/* A moldura envolve a obra: o padding é uma percentagem
                  da largura do conjunto, por isso mantém-se à escala
                  com o resto. */}
              <div
                style={{
                  width: "100%",
                  padding: perfil ? `${perfilPct}%` : 0,
                  background: perfil
                    ? (moldura?.cor ?? "transparent")
                    : "transparent",
                  // Bisel: uma aresta clara e a oposta escura, para a
                  // perfilaria ter espessura em vez de ser cor chapada.
                  boxShadow: perfil
                    ? "inset 0 0 0 1px rgba(0,0,0,0.35), inset 2px 2px 3px rgba(255,255,255,0.14), inset -2px -2px 3px rgba(0,0,0,0.3)"
                    : undefined,
                }}
              >
                <div
                  className="w-full"
                  style={{
                    aspectRatio: `1 / ${obra.proporcao}`,
                    ...(srcObra
                      ? {
                          backgroundImage: `url(${srcObra})`,
                          // `contain` e não `cover`: a obra tem uma
                          // forma e não se corta para caber numa caixa.
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                        }
                      : {
                          background: "#1b1715",
                          border: "1px dashed rgba(242,237,228,0.25)",
                        }),
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-between gap-4 pt-3.5 text-[13px] text-[rgba(242,237,228,0.55)]">
          <span>{legenda}</span>
          <span>{t("parede.arraste", idioma)}</span>
        </div>

        {/* Se não cabe, o visitante tem de saber que não cabe. Antes a
            peça era encolhida em silêncio até 92% da parede. */}
        {naoCabe && (
          <p role="status" className="pt-2 text-[13px] text-[#E0765C]">
            {idioma === "en"
              ? `At ${Math.round(conjuntoLargura)} cm framed, this does not fit a ${larguraParede} cm wall.`
              : idioma === "es"
                ? `Con marco mide ${Math.round(conjuntoLargura)} cm y no cabe en una pared de ${larguraParede} cm.`
                : `Com moldura fica com ${Math.round(conjuntoLargura)} cm e não cabe numa parede de ${larguraParede} cm.`}
          </p>
        )}

        <div className="flex flex-wrap gap-2.5 pt-3">
          <button
            type="button"
            onClick={() => setPos({ x: 0.5, y: 0.45 })}
            className="min-h-11 cursor-pointer border border-[rgba(242,237,228,0.25)] px-4 text-[11px] tracking-[0.14em] text-[rgba(242,237,228,0.7)] uppercase transition-colors hover:border-papel"
          >
            {idioma === "en"
              ? "Centre"
              : idioma === "es"
                ? "Centrar"
                : "Centrar"}
          </button>
          {/* Regra de quem pendura: o centro da obra a cerca de 150 cm
                do chão. É a dúvida que toda a gente tem a seguir. */}
          <button
            type="button"
            onClick={() => setPos((p) => ({ x: p.x, y: 0.55 }))}
            className="min-h-11 cursor-pointer border border-[rgba(242,237,228,0.25)] px-4 text-[11px] tracking-[0.14em] text-[rgba(242,237,228,0.7)] uppercase transition-colors hover:border-papel"
          >
            {idioma === "en"
              ? "Eye level"
              : idioma === "es"
                ? "Altura de los ojos"
                : "Altura do olhar"}
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <label className="inline-flex min-h-11 w-fit cursor-pointer items-center border border-[rgba(242,237,228,0.25)] px-4 text-[11px] tracking-[0.16em] text-papel uppercase transition-colors focus-within:border-ouro hover:border-papel">
            {daGaleria
              ? t("parede.carregar", idioma)
              : t("acao.escolher", idioma)}
            <input
              type="file"
              accept="image/*"
              onChange={escolherFicheiro}
              className="so-leitor"
            />
          </label>

          {erroFicheiro ? (
            <span role="alert" className="text-[13px] text-[#E0765C]">
              {erroFicheiro}
            </span>
          ) : (
            <span className="max-w-[46ch] text-[13px] leading-[1.5] text-[rgba(242,237,228,0.55)]">
              {daGaleria
                ? idioma === "en"
                  ? "This is a wall at the gallery. Use a photograph of yours to see the piece at home."
                  : idioma === "es"
                    ? "Esta es una pared de la galería. Use una fotografía suya para ver la pieza en su casa."
                    : "Esta é uma parede da galeria. Use uma fotografia sua para ver a peça em casa."
                : t("parede.privado", idioma)}
            </span>
          )}
        </div>
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

          {obra?.origemProporcao === "fotografia" && (
            <span className="text-[13px] leading-[1.5] text-[rgba(242,237,228,0.55)]">
              {idioma === "en"
                ? "The shape comes from the photograph of the piece; the size is the one you choose. Ask us for the exact measurements."
                : idioma === "es"
                  ? "La forma viene de la fotografía de la pieza; el tamaño es el que usted elija. Pregúntenos las medidas exactas."
                  : "A forma vem da fotografia da peça; o tamanho é o que escolher. Pergunte-nos as medidas exactas."}
            </span>
          )}

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
