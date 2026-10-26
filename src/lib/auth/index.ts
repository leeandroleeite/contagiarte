import "server-only";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { registo, utilizadores } from "@/lib/db/schema";
import {
  assinarSessao,
  COOKIE_SESSAO,
  lerToken,
  OPCOES_COOKIE,
  type Sessao,
} from "./sessao";

export { COOKIE_SESSAO, type Sessao } from "./sessao";

export async function baralhar(palavraPasse: string): Promise<string> {
  return bcrypt.hash(palavraPasse, 12);
}

export async function conferir(
  palavraPasse: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(palavraPasse, hash);
}

/** Sessão do pedido actual, ou null se não houver login válido. */
export async function sessaoActual(): Promise<Sessao | null> {
  const bolo = await cookies();
  const token = bolo.get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  return lerToken(token);
}

/** Usar em páginas do backoffice: sem sessão, manda para o login. */
export async function exigirSessao(destino?: string): Promise<Sessao> {
  const sessao = await sessaoActual();
  if (!sessao) {
    const q = destino ? `?destino=${encodeURIComponent(destino)}` : "";
    redirect(`/admin/entrar${q}`);
  }
  return sessao;
}

export async function exigirAdministrador(): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (sessao.papel !== "administrador") {
    redirect("/admin?erro=sem-permissao");
  }
  return sessao;
}

export type ResultadoEntrada =
  | { ok: true; sessao: Sessao }
  | { ok: false; erro: string };

export async function entrar(
  email: string,
  palavraPasse: string,
): Promise<ResultadoEntrada> {
  const normalizado = email.trim().toLowerCase();
  const [utilizador] = await db
    .select()
    .from(utilizadores)
    .where(eq(utilizadores.email, normalizado))
    .limit(1);

  // Compara sempre, mesmo sem utilizador, para o tempo de resposta não
  // revelar que endereços existem.
  const hash =
    utilizador?.palavraPasseHash ??
    "$2a$12$0000000000000000000000000000000000000000000000000000";
  const valida = await conferir(palavraPasse, hash);

  if (!utilizador || !utilizador.activo || !valida) {
    return { ok: false, erro: "Credenciais inválidas." };
  }

  return { ok: true, sessao: await abrirSessao(utilizador) };
}

type Utilizador = typeof utilizadores.$inferSelect;

async function abrirSessao(utilizador: Utilizador): Promise<Sessao> {
  const sessao: Sessao = {
    id: utilizador.id,
    email: utilizador.email,
    nome: utilizador.nome,
    papel: utilizador.papel,
  };

  const bolo = await cookies();
  bolo.set(COOKIE_SESSAO, await assinarSessao(sessao), OPCOES_COOKIE);

  await db
    .update(utilizadores)
    .set({ ultimoAcesso: new Date() })
    .where(eq(utilizadores.id, utilizador.id));

  return sessao;
}

/**
 * Hash de uma palavra-passe que ninguém sabe. A coluna é obrigatória,
 * e quem entra com o Google não tem palavra-passe nenhuma.
 */
export async function palavraPasseInutil(): Promise<string> {
  return baralhar(randomBytes(32).toString("hex"));
}

/** Se este email é de um proprietário do site (ver `env.proprietarios`). */
export function eProprietario(email: string): boolean {
  return env.proprietarios.includes(email.trim().toLowerCase());
}

/**
 * Entrada de quem a Google já confirmou.
 *
 * Só entra quem estiver em Utilizadores e activo. A excepção são os
 * proprietários, que à primeira vez ficam registados como
 * administradores, sem isso um backoffice novo não tinha por onde
 * começar, e que a cada entrada voltam a sê-lo: se alguém os tiver
 * desactivado ou baixado a editor directamente na base, isto desfaz.
 */
export async function entrarComGoogle(pessoa: {
  email: string;
  nome: string;
}): Promise<ResultadoEntrada> {
  let [utilizador] = await db
    .select()
    .from(utilizadores)
    .where(eq(utilizadores.email, pessoa.email))
    .limit(1);

  if (eProprietario(pessoa.email)) {
    if (!utilizador) {
      [utilizador] = await db
        .insert(utilizadores)
        .values({
          email: pessoa.email,
          nome: pessoa.nome || pessoa.email,
          papel: "administrador",
          activo: true,
          palavraPasseHash: await palavraPasseInutil(),
        })
        .returning();
      await registar(null, "criou", "utilizador", utilizador.id, pessoa.email);
    } else if (!utilizador.activo || utilizador.papel !== "administrador") {
      [utilizador] = await db
        .update(utilizadores)
        .set({ activo: true, papel: "administrador" })
        .where(eq(utilizadores.id, utilizador.id))
        .returning();
    }
  }

  if (!utilizador || !utilizador.activo) {
    return { ok: false, erro: "sem-acesso" };
  }

  return { ok: true, sessao: await abrirSessao(utilizador) };
}

export async function sair(): Promise<void> {
  const bolo = await cookies();
  bolo.set(COOKIE_SESSAO, "", { ...OPCOES_COOKIE, maxAge: 0 });
}

/** Deixa rasto de quem alterou o quê, para o histórico do backoffice. */
export async function registar(
  sessao: Sessao | null,
  accao: string,
  entidade: string,
  entidadeId?: string | null,
  resumo?: string,
): Promise<void> {
  try {
    await db.insert(registo).values({
      utilizadorId: sessao?.id ?? null,
      accao,
      entidade,
      entidadeId: entidadeId ?? null,
      resumo: resumo ?? null,
    });
  } catch {
    // O registo é acessório: nunca deve fazer falhar a operação.
  }
}
