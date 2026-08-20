import Link from "next/link";
import type { Definicoes } from "@/lib/db/schema";
import { t, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { linkWhatsApp } from "@/lib/utils";

/**
 * Rodapé comum a todas as páginas. Repete o bloco "Fale connosco" do
 * design, com o título grande, três colunas de contacto e a linha de
 * direitos e parceiros.
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
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}
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
          {d.morada && (
            <span className="text-claro-55">{d.morada}</span>
          )}
          {d.responsavel && (
            <span className="text-claro-55">{d.responsavel}</span>
          )}
        </Coluna>

        <Coluna titulo={t("rodape.visitar", idioma)}>
          <Link href={caminho(idioma, "/exposicoes")}>
            {t("nav.exposicoes", idioma)} →
          </Link>
          <Link href={caminho(idioma, "/descarregar")}>
            {t("nav.descarregar", idioma)} ↓
          </Link>
          <Link href={caminho(idioma, "/ver-na-parede")}>
            {t("nav.parede", idioma)} →
          </Link>
        </Coluna>
      </div>

      <div className="flex flex-wrap justify-between gap-5 pt-7 text-[11px] tracking-[0.18em] text-[rgba(242,237,228,0.4)]">
        <span>
          © {ano} GALERIA CONTAGIARTE® ·{" "}
          <Link href={caminho(idioma, "/privacidade")}>
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
    <div className="flex flex-col gap-3 text-[17px]">
      <span className="text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.45)] uppercase">
        {titulo}
      </span>
      {children}
    </div>
  );
}
