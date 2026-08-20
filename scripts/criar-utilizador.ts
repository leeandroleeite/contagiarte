/**
 * Cria ou repõe a palavra-passe de um utilizador do backoffice.
 *
 *   npm run admin:criar -- email@dominio.pt "Nome Completo" [administrador|editor]
 *
 * A palavra-passe é gerada e mostrada uma única vez.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, sql } from "../src/lib/db";
import { utilizadores } from "../src/lib/db/schema";

function gerarPalavraPasse(): string {
  const alfabeto = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}

async function principal() {
  const [emailBruto, nome, papelBruto] = process.argv.slice(2);

  if (!emailBruto) {
    console.error(
      'Uso: npm run admin:criar -- email@dominio.pt "Nome" [administrador|editor]',
    );
    process.exit(1);
  }

  const email = emailBruto.trim().toLowerCase();
  const papel = papelBruto === "administrador" ? "administrador" : "editor";
  const palavraPasse = process.env.ADMIN_PASSWORD ?? gerarPalavraPasse();
  const hash = await bcrypt.hash(palavraPasse, 12);

  const [existente] = await db
    .select()
    .from(utilizadores)
    .where(eq(utilizadores.email, email))
    .limit(1);

  if (existente) {
    await db
      .update(utilizadores)
      .set({ palavraPasseHash: hash, activo: true })
      .where(eq(utilizadores.id, existente.id));
    console.log(`Palavra-passe reposta para ${email}.`);
  } else {
    await db.insert(utilizadores).values({
      email,
      nome: nome || email,
      papel,
      palavraPasseHash: hash,
    });
    console.log(`Utilizador criado: ${email} (${papel}).`);
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.log(`Palavra-passe: ${palavraPasse}`);
    console.log("Guarde-a agora; não volta a ser mostrada.");
  }

  await sql.end();
  process.exit(0);
}

principal().catch(async (erro) => {
  console.error("Falhou:", erro);
  await sql.end({ timeout: 5 }).catch(() => {});
  process.exit(1);
});
