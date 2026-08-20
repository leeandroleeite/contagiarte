"use client";

import { useActionState, useState } from "react";
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

type Campos = {
  nome: string;
  contacto: string;
  medidas: string;
  mensagem: string;
};

const VAZIO: Campos = { nome: "", contacto: "", medidas: "", mensagem: "" };

/**
 * Formulário de pedido. Serve a moldura, o interesse numa obra, a
 * marcação de visita e o contacto geral: muda só o tipo e os campos
 * extra. Funciona sem JavaScript, porque é uma server action normal.
 *
 * Os campos são controlados de propósito: se o servidor recusar o
 * pedido, o formulário volta a renderizar, e campos não controlados
 * perderiam tudo o que a pessoa escreveu.
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
  const [campos, setCampos] = useState<Campos>(VAZIO);

  const mudar = (chave: keyof Campos) => (valor: string) =>
    setCampos((c) => ({ ...c, [chave]: valor }));

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

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(150px,100%),1fr))" }}
      >
        <Campo
          prefixo={tipo}
          nome="nome"
          rotulo={t("campo.nome", idioma)}
          autoComplete="name"
          obrigatorio
          valor={campos.nome}
          aoMudar={mudar("nome")}
        />
        <Campo
          prefixo={tipo}
          nome="contacto"
          rotulo={t("campo.contacto", idioma)}
          autoComplete="email"
          obrigatorio
          valor={campos.contacto}
          aoMudar={mudar("contacto")}
        />
        {comMedidas && (
          <Campo
            prefixo={tipo}
            nome="medidas"
            rotulo={t("campo.medidas", idioma)}
            valor={campos.medidas}
            aoMudar={mudar("medidas")}
          />
        )}
      </div>

      <label htmlFor={`pedido-mensagem-${tipo}`} className="so-leitor">
        {t("campo.mensagem", idioma)}
      </label>
      <textarea
        id={`pedido-mensagem-${tipo}`}
        name="mensagem"
        rows={3}
        value={campos.mensagem}
        onChange={(e) => mudar("mensagem")(e.target.value)}
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
  prefixo,
  nome,
  rotulo,
  autoComplete,
  obrigatorio = false,
  valor,
  aoMudar,
}: {
  prefixo: string;
  nome: string;
  rotulo: string;
  autoComplete?: string;
  obrigatorio?: boolean;
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  const id = `pedido-${prefixo}-${nome}`;
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
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="campo"
      />
    </div>
  );
}
