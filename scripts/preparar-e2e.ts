/**
 * Prepara a base de dados local para os testes ponta a ponta:
 * garante o conteúdo semeado e uma palavra-passe conhecida.
 *
 * Nunca correr contra produção: recusa qualquer DADOS_DIR que não
 * seja a pasta `var/` local.
 */
import path from "node:path";
import bcrypt from "bcryptjs";
import { eq, like, or, sql as bruto } from "drizzle-orm";
import { caminhoDaBase, db, fecharBase } from "../src/lib/db";
import { TEXTOS } from "./textos";
import {
  artistas,
  definicoes,
  descarregaveis,
  exposicoes,
  lugares,
  media as tMedia,
  obras,
  salas,
  textos,
  utilizadores,
} from "../src/lib/db/schema";
import { DEFINICOES_OMISSAO } from "../src/lib/db/omissoes";

const EMAIL = "galeria@contagiarte.pt";
const PALAVRA_PASSE = process.env.E2E_ADMIN_PASSWORD ?? "teste-e2e-12345";

async function principal() {
  // Este script apaga e reescreve conteúdo. Se alguma vez apontar para
  // o volume de produção, apaga o trabalho da galeria. Por isso recusa
  // qualquer coisa que não seja a pasta de dados local.
  const dir = path.resolve(process.env.DADOS_DIR ?? "var");
  if (!dir.startsWith(path.resolve("var"))) {
    console.error(
      `Recusado: os testes só preparam a base local. DADOS_DIR aponta para ${dir}.`,
    );
    process.exit(1);
  }
  console.log(`Base de teste: ${caminhoDaBase()}`);

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

  // Restos de corridas anteriores. Um teste interrompido antes de
  // apagar o que criou deixava conteúdo de teste visível no site e,
  // pior, fazia falhar os testes seguintes que contam quantas obras ou
  // salas existem. Tudo o que os testes criam segue um padrão de nome,
  // e é por aí que se apanha.
  const restos: Array<[string, Promise<Array<{ id: string }>>]> = [
    [
      "obras",
      db
        .delete(obras)
        .where(
          or(like(obras.slug, "obra-de-teste-%"), like(obras.slug, "rascunho-%")),
        )
        .returning({ id: obras.id }),
    ],
    [
      "artistas",
      db
        .delete(artistas)
        .where(like(artistas.slug, "artista-teste-%"))
        .returning({ id: artistas.id }),
    ],
    [
      "exposições",
      db
        .delete(exposicoes)
        .where(like(exposicoes.slug, "exposicao-teste-%"))
        .returning({ id: exposicoes.id }),
    ],
    [
      "lugares",
      db
        .delete(lugares)
        .where(like(lugares.slug, "lugar-teste-%"))
        .returning({ id: lugares.id }),
    ],
    [
      "descarregáveis",
      db
        .delete(descarregaveis)
        .where(like(descarregaveis.slug, "documento-teste-%"))
        .returning({ id: descarregaveis.id }),
    ],
    [
      "salas",
      db
        .delete(salas)
        .where(bruto`json_extract(${salas.nome}, '$.pt') like 'Sala de teste %'`)
        .returning({ id: salas.id }),
    ],
  ];

  for (const [nome, promessa] of restos) {
    const apagados = await promessa;
    if (apagados.length > 0) {
      console.log(`Limpos ${apagados.length} ${nome} de teste que tinham ficado.`);
    }
  }

  // As imagens de teste ficam para o fim: só depois de apagado o que
  // as usava é que a chave estrangeira deixa removê-las.
  const media = await db
    .delete(tMedia)
    .where(
      or(
        like(tMedia.nomeOriginal, "teste-%"),
        like(tMedia.nomeOriginal, "media-%"),
      ),
    )
    .returning({ id: tMedia.id });
  if (media.length > 0) {
    console.log(`Limpos ${media.length} ficheiros de teste que tinham ficado.`);
  }

  // Os textos voltam ao que a semente diz. Um teste interrompido a meio
  // de traduzir deixava a frase de teste na base — e, como os textos
  // saem directos para o site, ficava lá à vista de toda a gente.
  for (const t of TEXTOS) {
    await db
      .insert(textos)
      .values(t)
      .onConflictDoUpdate({
        target: textos.chave,
        set: { valor: t.valor, actualizadoEm: new Date() },
      });
  }

  // As definições voltam ao estado conhecido. Sem isto, um teste
  // interrompido a meio de mudar o número de WhatsApp deixava a base
  // suja e todos os testes seguintes falhavam.
  await db
    .insert(definicoes)
    .values({ id: 1, valor: DEFINICOES_OMISSAO })
    .onConflictDoUpdate({
      target: definicoes.id,
      set: { valor: DEFINICOES_OMISSAO, actualizadoEm: new Date() },
    });

  console.log(`Pronto para os testes: ${EMAIL}`);
  fecharBase();
  process.exit(0);
}

principal().catch(async (erro) => {
  console.error(erro);
  fecharBase();
  process.exit(1);
});
