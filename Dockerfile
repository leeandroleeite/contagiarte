# syntax=docker/dockerfile:1

# ---------------------------------------------------------------
# Imagem de produção do site da Galeria Contagiarte.
# Multi-etapa: só o necessário para correr chega à imagem final.
# ---------------------------------------------------------------

# Debian e não Alpine: o better-sqlite3 e o sharp trazem binários já
# compilados para glibc, e em Alpine teriam de ser construídos à mão.
# É também o que o INNA usa, e não há razão para divergir.
FROM node:22-slim AS base

# --- Dependências ------------------------------------------------
FROM base AS deps
# O better-sqlite3 é código nativo. Quando o binário pronto não vem, é
# compilado aqui, e sem estes três não compila. É o mesmo que o INNA faz.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Compilação --------------------------------------------------
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# O Next lê variáveis NEXT_PUBLIC_* na compilação, por isso o domínio
# de media tem de entrar aqui e não só no arranque.
ARG NEXT_PUBLIC_R2_PUBLIC_URL=""
ENV NEXT_PUBLIC_R2_PUBLIC_URL=$NEXT_PUBLIC_R2_PUBLIC_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Sem base de dados: as páginas do site são todas geradas a pedido, e
# a compilação corre em qualquer sítio — no construtor do Fly, no
# runner do GitHub, numa máquina qualquer.
RUN npm run build

# --- Execução ----------------------------------------------------
FROM base AS runner
WORKDIR /app

# O Litestream segue o WAL do SQLite e replica para o R2.
ARG LITESTREAM_VERSION=0.3.13
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates wget \
  && wget -qO /tmp/ls.tar.gz "https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-linux-amd64.tar.gz" \
  && tar -xzf /tmp/ls.tar.gz -C /usr/local/bin litestream \
  && rm /tmp/ls.tar.gz \
  && apt-get purge -y wget && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# `::` e não `0.0.0.0`: o proxy da Fly chega às máquinas pela rede
# privada, que é IPv6. Com 0.0.0.0 o servidor só escutava em IPv4, e o
# resultado era o pior dos mundos: a verificação de saúde passava,
# porque corre dentro da máquina, e o mundo lá fora via 502 com
# "could not find a good candidate". O `::` do Node aceita as duas.
ENV HOSTNAME=::

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migrações e o script que as aplica, para o release_command da Fly.
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=nextjs:nodejs /app/scripts/migrar.mjs ./scripts/migrar.mjs

# O migrador corre fora do bundle do Next, por isso precisa dos módulos
# a sério. São dois, e nenhum deles tem dependências próprias.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

COPY --chown=nextjs:nodejs litestream.yml /etc/litestream.yml
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# A base vive num volume, não na imagem.
ENV DADOS_DIR=/dados
RUN mkdir -p /dados && chown nextjs:nodejs /dados

USER nextjs
EXPOSE 3000

CMD ["./entrypoint.sh"]
