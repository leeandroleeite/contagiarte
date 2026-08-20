"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

/** Rodapé de formulário: guardar, cancelar e o que mais for preciso. */
export function BarraGuardar({
  voltarPara,
  extra,
}: {
  voltarPara: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-adm-fio pt-6">
      <Guardar />
      <Link href={voltarPara} className="adm-botao adm-botao-linha no-underline">
        Cancelar
      </Link>
      <span className="flex-1" />
      {extra}
    </div>
  );
}

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="adm-botao" disabled={pending}>
      {pending ? "A guardar…" : "Guardar"}
    </button>
  );
}
