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
#
# A espera cobre a versão, e não só a ligação.
#
# A primeira escrita disto esperava enquanto o /api/saude não
# respondesse, e perguntava a versão uma vez só. Durante uma troca de
# máquinas a antiga continua a atender: no primeiro deploy de produção
# pela esteira, oito segundos depois de publicar, a saúde respondeu bem
# e sem versão nenhuma, porque quem atendeu foi o servidor velho. O
# deploy estava certo e o fumo deu vermelho. Um deploy bom reportado a
# vermelho ensina as pessoas a ignorar o sinal, que é pior do que não
# ter sinal nenhum.
set -euo pipefail

BASE="${1:?falta o endereço, ex. https://contagiarte-staging.fly.dev}"
ESPERADO="${2:-}"

# Quanto tempo se dá à troca de máquinas antes de desistir.
TENTATIVAS="${FUMO_TENTATIVAS:-20}"
INTERVALO="${FUMO_INTERVALO:-6}"

leitura() {
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).$1??'')}catch{console.log('')}})"
}

saude=""
versao=""
pronto=""

for i in $(seq 1 "$TENTATIVAS"); do
  if ! saude=$(curl -fsS --max-time 10 "$BASE/api/saude" 2>/dev/null); then
    echo "ainda não responde ($i/$TENTATIVAS)"
    sleep "$INTERVALO"
    continue
  fi

  if [ "$(printf '%s' "$saude" | leitura ok)" != "true" ]; then
    echo "responde mas diz que não está bem ($i/$TENTATIVAS): $saude"
    sleep "$INTERVALO"
    continue
  fi

  # Sem commit à espera, basta estar viva.
  if [ -z "$ESPERADO" ]; then
    pronto="sim"
    break
  fi

  versao=$(printf '%s' "$saude" | leitura versao)
  if [ "$versao" = "$ESPERADO" ]; then
    pronto="sim"
    break
  fi

  # Aqui é que estava o defeito: isto não é uma falha, é a máquina
  # antiga ainda a atender. Espera-se que a nova tome conta.
  echo "ainda atende a versão antiga '${versao:-nenhuma}' ($i/$TENTATIVAS)"
  sleep "$INTERVALO"
done

if [ -z "$pronto" ]; then
  echo "saúde: ${saude:-sem resposta}"
  if [ -n "$ESPERADO" ]; then
    echo "lá está:   ${versao:-nenhuma}"
    echo "devia ser: $ESPERADO"
    echo "FALHOU: passaram $((TENTATIVAS * INTERVALO))s e continua noutra versão"
  else
    echo "FALHOU: $BASE/api/saude não ficou bom em $((TENTATIVAS * INTERVALO))s"
  fi
  exit 1
fi

echo "saúde: $saude"
[ -n "$ESPERADO" ] && echo "versão: $versao, como esperado"

codigo=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$BASE/") || codigo="000"
echo "entrada: $codigo"
case "$codigo" in
  200) echo "a entrada responde" ;;
  401) echo "a entrada responde, atrás do muro" ;;
  *) echo "FALHOU: a entrada devolveu $codigo"; exit 1 ;;
esac

echo "está de pé."
