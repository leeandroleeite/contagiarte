"use client";

import { useActionState, useState } from "react";
import { subscrever, type Resultado } from "@/app/accoes";
import { t } from "@/lib/i18n";
import type { Idioma } from "@/lib/i18n/config";

/**
 * Subscrição da newsletter. Sobre o bloco claro do design, por isso a
 * linha é preta e o botão é sólido.
 *
 * O campo é controlado de propósito: quando o servidor recusa o
 * endereço, o formulário volta a renderizar, e um campo não controlado
 * perderia o que a pessoa escreveu. Sem JavaScript continua a funcionar,
 * porque a acção é uma server action normal.
 */
export function FormularioNewsletter({
  idioma,
  origem = "site",
}: {
  idioma: Idioma;
  origem?: string;
}) {
  const [estado, accao, aEnviar] = useActionState<Resultado | null, FormData>(
    subscrever,
    null,
  );
  const [email, setEmail] = useState("");

  // Depois de subscrever com sucesso, o campo fica limpo para não dar
  // a ideia de que é preciso submeter outra vez.
  const valor = estado?.ok ? "" : email;

  return (
    <form action={accao} className="flex flex-col gap-4">
      <input type="hidden" name="idioma" value={idioma} />
      <input type="hidden" name="origem" value={origem} />
      {/* Armadilha para robôs: invisível e sem foco por teclado. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="flex border-b-2 border-tinta">
        <label htmlFor="newsletter-email" className="so-leitor">
          {t("campo.email", idioma)}
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={t("campo.email_exemplo", idioma)}
          value={valor}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent px-1 py-[18px] text-[18px] text-tinta outline-none placeholder:text-[rgba(14,12,11,0.4)]"
        />
        <button
          type="submit"
          disabled={aEnviar}
          className="cursor-pointer border-0 bg-tinta px-[26px] py-[18px] text-[12px] tracking-[0.18em] text-papel uppercase transition-colors hover:bg-ouro hover:text-tinta disabled:opacity-60"
        >
          {aEnviar ? t("msg.a_enviar", idioma) : t("acao.subscrever", idioma)}
        </button>
      </div>

      <span
        role="status"
        aria-live="polite"
        className="text-[14px] text-[rgba(14,12,11,0.55)]"
      >
        {estado
          ? t(estado.mensagem, idioma)
          : t("msg.newsletter_nota", idioma)}
      </span>
    </form>
  );
}
