#!/usr/bin/env bash
#
# Teste de fumo de um ambiente já publicado.
#
#   ./scripts/fumo.sh https://contagiarte-staging.fly.dev <commit>
#
# Responde a três perguntas, por esta ordem, porque é a ordem em que as
# coisas costumam partir:
#
#   1. A app está viva e chega à base de dados?  (/api/saude)
#   2. É mesmo esta versão que lá está?          (o commit que ela diz)
#   3. O site responde sem rebentar?             (a entrada)
#
# A terceira aceita 200 e aceita 401. O 401 é o muro de entrada, e um
# muro a responder é um site de pé. O que não se aceita é um 5xx nem
# uma ligação que morre, que é o que acontece quando a imagem nova não
# arranca. Enquanto houver muro, isto não prova que uma página se
# desenha: prova que o servidor está lá. Essa distinção é real e não se
# tapa com um teste que diga que sim a tudo.
set -euo pipefail

BASE="${1:?falta o endereço, ex. https://contagiarte-staging.fly.dev}"
ESPERADO="${2:-}"

# A máquina pode ainda estar a arrancar quando isto corre: o Litestream
# restaura a base antes de o Next abrir a porta.
TENTATIVAS=20
saude=""
for i in $(seq 1 "$TENTATIVAS"); do
  if saude=$(curl -fsS --max-time 10 "$BASE/api/saude" 2>/dev/null); then
    break
  fi
  echo "ainda não responde ($i/$TENTATIVAS)"
  sleep 6
  saude=""
done

if [ -z "$saude" ]; then
  echo "FALHOU: $BASE/api/saude não respondeu em $((TENTATIVAS * 6))s"
  exit 1
fi

echo "saúde: $saude"

leitura() {
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).$1??'')}catch{console.log('')}})"
}

ok=$(printf '%s' "$saude" | leitura ok)
if [ "$ok" != "true" ]; then
  echo "FALHOU: a app responde mas diz que não está bem"
  exit 1
fi

if [ -n "$ESPERADO" ]; then
  versao=$(printf '%s' "$saude" | leitura versao)
  echo "lá está:  $versao"
  echo "devia ser: $ESPERADO"
  if [ "$versao" != "$ESPERADO" ]; then
    echo "FALHOU: está a correr outra versão"
    exit 1
  fi
fi

codigo=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$BASE/") || codigo="000"
echo "entrada: $codigo"
case "$codigo" in
  200) echo "a entrada responde" ;;
  401) echo "a entrada responde, atrás do muro" ;;
  *) echo "FALHOU: a entrada devolveu $codigo"; exit 1 ;;
esac

echo "está de pé."
