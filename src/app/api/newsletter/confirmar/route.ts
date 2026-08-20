import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscritores } from "@/lib/db/schema";
import { env } from "@/lib/env";

/** Confirma uma subscrição a partir do link enviado por email. */
export async function GET(pedido: Request) {
  const token = new URL(pedido.url).searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${env.urlPublico}/?newsletter=erro`);
  }

  const [linha] = await db
    .select()
    .from(subscritores)
    .where(eq(subscritores.token, token))
    .limit(1);

  if (!linha) {
    return NextResponse.redirect(`${env.urlPublico}/?newsletter=erro`);
  }

  await db
    .update(subscritores)
    .set({ estado: "activo", confirmadoEm: new Date() })
    .where(eq(subscritores.id, linha.id));

  return NextResponse.redirect(`${env.urlPublico}/?newsletter=confirmada`);
}
