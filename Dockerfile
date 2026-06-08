FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# 1. Instalar dependências apenas quando necessário
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Reconstruir o código-fonte
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
# Used only during image build; runtime uses docker-compose.yml.
ENV DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
RUN npx prisma generate
RUN npm run build

# 3. Imagem de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Define as permissões para o cache do Next.js e uploads.
RUN mkdir -p .next/cache public/uploads
RUN chown -R nextjs:nodejs .next/cache public/uploads

# Copia o build standalone (exige output: 'standalone' no next.config.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3007
ENV PORT 3007
CMD ["node", "server.js"]
