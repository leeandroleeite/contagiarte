# Auditoria de estilo e jornadas, 28 de Setembro de 2026

Oito olhares em paralelo sobre o site público (fichas, tipografia,
superfícies, jornadas, palavra, movimento, bugs, direcção de arte),
com o site a correr e medições no browser. As decisões que saíram
daqui estão em `docs/DESIGN-SYSTEM.md`.

## Antes e depois, medido no site público

| O quê | Antes | Depois |
|---|---|---|
| Cores escritas à mão em classes | 176 | 0 |
| Literais de cor no código | 224 | 29 (dados físicos do simulador, fichas.ts) |
| Tamanhos de título com `clamp()` à mão | 26 | 2 (faixa e cortina) |
| `toUpperCase()` em texto visível | 24 | 0 |
| Obras cortadas nos cartões | até 36% da pintura | 0 |
| Versões do cartão de obra | 4 | 1 |
| Frames de animação por segundo com a página parada | 120 | 0 |
| Testes e2e | 184 | 185, todos a passar |

## Bugs corrigidos

1. **Fotografias invisíveis depois de navegar** (produção). O Movimento
   só via os elementos da primeira página; filtros e Voltar também.
   Corrigido com um `MutationObserver` (PR #8).
2. **Menu do telemóvel travava o site** ao sair pelo logótipo, pelo
   Voltar, ou ao rodar o tablet (PR #8).
3. O WhatsApp flutuante tapava o botão de envio dos formulários.
4. `/descarregar` vazio era um beco no menu principal.
5. "Obras disponíveis", no artista, abria o WhatsApp.
6. Abrir uma obra mostrava o rodapé a passar, pelo scroll suave.
7. O percurso da adega não tinha salas para leitores de ecrã.
8. Mensagens de WhatsApp e email, 404 e erro em português nas páginas
   EN e ES; "May 2026 a December 2026"; "Wonder Frida, de ...".
9. Erros de formulário com a cor da nota legal.
10. "emoldurada · sem moldura" na mesma linha do simulador.
11. Filtros que levavam a zero obras ou não filtravam nada.
12. Sem JavaScript, títulos e imagens ficavam invisíveis.
13. A cortina voltava a tapar a entrada em telemóveis lentos.

## O que ficou por fazer, e porquê

- **Botões e chips**: há ainda várias implementações (Botao, submits
  dos formulários, WhatsApp, chips de filtro em três sítios). Unificar
  mexe em comportamento de formulários; fica para uma passagem própria.
- **Linhas de índice** (arquivo, exposições passadas, artistas) ainda
  são cópias com medidas diferentes. Candidata à próxima primitiva.
- **Tamanhos pequenos em controlos**: os 13, 14, 15px dentro de botões
  e campos não foram tocados, para não mexer em alvos de toque sem
  os medir de novo.
- **Sinal de carregamento** ao navegar em rede lenta. Um `loading.tsx`
  estragava o voo da obra (o destino tem de chegar no mesmo commit);
  precisa de um fio de progresso com `useLinkStatus`.
- **Voltar do browser** não tem passagem animada: o React não a pede
  em navegações do histórico. O conteúdo aparece sem animação.
- **Rótulos com ternários de idioma** em algumas páginas (a obra como
  ativo, privacidade, fichas de exposição). Estão traduzidos, mas fora
  do dicionário.
- **O título da entrada** mantém o `mix-blend-mode: difference`. É uma
  decisão medida e documentada em `src/lib/veu.ts`, com controlo no
  backoffice (Definições). Não se mexeu.

## O que é conteúdo, para a galeria

Isto não se resolve no código; está no backoffice.

- Medidas em cm de 22 das 25 obras (o simulador usa-as).
- Capa de três exposições; morada de três lugares.
- Retrato de Pant. e Vanessa Teodoro; fotografia da "Sem título".
- Logótipo em vector.
- Revisão jurídica da política de privacidade, e a data de revisão.
- Os quatro textos provisórios da entrada.
- Texto em inglês da introdução de Lugares.
- Os passos da página Molduras e as fotografias de Molduras e da
  galeria (hoje marcadores).
- Tratamento: o site fala por "você"; os passos das molduras dizem
  "Diz-nos" e "Vê". Proposta: "Diga-nos as medidas, ou vamos a sua
  casa medi-la." e "Veja madeiras, alumínios e vidros."
- Ortografia: há textos antes e depois do Acordo misturados, e
  "Bordô" na lista de molduras soa a português do Brasil (proposta:
  "Bordéus").
- Frases de bastidores publicadas: "A lista cresce sozinha" (artistas)
  e "por confirmar" (arquivo).
- O título de partilha está em inglês nas três línguas.
- O 404 da base diz "Esta obra já não está aqui"; o de recurso diz
  agora "Esta parede está vazia". Vale a pena alinhar.

## Segredos

Para quem repara: um bilhete na consola do browser; o título do
separador quando se sai ("A obra fica à sua espera"); o código Konami
(↑↑↓↓←→←→BA), que entorta as obras e passa um nível a endireitá-las; e
um prego no 404 que pendura uma obra ao acaso.
