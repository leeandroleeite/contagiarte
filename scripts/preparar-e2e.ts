/**
 * Prepara a base de dados local para os testes ponta a ponta:
 * garante o conteúdo semeado e uma palavra-passe conhecida.
 *
 * Nunca correr contra produção: só mexe na base do DATABASE_URL local.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, sql } from "../src/lib/db";
import { utilizadores } from "../src/lib/db/schema";

const EMAIL = "galeria@contagiarte.pt";
const PALAVRA_PASSE = process.env.E2E_ADMIN_PASSWORD ?? "teste-e2e-12345";

async function principal() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1|@postgres[:/]/.test(url)) {
    console.error(
      "Recusado: os testes só preparam bases de dados locais. DATABASE_URL aponta para fora.",
    );
    process.exit(1);
  }

  const [existente] = await db
    .select()
    .from(utilizadores)
    .where(eq(utilizadores.email, EMAIL))
    .limit(1);

  const hash = await bcrypt.hash(PALAVRA_PASSE, 12);

  if (existente) {
    await db
      .update(utilizadores)
      .set({ palavraPasseHash: hash, activo: true, papel: "administrador" })
      .where(eq(utilizadores.id, existente.id));
  } else {
    await db.insert(utilizadores).values({
      email: EMAIL,
      nome: "Galeria Contagiarte",
      papel: "administrador",
      palavraPasseHash: hash,
    });
  }

  console.log(`Pronto para os testes: ${EMAIL}`);
  await sql.end();
  process.exit(0);
}

principal().catch(async (erro) => {
  console.error(erro);
  await sql.end({ timeout: 5 }).catch(() => {});
  process.exit(1);
});
