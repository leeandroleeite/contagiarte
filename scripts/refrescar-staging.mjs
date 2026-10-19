/**
 * Põe na staging uma cópia do conteúdo de produção.
 *
 * A staging e a produção têm cada uma a sua base e o seu bucket, e
 * nada as sincroniza. Com o tempo, a staging fica com o conteúdo do dia
 * em que foi montada e deixa de servir para a galeria ver uma alteração
 * antes de ela ir para o site. Isto refresca-a, à mão, quando é preciso.
 *
 * Corre dentro da máquina da staging, que é onde estão a base, o
 * Litestream e as credenciais. O `scripts/refrescar-staging.sh` trata
 * disso a partir de fora, e é esse que se usa:
 *
 *   npm run staging:refrescar             # faz e reinicia
 *   npm run staging:refrescar -- --ensaio # só confere, não muda nada
 *
 * O que faz, por esta ordem:
 *
 *   1. Restaura o último backup Litestream de produção para um ficheiro
 *      à parte. Não toca na base de produção nem na da staging.
 *   2. Tira-lhe os dados pessoais: pedidos (e os anexos), subscritores
 *      da newsletter e o registo. Os utilizadores de produção também
 *      saem, e entram os da staging, para os acessos não mudarem e os
 *      hashes de produção não virem para cá.
 *   3. Copia para o bucket da staging as fotografias que lá faltam. As
 *      chaves não mudam (`producao/...`): a staging escreve sempre em
 *      `staging/...`, por isso nunca há colisão.
 *   4. Guarda uma cópia da base actual da staging em
 *      `contagiarte.db.antes` e deixa a nova em `contagiarte.db.novo`.
 *
 * A troca em si é o `entrypoint.sh` que a faz, no arranque seguinte,
 * antes de a aplicação e o Litestream abrirem o ficheiro. Trocar a base
 * debaixo de uma aplicação a correr partia as duas coisas.
 *
 * Se alguma fotografia não se copiar, pára antes do passo 4: uma
 * staging com buracos nas imagens é pior do que uma desactualizada.
 *
 * Escrito em JavaScript simples, como o `migrar.mjs`, para correr na
 * imagem sem TypeScript.
 */
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  chownSync,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const ENSAIO = process.argv.includes("--ensaio");

// O uid e gid do utilizador `nextjs` da imagem. O SSH da Fly entra
// como root, e um ficheiro de root no volume ficava fora do alcance da
// aplicação.
const NEXTJS = { uid: 1001, gid: 1001 };

// Onde fica a cópia restaurada enquanto se trabalha nela. Tem os dados
// pessoais de produção até ao passo 2, por isso sai sempre, mesmo
// quando o script pára a meio.
let pastaDeTrabalho = null;

function parar(mensagem) {
  if (pastaDeTrabalho) rmSync(pastaDeTrabalho, { recursive: true, force: true });
  console.error(`\n✗ ${mensagem}`);
  process.exit(1);
}

const descrever = (erro) => erro?.message || erro?.name || String(erro);

function obrigatoria(nome) {
  const v = process.env[nome];
  if (!v) parar(`Falta a variável de ambiente ${nome}.`);
  return v;
}

function doNextjs(ficheiro) {
  if (process.getuid?.() === 0) chownSync(ficheiro, NEXTJS.uid, NEXTJS.gid);
}

// --------------------------------------------------------------------
// 0. Só na staging
// --------------------------------------------------------------------

if (process.env.APP_ENV !== "staging") {
  parar(
    `Isto só corre na staging, e APP_ENV é "${process.env.APP_ENV ?? ""}". ` +
      "Em produção apagava os pedidos e os subscritores verdadeiros.",
  );
}

const DADOS = obrigatoria("DADOS_DIR");
const BASE = path.join(DADOS, "contagiarte.db");
const PASTA = path.join(DADOS, "refresco");
const RESTAURADA = path.join(PASTA, "producao.db");

rmSync(PASTA, { recursive: true, force: true });
mkdirSync(PASTA, { recursive: true });
pastaDeTrabalho = PASTA;

console.log(ENSAIO ? "Ensaio: não se muda nada.\n" : "");

// --------------------------------------------------------------------
// 1. Restaurar o backup de produção para um ficheiro à parte
// --------------------------------------------------------------------

