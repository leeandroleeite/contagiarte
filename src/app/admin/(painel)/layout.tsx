import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraAdmin } from "@/components/admin/BarraAdmin";
import {
  NavAdmin,
  ROTULOS_SECCOES,
  type ContagensAdmin,
} from "@/components/admin/NavAdmin";
import { exigirSessao, sair } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  artistas,
  descarregaveis,
  exposicoes,
  lugares,
  media,
  obras,
  pedidos,
  salas,
  textos,
} from "@/lib/db/schema";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";

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

  const [
    nObras,
    nArtistas,
    nExposicoes,
    nLugares,
    nSalas,
    nTextos,
    nDescarregaveis,
    nMedia,
    nPedidos,
  ] = await Promise.all([
    db.$count(obras),
    db.$count(artistas),
    db.$count(exposicoes),
    db.$count(lugares),
    db.$count(salas),
    db.$count(textos),
    db.$count(descarregaveis),
    db.$count(media),
    // Nos pedidos interessa o que está por ver, não o total.
    db.$count(pedidos, eq(pedidos.estado, "novo")),
  ]);

  const contagens: ContagensAdmin = {
    obras: nObras,
    artistas: nArtistas,
    exposicoes: nExposicoes,
    lugares: nLugares,
    percurso: nSalas,
    textos: nTextos,
    descarregaveis: nDescarregaveis,
    media: nMedia,
    pedidos: nPedidos,
  };

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Barra lateral escura, como no desenho: contrasta com a área de
          trabalho clara e mantém a marca presente. */}
      {/* Lateral em ecrã largo, de topo no telemóvel: ver BarraAdmin. */}
      <BarraAdmin seccaoActual={ROTULOS_SECCOES}>
        <NavAdmin papel={sessao.papel} contagens={contagens} />

        <div className="mt-auto flex flex-col gap-2.5 border border-[rgba(242,237,228,0.18)] p-4">
          <span className="text-[11px] tracking-[0.16em] text-[rgba(242,237,228,0.55)]">
            SESSÃO
          </span>
          <span className="text-[14px]">{sessao.nome}</span>
          <span className="text-[12px] text-[rgba(242,237,228,0.55)]">
            {env.ambiente === "producao" ? "Produção" : env.ambiente}
          </span>
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="text-[12px] tracking-[0.1em] text-ouro no-underline hover:text-papel"
          >
            Ver o site →
          </Link>
          <form action={terminarSessao}>
            <button
              type="submit"
              className="cursor-pointer border-0 bg-transparent p-0 text-[12px] tracking-[0.1em] text-[rgba(242,237,228,0.55)] underline underline-offset-[3px] hover:text-papel"
            >
              Terminar sessão
            </button>
          </form>
        </div>
      </BarraAdmin>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
