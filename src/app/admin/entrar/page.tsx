import { redirect } from "next/navigation";
import { Aviso } from "@/components/admin/Pecas";
import { sessaoActual } from "@/lib/auth";
import { CAMINHO_GOOGLE } from "@/lib/auth/google";
import { env } from "@/lib/env";
import { FormularioEntrada } from "./FormularioEntrada";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  "sem-acesso":
    "Esta conta Google não tem acesso ao backoffice. Peça a um administrador que a acrescente em Utilizadores.",
  cancelado: "A entrada com o Google foi cancelada.",
  expirou: "A entrada demorou demasiado. Tente outra vez.",
  token: "Não foi possível confirmar a conta Google. Tente outra vez.",
  "google-desligado": "A entrada com o Google não está configurada.",
};

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string; erro?: string }>;
}) {
  const { destino, erro } = await searchParams;
  if (await sessaoActual()) redirect(destino ?? "/admin");

  const comGoogle = env.google.configurado;
  const irParaGoogle = `${CAMINHO_GOOGLE}?destino=${encodeURIComponent(destino ?? "/admin")}`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6 py-16">
      <span
        className="titulo mb-2 text-[13px] tracking-[0.2em]"
        style={{ lineHeight: 1 }}
      >
        CONTAGIARTE®
      </span>
      <h1 className="titulo mb-8 text-[34px] leading-none">Backoffice</h1>
      {erro && ERROS[erro] && <Aviso tom="erro">{ERROS[erro]}</Aviso>}
      {comGoogle ? (
        // Um link e não um formulário: é uma navegação para a Google, e
        // a política de segurança só deixa os formulários irem para cá.
        <a href={irParaGoogle} className="adm-botao">
          Entrar com o Google
        </a>
      ) : (
        <FormularioEntrada destino={destino} />
      )}
    </main>
  );
}
