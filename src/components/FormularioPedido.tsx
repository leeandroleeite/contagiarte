"use client";

import { useActionState } from "react";
import { enviarPedido, type Resultado } from "@/app/accoes";
import { t } from "@/lib/i18n";
import type { Idioma } from "@/lib/i18n/config";

type Props = {
  idioma: Idioma;
  tipo: "moldura" | "obra" | "contacto" | "visita" | "parede";
  /** Mostra o campo de medidas (pedidos de moldura). */
  comMedidas?: boolean;
  obraSlug?: string;
  /** Contexto já preenchido, ex. a combinação escolhida na parede. */
  extra?: string;
  origem?: string;
  rotuloBotao?: string;
};

/**
 * Formulário de pedido. Serve a moldura, o interesse numa obra, a
 * marcação de visita e o contacto geral: muda só o tipo e os campos
 * extra. Funciona sem JavaScript, porque é uma server action normal.
 */
export function FormularioPedido({
  idioma,
  tipo,
  comMedidas = false,
  obraSlug,
  extra,
  origem = "site",
  rotuloBotao,
}: Props) {
  const [estado, accao, aEnviar] = useActionState<Resultado | null, FormData>(
    enviarPedido,
    null,
  );

  if (estado?.ok) {
    return (
      <p
        role="status"
        className="border border-ouro bg-[rgba(180,136,74,0.08)] p-7 text-[16px] text-papel"
      >
        {t("msg.enviado", idioma)}
      </p>
    );
  }

  return (
    <form action={accao} className="flex flex-col gap-4">
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="idioma" value={idioma} />
      <input type="hidden" name="origem" value={origem} />
      {obraSlug && <input type="hidden" name="obraSlug" value={obraSlug} />}
      {extra && <input type="hidden" name="extra" value={extra} />}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
        <Campo
          nome="nome"
          rotulo={t("campo.nome", idioma)}
          autoComplete="name"
          obrigatorio
        />
        <Campo
          nome="contacto"
          rotulo={t("campo.contacto", idioma)}
          autoComplete="email"
          obrigatorio
        />
        {comMedidas && (
          <Campo nome="medidas" rotulo={t("campo.medidas", idioma)} />
        )}
      </div>

      <label htmlFor="pedido-mensagem" className="so-leitor">
        {t("campo.mensagem", idioma)}
      </label>
      <textarea
        id="pedido-mensagem"
        name="mensagem"
        rows={3}
        placeholder={
          tipo === "moldura"
            ? t("campo.emoldurar", idioma)
            : t("campo.mensagem", idioma)
        }
        className="campo resize-y"
      />

      <button
        type="submit"
        disabled={aEnviar}
        className="min-h-12 cursor-pointer self-start border-0 bg-ouro px-7 py-4 text-[12px] tracking-[0.18em] text-tinta uppercase transition-colors hover:bg-papel disabled:opacity-60"
      >
        {aEnviar
          ? t("msg.a_enviar", idioma)
          : (rotuloBotao ?? t("acao.enviar", idioma))}
      </button>

      <span
        role="status"
        aria-live="polite"
        className="text-[13px] text-claro-55"
      >
        {estado && !estado.ok
          ? t(estado.mensagem, idioma)
          : t("campo.rgpd", idioma)}
      </span>
    </form>
  );
}

function Campo({
  nome,
  rotulo,
  autoComplete,
  obrigatorio = false,
}: {
  nome: string;
  rotulo: string;
  autoComplete?: string;
  obrigatorio?: boolean;
}) {
  const id = `pedido-${nome}`;
  return (
    <div>
      <label htmlFor={id} className="so-leitor">
        {rotulo}
      </label>
      <input
        id={id}
        name={nome}
        type="text"
        required={obrigatorio}
        autoComplete={autoComplete}
        placeholder={rotulo}
        className="campo"
      />
    </div>
  );
}
