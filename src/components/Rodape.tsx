import Link from "next/link";
import { Icone } from "@/components/Icones";
import type { Definicoes } from "@/lib/db/schema";
import { t, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { colunas, cx, linkWhatsApp } from "@/lib/utils";

/** As partes do rodapé que o backoffice pode marcar enquanto se escreve. */
export type ParteRodape =
  | "whatsapp"
  | "email"
  | "telefone"
  | "instagram"
  | "morada"
  | "responsavel"
  | "parceiros";

/** Os campos das definições que o rodapé mostra. */
export type ContactosRodape = Pick<
  Definicoes,
  | "whatsapp"
  | "email"
  | "telefone"
  | "instagram"
  | "morada"
  | "responsavel"
  | "parceiros"
>;

/**
 * Rodapé comum a todas as páginas. Repete o bloco "Fale connosco" do
 * design, com o título grande e as colunas de contacto.
 *
 * A coluna "Explorar" existe por necessidade de navegação: a barra de
 * topo só tem oito entradas, e abaixo de 1120px as restantes vivem no
 * menu compacto. Sem esta coluna, quem está num ecrã grande não teria
 * como chegar a "Ver na parede", "A obra como ativo", "Os lugares" ou
 * "A galeria" a não ser por uma frase solta na homepage.
 */
export function Rodape({
  idioma,
  definicoes,
  mensagemWhatsApp,
}: {
  idioma: Idioma;
  definicoes: ContactosRodape;
  /** Vem do layout, que é quem lê a base. Editável no backoffice. */
  mensagemWhatsApp: string;
}) {
  return (
    <footer id="contactos" className="px-margem pt-[140px] pb-[76px]">
      <CorpoRodape
        idioma={idioma}
        definicoes={definicoes}
        mensagemWhatsApp={mensagemWhatsApp}
      />
    </footer>
  );
}

/**
 * O que está dentro do rodapé, sem a margem à volta.
 *
 * Vive à parte para os Contactos da galeria, no backoffice, o
 * desenharem ao lado do formulário com este mesmo código, como a
 * `FichaObra`: uma cópia acabava por mostrar uma coisa e o site outra.
 */
export function CorpoRodape({
  idioma,
  definicoes: d,
  mensagemWhatsApp,
  marcado = null,
  nivelTitulo = "h2",
  classeTitulo = "d-seccao",
  surge = true,
}: {
  idioma: Idioma;
  definicoes: ContactosRodape;
  mensagemWhatsApp: string;
  /** Contacto a contornar a dourado: o que se está a editar. */
  marcado?: ParteRodape | null;
  /** Na pré-visualização não é um título da página. */
  nivelTitulo?: "h2" | "p";
  /** O corpo do título mede-se pela janela; a pré-visualização mede-o
   *  pela caixa onde está. */
  classeTitulo?: string;
  /** Chega a subir quando entra no ecrã. No backoffice não há quem o
   *  revele, e ficava invisível. */
  surge?: boolean;
}) {
  const ano = new Date().getFullYear();
  const Titulo = nivelTitulo;
  const marca = (parte: ParteRodape) =>
    marcado === parte ? "outline-2 outline-offset-4 outline-ouro" : undefined;

  return (
    <>
      <Titulo
        className={cx("titulo", classeTitulo)}
        data-surge={surge ? "" : undefined}
      >
        {t("rodape.fale", idioma)}
      </Titulo>

      <div
        className="mt-10 grid gap-10 border-b border-fio pb-14"
        style={colunas(220)}
      >
        <Coluna titulo={t("rodape.direto", idioma)}>
          <a
            href={linkWhatsApp(d.whatsapp, mensagemWhatsApp)}
            target="_blank"
            rel="noopener noreferrer"
            className={marca("whatsapp")}
          >
            <Icone nome="whatsapp" />
            WhatsApp →
          </a>
          <a href={`mailto:${d.email}`} className={marca("email")}>
            <Icone nome="email" />
            {d.email}
          </a>
          <a
            href={`tel:${d.telefone.replace(/\s/g, "")}`}
            className={marca("telefone")}
          >
            <Icone nome="telefone" />
            {d.telefone}
          </a>
        </Coluna>

        <Coluna titulo={t("rodape.seguir", idioma)}>
          <a
            href={`https://instagram.com/${d.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className={marca("instagram")}
          >
            <Icone nome="instagram" />@{d.instagram}
          </a>
          <Link href={caminho(idioma, "/newsletter")}>
            {t("nav.newsletter", idioma)} →
          </Link>
          {d.morada && (
            <span className={cx("text-claro-55", marca("morada"))}>
              <Icone nome="morada" />
              {d.morada}
            </span>
          )}
          {d.responsavel && (
            <span className={cx("text-claro-55", marca("responsavel"))}>
              {d.responsavel}
            </span>
          )}
        </Coluna>

        <Coluna titulo={t("rodape.visitar", idioma)}>
          <Link href={caminho(idioma, "/exposicoes")}>
            {t("nav.exposicoes", idioma)} →
          </Link>
          <Link href={caminho(idioma, "/obras")}>
            {t("nav.obras", idioma)} →
          </Link>
          <Link href={caminho(idioma, "/descarregar")}>
            {t("nav.descarregar", idioma)} ↓
          </Link>
        </Coluna>

        <Coluna titulo={t("rodape.explorar", idioma)}>
          <Link href={caminho(idioma, "/ver-na-parede")}>
            {t("nav.parede", idioma)} →
          </Link>
          <Link href={caminho(idioma, "/a-obra-como-ativo")}>
            {t("nav.ativo", idioma)} →
          </Link>
          <Link href={caminho(idioma, "/lugares")}>
            {t("nav.lugares", idioma)} →
          </Link>
          <Link href={caminho(idioma, "/a-galeria")}>
            {t("nav.galeria", idioma)} →
          </Link>
        </Coluna>
      </div>

      <div className="flex flex-wrap justify-between gap-5 pt-7 text-[11px] tracking-[0.18em] text-claro-55">
        <span>
          © {ano} GALERIA CONTAGIARTE® ·{" "}
          {/* Sublinhado, e não só a cor: no meio de uma linha de texto
              um link que só se distingue pela cor não se distingue de
              todo para quem não separa bem as cores. */}
          <Link href={caminho(idioma, "/privacidade")} className="underline uppercase">
            {t("rodape.privacidade", idioma)}
          </Link>
        </span>
        <span className={marca("parceiros")}>{d.parceiros.join(" · ")}</span>
      </div>
    </>
  );
}

function Coluna({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 text-[17px] [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:gap-2.5 [&_span]:flex [&_span]:min-h-11 [&_span]:items-center [&_span]:gap-2.5">
      <span className="etiqueta mb-1 text-claro-55">
        {titulo}
      </span>
      {children}
    </div>
  );
}
