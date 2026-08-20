import { redirect } from "next/navigation";
import { sessaoActual } from "@/lib/auth";
import { FormularioEntrada } from "./FormularioEntrada";

export const dynamic = "force-dynamic";

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  const { destino } = await searchParams;
  if (await sessaoActual()) redirect(destino ?? "/admin");

  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6 py-16">
      <span
        className="titulo mb-2 text-[13px] tracking-[0.2em]"
        style={{ lineHeight: 1 }}
      >
        CONTAGIARTE®
      </span>
      <h1 className="titulo mb-8 text-[34px] leading-none">Backoffice</h1>
      <FormularioEntrada destino={destino} />
    </main>
  );
}
