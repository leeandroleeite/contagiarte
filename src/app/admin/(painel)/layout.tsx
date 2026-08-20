import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirSessao, sair } from "@/lib/auth";
import { env } from "@/lib/env";
import { NavAdmin } from "@/components/admin/NavAdmin";

export const dynamic = "force-dynamic";

async function terminarSessao() {
  "use server";
  await sair();
  redirect("/admin/entrar");
}

export default async function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await exigirSessao();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col lg:flex-row">
      <aside className="shrink-0 border-b border-adm-fio lg:w-[230px] lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-6 p-6 lg:sticky lg:top-0">
          <div>
            <Link
              href="/admin"
              className="titulo block text-[13px] tracking-[0.2em] no-underline"
              style={{ lineHeight: 1 }}
            >
              CONTAGIARTE®
            </Link>
            <span className="mt-1 block text-[11px] tracking-[0.18em] text-adm-suave uppercase">
              Backoffice
              {env.ambiente !== "producao" && ` · ${env.ambiente}`}
            </span>
          </div>

          <NavAdmin papel={sessao.papel} />

          <div className="mt-auto flex flex-col gap-2 border-t border-adm-fio pt-5 text-[13px]">
            <span className="text-adm-suave">{sessao.nome}</span>
            <Link href="/" target="_blank" rel="noopener">
              Ver o site →
            </Link>
            <form action={terminarSessao}>
              <button
                type="submit"
                className="cursor-pointer border-0 bg-transparent p-0 text-[13px] underline underline-offset-[3px]"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
