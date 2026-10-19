#!/usr/bin/env bash
#
# Refresca a staging com o conteúdo de produção, a partir de fora.
#
#   npm run staging:refrescar             # faz e reinicia
#   npm run staging:refrescar -- --ensaio # só confere, não muda nada
#
# O trabalho é do scripts/refrescar-staging.mjs, que corre dentro da
# máquina. Isto só o chama, reinicia a máquina para a troca se fazer no
# arranque, e confirma que a staging voltou de pé.
set -euo pipefail

APP="contagiarte-staging"
URL="https://contagiarte-staging.fly.dev"

fly ssh console -a "$APP" -C "node /app/scripts/refrescar-staging.mjs $*"

if [[ " $* " == *" --ensaio "* ]]; then
  exit 0
fi

fly apps restart "$APP"
"$(dirname "$0")/fumo.sh" "$URL"
