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
