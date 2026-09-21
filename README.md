# Galeria Contagiarte

Site e backoffice da Galeria Contagiarte (Porto). Arte contemporânea,
molduras à medida com a MOLDARTPÓVOA, e exposições em lugares que rompem
com o modelo tradicional: adegas, hotéis, clubes, centros culturais.

Slogan: **For the Next Generation of Art Lovers**.

O desenho vem do handoff feito em Claude Design (`Contagiarte Homepage
v2.dc.html` e restantes ecrãs). Este repositório é a recriação desse
desenho em código de produção, com o conteúdo a vir todo da base de
dados para a galeria poder acrescentar obras sem programador.

## Stack

| Camada | Escolha | Porquê |
|---|---|---|
| Aplicação | Next.js 16 (App Router), React 19, TypeScript | SSR e ISR para SEO, server actions para formulários, uma só app para site e backoffice |
| Estilo | Tailwind 4 | Tokens da marca definidos em `@theme`, sem folha de estilo paralela |
| Base de dados | SQLite + Drizzle ORM | Migrações versionadas, tipos gerados do esquema, leituras sem rede pelo meio |
| Ficheiros | Cloudflare R2 | Sem custo de saída, CDN à frente, separado da aplicação |
| Cópias | Litestream para o R2 | Contínuo em vez de diário: o pior caso é um segundo, não um dia |
| Alojamento | Fly.io (região `cdg`) | A mais perto de Portugal, dois ambientes fáceis |
| Email | Brevo por SMTP, ou Resend | Opcional: sem ele os pedidos ficam na base de dados na mesma |

## Pôr a correr localmente

Precisa de Node 22 e mais nada: a base de dados é um ficheiro em `var/`.

```bash
npm install
cp .env.example .env.local
```

Preencha o `SESSION_SECRET` no `.env.local` com o resultado de
`openssl rand -base64 48`. As chaves do R2 e do email podem ficar vazias
para desenvolvimento: o site funciona sem elas, mostrando marcadores no
lugar das fotografias.

```bash
npm run bd:migrar
npm run semear
npm run dev
```

O `semear` cria o utilizador do backoffice e imprime a palavra-passe
gerada uma única vez. Site em <http://localhost:3000>, backoffice em
<http://localhost:3000/admin>.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Compilação de produção |
| `npm run tipos` | Verificação de tipos, sem emitir nada |
| `npm run lint` | ESLint |
| `npm run bd:gerar` | Gera uma migração a partir do esquema |
| `npm run bd:migrar` | Aplica as migrações pendentes |
| `npm run bd:estudio` | Abre o Drizzle Studio |
| `npm run semear` | Povoa a base de dados (idempotente) |
| `npm run copia` | Exporta o conteúdo todo para o R2 |
| `npm run admin:criar -- email@dominio.pt "Nome" administrador` | Cria ou repõe um acesso ao backoffice |

## Testes

```bash
npm run e2e          # tudo, em Chrome de secretária e iPhone
npm run e2e:ver      # com o inspector do Playwright
npm run e2e:relatorio
```

Correm contra uma compilação de produção, não contra o servidor de
desenvolvimento: é a versão que vai para o ar. São 63 testes em dois
aparelhos, e cobrem:

- **rastreio recursivo**: parte da homepage, segue todos os links
  internos até não haver endereços novos, e falha se algum responder
  com erro, ficar sem `h1`, ou ganhar scroll lateral. É o que apanha um
  link esquecido para uma rota que já não existe;
- **navegação**: barra de topo, menu compacto, rodapé, avançar e
  recuar no browser;
- **idiomas**: `/pt` redirecciona para a raiz, EN e ES mantêm o
  prefixo ao navegar, e cada página declara os três alternativos;
- **conteúdo**: ficha técnica da obra, biografia e citação do artista,
  texto curatorial e ficha de visita da exposição, salas do percurso;
- **contactos**: o número de WhatsApp e a mensagem de cada contexto,
  incluindo a combinação escolhida no simulador;
- **formulários**: newsletter, orçamento de moldura e interesse numa
  obra, com validação, armadilha para robôs, e a garantia de que a
  fotografia da parede nunca sai do navegador;
- **backoffice**: entrar, recusar credenciais erradas, criar uma obra e
  vê-la publicada no site, alterá-la, apagá-la, confirmar que um
  rascunho não aparece, mudar o número de WhatsApp e ver os links do
  site mudarem, e encontrar no painel o pedido enviado pelo site.

O CI corre-os em cada pull request, depois dos tipos, do lint e da
compilação.

## Estrutura

