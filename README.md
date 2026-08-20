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
| Base de dados | PostgreSQL + Drizzle ORM | Migrações versionadas, tipos gerados do esquema |
| Ficheiros | Cloudflare R2 | Sem custo de saída, CDN à frente, separado da aplicação |
| Alojamento | Fly.io (região `mad`) | Perto de Portugal, Postgres gerido, dois ambientes fáceis |
| Email | Resend ou SMTP | Opcional: sem ele os pedidos ficam na base de dados na mesma |

## Pôr a correr localmente

Precisa de Node 22 e Docker.

```bash
npm install
docker compose up -d
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
fly postgres create --name contagiarte-db --region mad
fly postgres attach contagiarte-db --app contagiarte

# Staging
fly apps create contagiarte-staging
fly postgres create --name contagiarte-db-staging --region mad
fly postgres attach contagiarte-db-staging --app contagiarte-staging
```

Segredos de produção:

```bash
fly secrets set --app contagiarte \
  SESSION_SECRET="$(openssl rand -base64 48)" \
  R2_ACCOUNT_ID=... \
  R2_ACCESS_KEY_ID=... \
  R2_SECRET_ACCESS_KEY=... \
  R2_BUCKET=contagiarte \
  RESEND_API_KEY=... \
  EMAIL_PARA=galeria@contagiarte.pt
```

Segredos de staging, com o muro de password por cima de tudo:

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

`FLY_API_TOKEN` para publicar, e para a cópia de segurança diária
`DATABASE_URL_PRODUCAO`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY` e `R2_BUCKET`.

## Ficheiros e R2

Crie dois buckets, `contagiarte` e `contagiarte-staging`. Dentro de cada
um, os objectos ficam com prefixo do ambiente (`producao/`, `staging/`,
`local/`), por isso um ambiente nunca escreve por cima do outro mesmo que
partilhem bucket.

Ligue um domínio próprio ao bucket de produção (por exemplo
`media.contagiarte.pt`) e coloque-o em `NEXT_PUBLIC_R2_PUBLIC_URL`, no
`fly.toml`. Sem isso, os ficheiros são servidos por `/api/media/...`,
que funciona mas gasta CPU e largura de banda da aplicação.

## Cópias de segurança

Duas linhas:

1. **Snapshots da Fly**, diárias e automáticas no volume do Postgres.
   Restauro com `fly postgres` a partir de uma snapshot. É a rede
   principal.
2. **Exportação para o R2**, todos os dias às 04:15 UTC pelo GitHub
   Actions, para `copias/producao/<data>.json`. Um único JSON com todas
   as tabelas, legível e restaurável sem depender da Fly. É também o
   caminho para levar conteúdo de produção para staging.

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
   galeristas. As imagens do protótipo eram extraídas de um PDF de
   catálogo e não servem para produção, por isso não foram importadas.
   Cada lugar sem fotografia mostra um marcador com o título, em vez de
   um buraco no layout. É a única coisa que falta para o site parecer
   acabado: o texto está todo lá.
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