// A mesma configuração do `litestream.yml`, só com outra pasta. Os
// `${...}` são expandidos pelo Litestream a partir do ambiente da
// máquina, por isso as credenciais nunca passam por este ficheiro.
const configuracao = path.join(PASTA, "litestream-producao.yml");
writeFileSync(
  configuracao,
  `dbs:
  - path: ${BASE}
    replicas:
      - type: s3
        bucket: \${LITESTREAM_BUCKET}
        path: producao
        endpoint: \${LITESTREAM_ENDPOINT}
        region: \${LITESTREAM_REGION}
        access-key-id: \${LITESTREAM_ACCESS_KEY_ID}
        secret-access-key: \${LITESTREAM_SECRET_ACCESS_KEY}
`,
);

console.log("1. A restaurar o último backup de produção…");
const restauro = spawnSync(
  "litestream",
  ["restore", "-config", configuracao, "-o", RESTAURADA, BASE],
  { stdio: "inherit" },
);
if (restauro.status !== 0 || !existsSync(RESTAURADA)) {
  parar("O Litestream não conseguiu restaurar a base de produção.");
}

const nova = new Database(RESTAURADA);
nova.pragma("foreign_keys = ON");

const integridade = nova.pragma("integrity_check", { simple: true });
if (integridade !== "ok") parar(`A base restaurada não está íntegra: ${integridade}`);

const contar = (bd, tabela) =>
  bd.prepare(`select count(*) as n from "${tabela}"`).get().n;

const CONTEUDO = ["obras", "artistas", "exposicoes", "lugares", "media", "textos"];
console.log(
  "   " + CONTEUDO.map((t) => `${t} ${contar(nova, t)}`).join(", "),
);

// --------------------------------------------------------------------
// 2. Tirar os dados pessoais e trazer os acessos da staging
// --------------------------------------------------------------------

console.log("2. A tirar os dados pessoais…");

const colunas = (bd, esquema, tabela) =>
  bd
    .prepare(`select name from pragma_table_info(?, ?)`)
    .all(tabela, esquema)
    .map((c) => c.name);

nova.prepare("attach database ? as actual").run(BASE);

// Só as colunas que existem dos dois lados: se uma migração estiver
// aplicada numa base e ainda não na outra, isto não rebenta.
const emComum = colunas(nova, "actual", "utilizadores").filter((c) =>
  colunas(nova, "main", "utilizadores").includes(c),
);
const lista = emComum.map((c) => `"${c}"`).join(", ");

const retirados = {
  pedidos: contar(nova, "pedidos"),
  subscritores: contar(nova, "subscritores"),
  registo: contar(nova, "registo"),
};

nova.transaction(() => {
  // Os anexos são de quem fez o pedido. Saem antes dos pedidos, porque
  // é pelos pedidos que se sabe quais são.
  nova
    .prepare(
      `delete from media where id in
         (select anexo_id from pedidos where anexo_id is not null)`,
    )
    .run();
  nova.prepare("delete from pedidos").run();
  nova.prepare("delete from subscritores").run();
  // O registo aponta para utilizadores, que vão ser trocados.
  nova.prepare("delete from registo").run();
  nova.prepare("delete from utilizadores").run();
  nova
    .prepare(
      `insert into utilizadores (${lista}) select ${lista} from actual.utilizadores`,
    )
    .run();
  nova
    .prepare(
      `insert into registo (id, utilizador_id, accao, entidade, resumo, criado_em)
       values (?, null, 'refrescar', 'staging', ?, ?)`,
    )
    .run(
      randomUUID(),
      "Conteúdo copiado de produção, sem pedidos, subscritores nem utilizadores.",
      Math.floor(Date.now() / 1000),
    );
})();

nova.prepare("detach database actual").run();

console.log(
  `   saíram ${retirados.pedidos} pedidos, ${retirados.subscritores} subscritores ` +
    `e ${retirados.registo} linhas de registo; ficam ${contar(nova, "utilizadores")} ` +
    "utilizadores, os da staging",
);

// --------------------------------------------------------------------
// 3. Copiar as fotografias que faltam no bucket da staging
// --------------------------------------------------------------------

console.log("3. A conferir as fotografias…");