```
src/
  app/
    [lang]/          páginas públicas (pt na raiz, /en e /es com prefixo)
    admin/           backoffice (entrar + grupo (painel))
    api/             media, descargas, newsletter, verificação de saúde
    accoes.ts        server actions dos formulários públicos
  components/        componentes do site e do backoffice
  lib/
    db/              esquema, relações e ligação
    i18n/            dicionário de interface e resolução de traduções
    admin/           acções de escrita do backoffice
    dados.ts         todas as leituras do site público
    media/           R2 e construção de endereços
  proxy.ts           idioma, muro do staging e guarda do /admin
drizzle/             migrações SQL versionadas
scripts/             semear, migrar, cópias, criar utilizador
```

### Idiomas

O português vive na raiz (`/obras`), o inglês e o espanhol com prefixo
(`/en/obras`, `/es/obras`). O `proxy.ts` reescreve os caminhos sem
prefixo para `/pt/...` internamente e redirecciona `/pt/...` para a raiz,
para não haver dois endereços com o mesmo conteúdo.

Os textos de interface estão em `src/lib/i18n/dicionario.ts`. O conteúdo
editorial é traduzido campo a campo no backoffice: cada campo tem
separadores PT, EN e ES, e o que ficar vazio mostra o português.

### Entrar no backoffice

O backoffice vive em `/admin`. **Não há botão de login no site**, e é
de propósito: quem visita a galeria não tem nada a fazer lá, e um link
visível só serve para convidar tentativas de entrada. Escreve-se o
endereço à mão:

- local: <http://localhost:3000/admin>
- staging: `https://staging.contagiarte.pt/admin`
- produção: `https://www.contagiarte.pt/admin`

O utilizador inicial é criado pelo `npm run semear`, que imprime a
palavra-passe uma única vez. Para criar mais acessos ou repor uma
palavra-passe:

```bash
npm run admin:criar -- pessoa@contagiarte.pt "Nome" editor
```

Dentro do painel, Utilizadores faz o mesmo pela interface. Há dois
papéis: **editor** mexe em conteúdo, **administrador** mexe também em
utilizadores.

### Estados do conteúdo

Tudo o que é conteúdo tem `estado`: `rascunho`, `publicado` ou
`arquivado`. O site público só lê `publicado`. As obras têm além disso
`disponibilidade`: disponível, reservada, vendida ou não venal.

## Publicar

### Primeira vez

```bash
fly auth login

# Produção
fly apps create contagiarte
fly volumes create contagiarte_dados -a contagiarte -r cdg -n 1 -s 3

# Staging
fly apps create contagiarte-staging
fly volumes create contagiarte_dados_staging -a contagiarte-staging -r cdg -n 1 -s 1
```

Um volume por app, e um só. A base de dados é um ficheiro lá dentro, o
que prende cada app a uma máquina: em troca, as leituras não atravessam
a rede e a cópia é contínua.

Segredos de produção:

```bash
fly secrets set --app contagiarte \
  SESSION_SECRET="$(openssl rand -base64 48)" \
  R2_ACCOUNT_ID=... \
  R2_ACCESS_KEY_ID=... \
  R2_SECRET_ACCESS_KEY=... \
  R2_BUCKET=contagiarte \
  SMTP_URL="smtp://<login>:<chave-smtp>@smtp-relay.brevo.com:587" \
  EMAIL_PARA=galeria@contagiarte.pt \
  EMAIL_DE="Galeria Contagiarte <site@contagiarte.pt>"
```

O muro de password não é uma coisa de staging: havendo
`PALAVRA_PASSE_ENTRADA` definida, o ambiente pede-a antes de qualquer
página, e o `robots.txt` passa a proibir tudo. Serve a staging, que tem
uma cópia do conteúdo real, e serve a uma produção que já está de pé mas
ainda não abriu portas. Abrir é tirar o segredo e apontar o DNS.

Segredos de staging:

```bash
fly secrets set --app contagiarte-staging \
  SESSION_SECRET="$(openssl rand -base64 48)" \
  STAGING_PASSWORD="uma-password-combinada" \
  R2_BUCKET=contagiarte-staging \
  R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=...
```

Domínios:

```bash
fly certs add www.contagiarte.pt --app contagiarte
fly certs add contagiarte.pt --app contagiarte
fly certs add staging.contagiarte.pt --app contagiarte-staging
```

No registar do domínio, aponte os registos que a Fly indicar em
`fly certs show`. Em produção, o apex deve redireccionar para o `www`
(ou o contrário, desde que `PUBLIC_URL` no `fly.toml` diga o mesmo).

### Deploys seguintes

Cada merge em `main` publica em staging automaticamente. Produção só sai
de um `workflow_dispatch` deliberado, no separador Actions do GitHub,
escolhendo `producao`. Localmente:

```bash
fly deploy --config fly.staging.toml
fly deploy --config fly.toml
```

O `release_command` corre as migrações antes de a versão nova receber
tráfego. Se a migração falhar, o deploy pára e a versão anterior fica
no ar.

