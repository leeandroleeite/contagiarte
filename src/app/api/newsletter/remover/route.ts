import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscritores } from "@/lib/db/schema";
import { env } from "@/lib/env";

/** Remove a subscrição. O link vai no fim de cada newsletter. */
export async function GET(pedido: Request) {
  const token = new URL(pedido.url).searchParams.get("token");
  if (token) {
    await db
      .update(subscritores)
      .set({ estado: "removido" })
      .where(eq(subscritores.token, token));
  }
  return NextResponse.redirect(`${env.urlPublico}/?newsletter=removida`);
}
