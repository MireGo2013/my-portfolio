# Один Dockerfile на монорепозиторий: нужный образ выбирается через target.

FROM node:24-slim AS base
ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
# openssl нужен движку миграций Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@12.16.1
WORKDIR /repo

# Зависимости: pnpm fetch читает только lockfile, поэтому слой пересобирается
# лишь при изменении зависимостей, а не при каждой правке кода
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --frozen-lockfile
RUN pnpm --filter @portfolio/shared build

FROM deps AS api-build
RUN pnpm --filter @portfolio/api build
RUN pnpm --filter @portfolio/api --prod deploy /prod/api

# Сайт. Сборке Next.js нужен работающий API, а при docker build его нет,
# поэтому сборка идёт при старте контейнера. Кэш данных прошлого запуска
# очищаем, иначе после перезапуска сайт показал бы старый контент. Образ только для локального запуска:
# в проде сайт собирает Vercel.
FROM deps AS web
RUN chown -R node:node apps/web
WORKDIR /repo/apps/web
ENV PATH=/repo/apps/web/node_modules/.bin:$PATH
USER node
EXPOSE 3000
CMD ["sh", "-c", "node scripts/clear-content-cache.mjs && next build && next start"]

# API в проде: только собранный код и production-зависимости.
# Этап последний: без явного target (так собирает Railway) получится именно он.
# Этот же образ применяет миграции и seed: node --run db:release
FROM node:24-slim AS api
ENV NODE_ENV=production
# openssl нужен движку миграций Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=api-build /prod/api .
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
