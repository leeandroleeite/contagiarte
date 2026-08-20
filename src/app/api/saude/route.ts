import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Verificação de saúde usada pela Fly. Confirma que a aplicação
 * responde e que a base de dados está ao alcance: uma app viva sem
 * base de dados não serve de nada e não deve receber tráfego.
 */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json(
      { ok: true, ambiente: env.ambiente },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (erro) {
    console.error("[saude] base de dados inacessível:", erro);
    return NextResponse.json(
      { ok: false, erro: "base de dados inacessível" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
