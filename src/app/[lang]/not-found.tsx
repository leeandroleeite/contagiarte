import Link from "next/link";
import { Seccao } from "@/components/Seccao";
import { t } from "@/lib/i18n";
import { caminho, IDIOMA_BASE } from "@/lib/i18n/config";

/**
 * O `not-found` do segmento de idioma não recebe params, por isso
 * responde sempre em português, a língua de origem do site.
 */
export default function NaoEncontrado() {
  const idioma = IDIOMA_BASE;

  const saidas = [
    { href: "/", rotulo: t("nav.inicio", idioma) },
    { href: "/exposicoes", rotulo: t("nav.exposicoes", idioma) },
    { href: "/obras", rotulo: t("nav.obras", idioma) },
    { href: "/contactos", rotulo: t("nav.contactos", idioma) },
  ];

  return (
    <Seccao className="pt-[180px]" semFio>
      <h1 className="titulo d-1 max-w-[14ch]">
        {t("404.titulo", idioma).toUpperCase()}
      </h1>
      <p className="mt-8 max-w-[48ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.75)]">
        {t("404.texto", idioma)}
      </p>
      <ul className="mt-12 flex flex-col">
        {saidas.map((s) => (
          <li key={s.href}>
            <Link
              href={caminho(idioma, s.href)}
              className="block border-t border-[rgba(242,237,228,0.16)] py-6 text-papel transition-colors hover:text-ouro"
            >
              <span className="titulo-med text-[clamp(20px,3vw,36px)]">
                {s.rotulo}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Seccao>
  );
}
