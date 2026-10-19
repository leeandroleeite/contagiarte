#!/bin/sh
# Arranca com cópia contínua se houver bucket, e sem ela se não houver.
#
# A ordem importa: restaurar ANTES de a aplicação abrir o ficheiro. Numa
# máquina nova (volume perdido, mudança de região, recuo de versão) é
# isto que traz os dados de volta; quando o ficheiro já lá está, o
# restauro não faz nada e passa-se a replicar.
set -e

export DADOS_DIR="${DADOS_DIR:-/dados}"
export LITESTREAM_REGION="${LITESTREAM_REGION:-auto}"
# Cada ambiente escreve na sua pasta dentro do bucket, para um restauro
# de staging nunca poder ir buscar a base de produção.
export LITESTREAM_CAMINHO="${LITESTREAM_CAMINHO:-${APP_ENV:-local}}"

mkdir -p "$DADOS_DIR"

# A cache das imagens sobrevive aos deploys.
#
# O Next guarda as versões redimensionadas em .next/cache, que vive no
# disco do contentor e desaparece a cada versão nova. Redimensionar uma
# fotografia custa entre 400 e 600ms de CPU, e a máquina é um vCPU
# partilhado: com nove imagens numa página, o primeiro visitante depois
# de cada deploy esperava segundos por todas. No volume, paga-se uma vez
# só na vida.
CACHE="$DADOS_DIR/cache-next"
mkdir -p "$CACHE"
rm -rf /app/.next/cache
ln -sfn "$CACHE" /app/.next/cache

# Um refresco da staging (scripts/refrescar-staging.mjs) deixa a base
# nova ao lado da actual, e a troca faz-se aqui, antes de a aplicação e
# o Litestream abrirem o ficheiro. Sai também a memória local do
# Litestream: com ela, ele tentava continuar a geração da base antiga;
# sem ela, começa uma geração nova a partir desta. As antigas ficam no
# bucket, e a base anterior em contagiarte.db.antes.
NOVA="$DADOS_DIR/contagiarte.db.novo"
if [ -f "$NOVA" ]; then
  if [ "$APP_ENV" = "staging" ]; then
    echo "staging: a trocar a base pela cópia de produção"
    rm -f "$DADOS_DIR/contagiarte.db" "$DADOS_DIR/contagiarte.db-wal" "$DADOS_DIR/contagiarte.db-shm"
    rm -rf "$DADOS_DIR/.contagiarte.db-litestream"
    mv "$NOVA" "$DADOS_DIR/contagiarte.db"
    # O que o Next guardou em cache foi lido da base antiga.
    rm -rf "$CACHE/fetch-cache"
  else
    echo "há uma $NOVA fora da staging: fica onde está, não se troca nada"
  fi
fi

if [ -n "$LITESTREAM_BUCKET" ]; then
  if [ ! -f "$DADOS_DIR/contagiarte.db" ]; then
    echo "sem base local: a tentar restaurar de $LITESTREAM_BUCKET/$LITESTREAM_CAMINHO"
    litestream restore -if-replica-exists "$DADOS_DIR/contagiarte.db" \
      || echo "não havia cópia para restaurar: começa vazia"
  fi
fi

# As migrações correm sempre, com a base já restaurada. Se falharem, o
# contentor não abre e a versão anterior continua no ar.
node scripts/migrar.mjs

if [ -n "$LITESTREAM_BUCKET" ]; then
  echo "litestream: a replicar $DADOS_DIR/contagiarte.db para $LITESTREAM_BUCKET/$LITESTREAM_CAMINHO"
  exec litestream replicate -exec "node server.js"
fi

echo "sem LITESTREAM_BUCKET: a correr sem cópia contínua"
exec node server.js