const conta = obrigatoria("R2_ACCOUNT_ID");
const endpoint = `https://${conta}.r2.cloudflarestorage.com`;
const destino = {
  bucket: obrigatoria("R2_BUCKET"),
  cliente: new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: obrigatoria("R2_ACCESS_KEY_ID"),
      secretAccessKey: obrigatoria("R2_SECRET_ACCESS_KEY"),
    },
  }),
};
// Se a chave da staging não puder ler o bucket de produção, define-se
// uma só de leitura em R2_ORIGEM_ACCESS_KEY_ID e R2_ORIGEM_SECRET_ACCESS_KEY.
const origem = {
  bucket: process.env.R2_ORIGEM_BUCKET || "contagiarte",
  cliente: new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId:
        process.env.R2_ORIGEM_ACCESS_KEY_ID || obrigatoria("R2_ACCESS_KEY_ID"),
      secretAccessKey:
        process.env.R2_ORIGEM_SECRET_ACCESS_KEY ||
        obrigatoria("R2_SECRET_ACCESS_KEY"),
    },
  }),
};

async function existe(alvo, chave) {
  try {
    await alvo.cliente.send(new HeadObjectCommand({ Bucket: alvo.bucket, Key: chave }));
    return true;
  } catch (erro) {
    if (erro?.$metadata?.httpStatusCode === 404) return false;
    throw erro;
  }
}

const ficheiros = nova.prepare("select chave, tipo_mime from media").all();
const emFalta = [];
try {
  for (const f of ficheiros) {
    if (!(await existe(destino, f.chave))) emFalta.push(f);
  }
} catch (erro) {
  parar(`Não se chegou ao bucket "${destino.bucket}": ${descrever(erro)}`);
}
console.log(`   ${ficheiros.length} ficheiros, ${emFalta.length} por copiar`);

const falhas = [];
if (ENSAIO) {
  // Prova que a chave chega ao bucket de produção, com um só pedido.
  if (emFalta.length > 0) {
    try {
      await origem.cliente.send(
        new HeadObjectCommand({ Bucket: origem.bucket, Key: emFalta[0].chave }),
      );
      console.log(`   a chave lê o bucket "${origem.bucket}"`);
    } catch (erro) {
      falhas.push(`${emFalta[0].chave}: ${descrever(erro)}`);
    }
  }
} else {
  let feitos = 0;
  for (const f of emFalta) {
    try {
      const obj = await origem.cliente.send(
        new GetObjectCommand({ Bucket: origem.bucket, Key: f.chave }),
      );
      await destino.cliente.send(
        new PutObjectCommand({
          Bucket: destino.bucket,
          Key: f.chave,
          Body: Buffer.from(await obj.Body.transformToByteArray()),
          ContentType: f.tipo_mime,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      feitos++;
      if (feitos % 20 === 0) console.log(`   ${feitos}/${emFalta.length}`);
    } catch (erro) {
      falhas.push(`${f.chave}: ${descrever(erro)}`);
    }
  }
  console.log(`   copiados ${feitos}`);
}

if (falhas.length > 0) {
  nova.close();
  console.error(falhas.slice(0, 10).map((f) => `   ${f}`).join("\n"));
  parar(
    `${falhas.length} fotografias não passaram. A staging fica como estava. ` +
      "Se for AccessDenied, a chave da staging não lê o bucket de produção: " +
      "define R2_ORIGEM_ACCESS_KEY_ID e R2_ORIGEM_SECRET_ACCESS_KEY com uma chave só de leitura.",
  );
}

// --------------------------------------------------------------------
// 4. Deixar a base nova pronta para a troca
// --------------------------------------------------------------------

nova.exec("vacuum");
nova.close();

if (ENSAIO) {
  rmSync(PASTA, { recursive: true, force: true });
  console.log("\n✓ Ensaio limpo. Sem --ensaio, a staging ficava com este conteúdo.");
  process.exit(0);
}

console.log("4. A guardar a base actual e a deixar a nova pronta…");

// `.backup()` e não copiar o ficheiro: a aplicação continua a escrever
// enquanto isto corre, e só a API do SQLite apanha o que está no WAL.
const actual = new Database(BASE, { readonly: true });
await actual.backup(path.join(DADOS, "contagiarte.db.antes"));
actual.close();
doNextjs(path.join(DADOS, "contagiarte.db.antes"));

const pronta = path.join(DADOS, "contagiarte.db.novo");
renameSync(RESTAURADA, pronta);
doNextjs(pronta);
rmSync(PASTA, { recursive: true, force: true });

console.log(
  "\n✓ Pronta. A troca faz-se no próximo arranque da máquina.\n" +
    "  A base anterior fica em contagiarte.db.antes.",
);
