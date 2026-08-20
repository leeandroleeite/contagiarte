"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { obras, pedidos, subscritores } from "@/lib/db/schema";
import { corpoPedido, enviarEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { eIdioma } from "@/lib/i18n/config";

export type Resultado = {
  ok: boolean;
  /** Chave do dicionário a mostrar ao utilizador. */
  mensagem: "msg.enviado" | "msg.subscrito" | "msg.erro" | "msg.email_invalido";
};

const ERRO: Resultado = { ok: false, mensagem: "msg.erro" };

/** Travão simples por IP, guardado em memória do processo. */
const ultimos = new Map<string, number[]>();
const JANELA = 60_000;
const MAXIMO = Number(process.env.LIMITE_FORMULARIOS ?? 5);

async function demasiadosPedidos(): Promise<boolean> {
  const cabecalhos = await headers();
  const ip =
    cabecalhos.get("fly-client-ip") ??
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "desconhecido";

  const agora = Date.now();
  const registos = (ultimos.get(ip) ?? []).filter((t) => agora - t < JANELA);
  registos.push(agora);
  ultimos.set(ip, registos);

  // Limpeza preguiçosa, para o mapa não crescer sem fim.
  if (ultimos.size > 500) {
    for (const [chave, tempos] of ultimos) {
      if (tempos.every((t) => agora - t > JANELA)) ultimos.delete(chave);
    }
  }

  return registos.length > MAXIMO;
}

const idiomaOuPt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "pt");
  return eIdioma(s) ? s : "pt";
};

/** Campo escondido que só um robô preenche. */
function eRobo(dados: FormData): boolean {
  return Boolean(String(dados.get("website") ?? "").trim());
}

// --------------------------------------------------------------------
// Newsletter
// --------------------------------------------------------------------

const esquemaNewsletter = z.object({
  email: z.string().trim().toLowerCase().email(),
  nome: z.string().trim().max(120).optional(),
});

export async function subscrever(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  if (eRobo(dados)) return { ok: true, mensagem: "msg.subscrito" };

  // A validação vem antes do travão: um erro de escrita não deve gastar
  // a quota de quem depois quer mesmo subscrever.
  const analise = esquemaNewsletter.safeParse({
    email: dados.get("email"),
    nome: dados.get("nome") ?? undefined,
  });
  if (!analise.success) return { ok: false, mensagem: "msg.email_invalido" };

  if (await demasiadosPedidos()) return ERRO;

  try {
    const token = crypto.randomUUID();
    await db
      .insert(subscritores)
      .values({
        email: analise.data.email,
        nome: analise.data.nome || null,
        idioma: idiomaOuPt(dados.get("idioma")),
        // Sem duplo opt-in por email configurado, a subscrição fica
        // activa de imediato; o token continua a servir para remover.
        estado: env.email.configurado ? "pendente" : "activo",
        token,
        origem: String(dados.get("origem") ?? "site"),
      })
      .onConflictDoUpdate({
        target: subscritores.email,
        set: { idioma: idiomaOuPt(dados.get("idioma")) },
      });

    if (env.email.configurado) {
      await enviarEmail({
        para: analise.data.email,
        assunto: "Confirme a subscrição da newsletter da Galeria Contagiarte",
        texto: [
          "Obrigado pelo interesse na Galeria Contagiarte.",
          "",
          "Confirme a subscrição neste endereço:",
          `${env.urlPublico}/newsletter/confirmar?token=${token}`,
          "",
          "Se não foi você que pediu, ignore esta mensagem.",
        ].join("\n"),
      });
    }

    return { ok: true, mensagem: "msg.subscrito" };
  } catch (erro) {
    console.error("[newsletter]", erro);
    return ERRO;
  }
}

// --------------------------------------------------------------------
// Pedidos de contacto, orçamento de moldura e interesse numa obra
// --------------------------------------------------------------------

const esquemaPedido = z.object({
  tipo: z.enum(["moldura", "obra", "contacto", "visita", "parede"]),
  nome: z.string().trim().min(2).max(120),
  contacto: z.string().trim().min(3).max(160),
  mensagem: z.string().trim().max(4000).optional(),
  medidas: z.string().trim().max(160).optional(),
  obraSlug: z.string().trim().max(120).optional(),
  extra: z.string().trim().max(1000).optional(),
});

export async function enviarPedido(
  _anterior: Resultado | null,
  dados: FormData,
): Promise<Resultado> {
  if (eRobo(dados)) return { ok: true, mensagem: "msg.enviado" };

  const analise = esquemaPedido.safeParse({
    tipo: dados.get("tipo"),
    nome: dados.get("nome"),
    contacto: dados.get("contacto"),
    mensagem: dados.get("mensagem") ?? undefined,
    medidas: dados.get("medidas") ?? undefined,
    obraSlug: dados.get("obraSlug") ?? undefined,
    extra: dados.get("extra") ?? undefined,
  });
  if (!analise.success) return ERRO;

  // Só depois de o pedido ser válido é que conta para o travão por IP.
  if (await demasiadosPedidos()) return ERRO;

  const p = analise.data;
  const pareceEmail = p.contacto.includes("@");

  try {
    let obraId: string | null = null;
    let tituloObra = "";
    if (p.obraSlug) {
      const [obra] = await db
        .select({ id: obras.id, titulo: obras.titulo })
        .from(obras)
        .where(eq(obras.slug, p.obraSlug))
        .limit(1);
      obraId = obra?.id ?? null;
      tituloObra = obra?.titulo?.pt ?? "";
    }

    await db.insert(pedidos).values({
      tipo: p.tipo,
      nome: p.nome,
      email: pareceEmail ? p.contacto : null,
      telefone: pareceEmail ? null : p.contacto,
      mensagem: p.mensagem ?? null,
      dados: {
        ...(p.medidas ? { medidas: p.medidas } : {}),
        ...(p.extra ? { detalhe: p.extra } : {}),
      },
      obraId,
      idioma: idiomaOuPt(dados.get("idioma")),
      origem: String(dados.get("origem") ?? "site"),
    });

    await enviarEmail({
      para: env.email.para,
      assunto: `Pedido novo (${p.tipo}) de ${p.nome}`,
      responderA: pareceEmail ? p.contacto : undefined,
      texto: corpoPedido({
        Tipo: p.tipo,
        Nome: p.nome,
        Contacto: p.contacto,
        Obra: tituloObra || undefined,
        Medidas: p.medidas,
        Mensagem: p.mensagem,
        Detalhe: p.extra,
      }),
    });

    return { ok: true, mensagem: "msg.enviado" };
  } catch (erro) {
    console.error("[pedido]", erro);
    return ERRO;
  }
}