### Segredos que o GitHub precisa

Só `FLY_API_TOKEN`, para publicar. A cópia de segurança deixou de correr
no GitHub: a base vive num volume a que o runner não chega.

## Trazer fotografias de fora

Material que chega por fora, a entrega de um fotógrafo ou uma pasta do
Drive, entra por aqui:

```bash
npm run pasta -- ~/Downloads/contagiarte-quantaterra quanta-terra \
  --alt "Exposição A Pele da Terra, na adega da Quanta Terra"
```

Reduz para 2000px de lado maior, converte para JPEG e é idempotente:
correr duas vezes não duplica nada. Não atribui nada a obras nem a
exposições, porque isso é escolha de quem conhece o espólio e faz-se no
backoffice.

Para carregar no bucket de produção em vez do disco local, corre com as
chaves de produção no ambiente:

```bash
APP_ENV=producao R2_BUCKET=contagiarte \
  R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
  npx tsx scripts/importar-pasta.ts <pasta> <prefixo> --alt "..."
```

## Ficheiros e R2

Sem R2 configurado, os ficheiros ficam em `public/media` e são servidos
por `/api/media/...`. É o que permite ver e editar o site localmente
sem abrir conta na Cloudflare. Em staging e em produção, o R2 toma
conta: os endereços não mudam, e passam pela CDN assim que
`NEXT_PUBLIC_R2_PUBLIC_URL` estiver definido.


Crie três buckets: `contagiarte`, `contagiarte-staging` e
`contagiarte-backups`. O terceiro está à parte de propósito, porque o de
produção há-de ficar público por trás de `media.contagiarte.pt`, e a
base de dados tem hashes de palavras-passe, telefones e endereços de
quem fez pedidos. Nos dois primeiros, dentro de cada
um, os objectos ficam com prefixo do ambiente (`producao/`, `staging/`,
`local/`), por isso um ambiente nunca escreve por cima do outro mesmo que
partilhem bucket.

Ligue um domínio próprio ao bucket de produção (por exemplo
`media.contagiarte.pt`) e coloque-o em `NEXT_PUBLIC_R2_PUBLIC_URL`, no
`fly.toml`. Sem isso, os ficheiros são servidos por `/api/media/...`,
que funciona mas gasta CPU e largura de banda da aplicação.

## Cópias de segurança

Duas linhas, e fazem coisas diferentes.

1. **Litestream**, contínuo. Vai atrás do WAL do SQLite e envia cada
   alteração para `contagiarte-backups`, na pasta do ambiente. O pior
   caso é perder cerca de um segundo de escritas. O `entrypoint.sh`
   restaura antes de a aplicação abrir a base: numa máquina nova, com o
   volume perdido, os dados voltam sozinhos.

   ```bash
   # ver o que lá está
   fly ssh console -a contagiarte -C "litestream snapshots /dados/contagiarte.db"
   # restaurar para um ficheiro à parte, sem tocar no que está a correr
   fly ssh console -a contagiarte -C "litestream restore -o /dados/prova.db /dados/contagiarte.db"
   # e conferir o que lá está dentro, que é a parte que interessa
   fly ssh console -a contagiarte -C "node -e \"const D=require('/app/node_modules/better-sqlite3');const d=new D('/dados/prova.db',{readonly:true});for(const t of ['obras','artistas','media','textos'])console.log(t,d.prepare('select count(*) as n from '+t).get().n)\""
   ```

   Um backup que nunca foi restaurado ainda não é um backup. Ensaiado em
   staging a 20 de agosto de 2026: a base voltou do bucket com as 13
   obras, os 4 artistas, os 95 ficheiros de media e as 388 linhas de
   registo todas lá.

2. **Exportação para JSON**, à mão. O Litestream copia a base tal e
   qual, e por isso copia um engano com a mesma fidelidade. O export é a
   rede por baixo dessa: um retrato legível que se abre sem SQLite.

   ```bash
   fly ssh console -a contagiarte -C "npx tsx scripts/copia-seguranca.ts"
   ```

Os ficheiros em si (fotografias, PDFs) vivem no R2, que tem a sua
própria durabilidade. Active versionamento no bucket se quiser
protecção contra apagar por engano.

## Formulários

Newsletter, orçamento de moldura, interesse numa obra e contacto geral
passam todos por server actions em `src/app/accoes.ts`. Cada pedido:

- é guardado na tabela `pedidos` (ou `subscritores`), sempre;
- desencadeia um aviso por email, se houver serviço configurado;
- tem travão de cinco pedidos por minuto e por IP, e um campo escondido
  que apanha robôs.

### Email

Chega definir uma das duas coisas: `SMTP_URL` ou `RESEND_API_KEY`. Com a
Brevo é o SMTP, e a chave não é a password da conta: gera-se no painel,
em SMTP & API.

