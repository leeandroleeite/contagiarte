import Link from "next/link";
import { ViewTransition } from "react";
import { Botao } from "@/components/Botao";
import { Imagem, type MediaLeve } from "@/components/Imagem";
import { t, texto, type Idioma, type Localizado } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { colunas, cx, linkEmail, linkWhatsApp } from "@/lib/utils";

/** O que a ficha precisa de saber de uma obra para a desenhar. */
export type ObraFicha = {
  slug: string;
  titulo: Localizado | null;
  tecnica: Localizado | null;
  dimensoes: string | null;
  ano: number | null;
  descricao: Localizado | null;
  preco: Localizado | null;
  disponibilidade: string;
  larguraCm: number | null;
  alturaCm: number | null;
  fotografia: MediaLeve;
  artista: { nome: string; slug: string } | null;
  exposicao: { slug: string; titulo: Localizado } | null;
};

/** As partes da ficha que o backoffice pode marcar enquanto se escreve. */
export type ParteFicha =
  | "fotografia"
  | "artista"
  | "titulo"
  | "tecnica"
  | "dimensoes"
  | "ano"
  | "exposicao"
  | "preco"
  | "descricao"
  | "contactos";

/**
 * O topo da página de uma obra: fotografia, artista, título, ficha
 * técnica, descrição e botões de contacto.
 *
 * Vive à parte da página para o backoffice desenhar a pré-visualização
 * com este mesmo código. Uma cópia do desenho ao lado do formulário
 * acabava, mais cedo ou mais tarde, a mostrar uma coisa e o site outra,
 * e a pré-visualização só vale se for o site.
 */
export function FichaObra({
  obra,
  idioma,
  whatsapp,
  email,
  nota,
  transicao = false,
  marcado = null,
  nivelTitulo = "h1",
  classeTitulo = "d-ficha",
}: {
  obra: ObraFicha;
  idioma: Idioma;
  whatsapp: string;
  email: string;
  /** A linha por baixo dos botões, que vem dos textos editáveis. */
  nota: string;
  /** A fotografia voa do cartão da lista para aqui. Só no site. */
  transicao?: boolean;
  /** Parte a contornar a dourado: a que se está a editar. */
  marcado?: ParteFicha | null;
  /** Na pré-visualização não é o título da página. */
  nivelTitulo?: "h1" | "p";
  /** O corpo do título mede-se pela janela; a pré-visualização mede-o
   *  pela caixa onde está, que é a janela dela. */
  classeTitulo?: string;
}) {
  const titulo = texto(obra.titulo, idioma) || t("obra.sem_titulo", idioma);
  const autor = obra.artista?.nome ?? "";
  const vendida = obra.disponibilidade === "vendida";

  const preco = vendida
    ? t("estado.vendida", idioma)
    : obra.disponibilidade === "reservada"
      ? t("estado.reservada", idioma)
      : texto(obra.preco, idioma) || t("obra.sob_consulta", idioma);

  const mensagem = t("whatsapp.obra", idioma, {
    titulo,
    autor: autor ? t("whatsapp.obra_autor", idioma, { autor }) : "",
  });

  // Proporção real da obra, quando conhecida: uma peça alta não deve
  // ser mostrada dentro de um quadrado.
  const proporcao =
    obra.larguraCm && obra.alturaCm
      ? `${obra.larguraCm}/${obra.alturaCm}`
      : "1/1";

  const marca = (parte: ParteFicha) =>
    marcado === parte && "outline-2 outline-offset-4 outline-ouro";

  const ficha: Array<[ParteFicha, string, React.ReactNode]> = (
    [
      ["tecnica", t("obra.tecnica", idioma), texto(obra.tecnica, idioma)],
      ["dimensoes", t("obra.dimensoes", idioma), obra.dimensoes ?? ""],
      ["ano", t("obra.ano", idioma), obra.ano ? String(obra.ano) : ""],
      [
        "exposicao",
        t("obra.exposicao", idioma),
        obra.exposicao ? (
          <Link
            key="expo"
            href={caminho(idioma, `/exposicoes/${obra.exposicao.slug}`)}
          >
            {texto(obra.exposicao.titulo, idioma)}
          </Link>
        ) : (
          ""
        ),
      ],
      [
        "preco",
        t("obra.preco", idioma),
        <span key="preco" className="text-ouro">
          {preco}
        </span>,
      ],
    ] as Array<[ParteFicha, string, React.ReactNode]>
  ).filter(([, , v]) => v);

  const fotografia = (
    <div className={cx("bg-tinta-obra", marca("fotografia"))}>
      <Imagem
        media={obra.fotografia}
        alt={autor ? t("obra.alt", idioma, { titulo, autor }) : titulo}
        proporcao={proporcao}
        ajuste="contain"
        legenda={`${titulo}, alta resolução`}
        prioridade={transicao}
        revelar={false}
        sizes="(max-width: 900px) 100vw, 50vw"
      />
    </div>
  );

  const Titulo = nivelTitulo;

  return (
    <div className="grid gap-14" style={colunas(340)}>
      {/* A obra inteira, sem cortes, sobre o fundo mais escuro. */}
      {transicao ? (
        <ViewTransition
          name={`obra-${obra.slug}`}
          share="obra-voo"
          default="none"
        >
          {fotografia}
        </ViewTransition>
      ) : (
        fotografia
      )}

      <div className="flex flex-col gap-6 self-center">
        {autor && (
          <Link
            href={caminho(idioma, `/artistas/${obra.artista!.slug}`)}
            className={cx(
              "etiqueta inline-flex min-h-11 items-center",
              marca("artista"),
            )}
          >
            {autor} →
          </Link>
        )}

        <Titulo
          className={cx(
            "titulo tracking-[-0.02em]",
            classeTitulo,
            marca("titulo"),
          )}
        >
          {titulo}
        </Titulo>

        <dl className="grid">
          {ficha.map(([parte, rotulo, valor], i) => (
            <div
              key={parte}
              className={cx(
                "flex justify-between gap-4 border-t border-fio py-3.5 text-[15px]",
                i === ficha.length - 1 && "border-b border-b-fio",
                marca(parte),
              )}
            >
              <dt className="text-claro-55">{rotulo}</dt>
              <dd className="m-0 text-right">{valor}</dd>
            </div>
          ))}
        </dl>

        {texto(obra.descricao, idioma) && (
          <p className={cx("corpo max-w-[48ch] text-claro-80", marca("descricao"))}>
            {texto(obra.descricao, idioma)}
          </p>
        )}

        {!vendida && (
          <div className={cx("flex flex-col gap-3", marca("contactos"))}>
            <Botao externo href={linkWhatsApp(whatsapp, mensagem)}>
              {t("acao.preco_whatsapp", idioma)}
            </Botao>
            <Botao
              variante="linha"
              href={linkEmail(
                email,
                t("whatsapp.obra_assunto", idioma, { titulo }),
                mensagem,
              )}
            >
              {t("acao.preco_email", idioma)}
            </Botao>
            <span className="meta text-center text-claro-55">{nota}</span>
          </div>
        )}

        <Link
          href={caminho(idioma, `/ver-na-parede?obra=${obra.slug}`)}
          className="etiqueta inline-flex min-h-11 items-center"
        >
          {t("acao.parede", idioma)}
        </Link>
      </div>
    </div>
  );
}
