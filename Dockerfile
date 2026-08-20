# syntax=docker/dockerfile:1

# ---------------------------------------------------------------
# Imagem de produção do site da Galeria Contagiarte.
# Multi-etapa: só o necessário para correr chega à imagem final.
# ---------------------------------------------------------------

FROM node:22-alpine AS base
# O sharp precisa destas bibliotecas para ler e redimensionar imagens.
RUN apk add --no-cache libc6-compat

# --- Dependências ------------------------------------------------
FROM base AS deps
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

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migrações e o script que as aplica, para o release_command da Fly.
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=nextjs:nodejs /app/scripts/migrar.mjs ./scripts/migrar.mjs

# O migrador corre fora do bundle do Next, por isso precisa dos módulos
# a sério. São dois, e nenhum deles tem dependências próprias.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