```
SMTP_URL=smtp://<login>:<chave-smtp>@smtp-relay.brevo.com:587
```

O aviso sai com o endereço da galeria no `From`, o destinatário em
`EMAIL_PARA`, e o `Reply-To` de quem escreveu, o que deixa responder
carregando em responder.

Para provar o caminho sem mandar nada a ninguém, há um servidor SMTP de
mentira em `scripts/smtp-falso.mjs`; as instruções estão no cabeçalho do
ficheiro. Verificado a 21 de agosto de 2026.

Se o email falhar, o pedido não se perde: fica no backoffice, em
Pedidos.

## Acessibilidade e movimento

O handoff pedia uma camada de movimento forte (cortina de abertura,
cursor personalizado, paralaxe, entradas em scroll). Está toda em
`src/components/Movimento.tsx`, num único `requestAnimationFrame`, e:

- desliga-se por completo com `prefers-reduced-motion: reduce`;
- o cursor personalizado só existe em ponteiros finos com hover;
- há uma rede de segurança de cinco segundos que revela tudo, para o
  conteúdo nunca ficar invisível se um observador falhar;
- o percurso da adega tem uma versão em lista, que é o que fica sem
  JavaScript e com movimento reduzido.

## O que falta (conteúdo, não código)

Herdado da secção "Por implementar" do handoff, e ainda por resolver:

1. **Textos definitivos.** Os textos de "Porque se compra arte", as
   descrições de artistas e as fichas de obra são provisórios, escritos
   durante o design. Estão todos editáveis em Backoffice → Textos do
   site.
2. **Confirmar o inventário.** As treze obras, os quatro artistas, a
   exposição e as salas do percurso vieram todos do design, com os
   textos reais. As dimensões e anos só existem onde o design os
   nomeava (Wonder Frida, 100 × 100 cm, 2024); o resto está por
   preencher, e o handoff avisava que alguns valores do protótipo eram
   fictícios. Vale a pena a galeria confirmar peça a peça.
3. **Logótipo em vetor.** O ícone actual é provisório
   (`public/icone.svg`).
4. **Fotografia em alta resolução** das obras, dos espaços e dos
   galeristas. As imagens que estão no site vieram do catálogo da
   galeria, extraídas de um PDF: têm 440px de largura no máximo, e por
   isso ficam suaves quando ocupam meio ecrã. Servem para ver o site
   como ficará; substituem-se uma a uma em Backoffice → Media, e o
   endereço de cada obra não muda.

   Faltam fotografias de: as quatro salas do percurso da adega, o
   retrato dos galeristas, a moldura da MOLDARTPÓVOA em contexto, e a
   obra de Pant. (a que veio no design chegou danificada e foi
   retirada, porque mostrar um terço de um quadro como sendo a obra
   engana quem compra). Cada sítio sem fotografia mostra um marcador
   com o título, em vez de um buraco no layout.
5. **Datas e títulos das exposições anteriores** (edições 2021 a 2023 da
   Quanta Terra, Off Padel, Café da Praça).
6. **Traduções EN e ES.** A estrutura está pronta e o dicionário de
   interface já está traduzido; falta traduzir o conteúdo editorial,
   campo a campo, no backoffice.
7. **PDFs para descarga.** Catálogo, dossier e flyer estão criados em
   rascunho, à espera dos ficheiros.
8. **Revisão jurídica da política de privacidade.** O texto actual é um
   rascunho sério mas não revisto por advogado. Está em Backoffice →
   Textos do site, chave `privacidade.conteudo`.

## Decisões que se afastam do protótipo

- **O gráfico de "A obra como ativo" ficou como está no design**, com o
  selo "exemplo ilustrativo" e o parágrafo que diz, por extenso, que os
  valores são ilustrativos e vão ser substituídos por dados reais. Não
  tem eixo de valores nem moeda: mostra a forma de uma carreira, não a
  cotação de ninguém, e a secção seguinte enumera o que a galeria não
  promete. Se um dia entrarem números reais, o selo e o aviso têm de ser
  revistos ao mesmo tempo.
- **O menu colapsa por media query**, não por medição de largura em
  JavaScript. O protótipo media a janela por limitação do ambiente de
  prototipagem; em produção não faz falta.
- **A tradução não é feita sobre o DOM já pintado.** O `traducoes.js` do
  protótipo substituía texto depois de renderizar. Aqui o idioma faz
  parte do endereço, o conteúdo vem já traduzido do servidor, e há
  `hreflang` e canónicos por página.
- **Não há cookies de terceiros nem banner de consentimento**, porque
  não há nada que os justifique. Se um dia entrar analítica, o banner
  passa a ser preciso e a política tem de ser actualizada.
