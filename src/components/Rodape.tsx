import Link from "next/link";
import type { Definicoes } from "@/lib/db/schema";
import { t, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { colunas, linkWhatsApp } from "@/lib/utils";

/**
 * Rodapé comum a todas as páginas. Repete o bloco "Fale connosco" do
 * design, com o título grande e as colunas de contacto.
 *
 * A coluna "Explorar" existe por necessidade de navegação: a barra de
 * topo só tem sete entradas, e abaixo de 1120px as restantes vivem no
 * menu compacto. Sem esta coluna, quem está num ecrã grande não teria
 * como chegar a "Ver na parede", "A obra como ativo", "Os lugares" ou
 * "A galeria" a não ser por uma frase solta na homepage.
 */
export function Rodape({
  idioma,
  definicoes: d,
}: {
  idioma: Idioma;
  definicoes: Definicoes;
}) {
  const ano = new Date().getFullYear();

  return (
    <footer id="contactos" className="px-7 pt-[140px] pb-[76px]">
      <h2 className="titulo d-contactos" data-surge="">
        {t("rodape.fale", idioma).toUpperCase()}
      </h2>

      <div
        className="mt-10 grid gap-10 border-b border-[rgba(242,237,228,0.16)] pb-14"
        style={colunas(220)}
      >
        <Coluna titulo={t("rodape.direto", idioma)}>
          <a
            href={linkWhatsApp(
              d.whatsapp,
              "Olá, venho do site da Galeria Contagiarte.",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp →
          </a>
          <a href={`mailto:${d.email}`}>{d.email}</a>
          <a href={`tel:${d.telefone.replace(/\s/g, "")}`}>{d.telefone}</a>
        </Coluna>

        <Coluna titulo={t("rodape.seguir", idioma)}>
          <a
            href={`https://instagram.com/${d.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{d.instagram}
          </a>
          {d.morada && <span className="text-claro-55">{d.morada}</span>}
          {d.responsavel && (
            <span className="text-claro-55">{d.responsavel}</span>
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

      <div className="flex flex-wrap justify-between gap-5 pt-7 text-[11px] tracking-[0.18em] text-[rgba(242,237,228,0.55)]">
        <span>
          © {ano} GALERIA CONTAGIARTE® ·{" "}
          {/* Sublinhado, e não só a cor: no meio de uma linha de texto
              um link que só se distingue pela cor não se distingue de
              todo para quem não separa bem as cores. */}
          <Link href={caminho(idioma, "/privacidade")} className="underline">
            {t("rodape.privacidade", idioma).toUpperCase()}
          </Link>
        </span>
        <span>{d.parceiros.join(" · ")}</span>
      </div>
    </footer>
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
    <div className="flex flex-col gap-1 text-[17px] [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_span]:flex [&_span]:min-h-11 [&_span]:items-center">
      <span className="mb-1 text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.55)] uppercase">
        {titulo}
      </span>
      {children}
    </div>
  );
}
