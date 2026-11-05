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

# Миграции и seed: нужны CLI Prisma и tsx из devDependencies
FROM api-build AS migrate
WORKDIR /repo/apps/api
# Запускаем бинарники напрямую: pnpm перед запуском сверяет node_modules с
# lockfile и пытается доустановить зависимости, а в контейнере это не нужно
ENV PATH=/repo/apps/api/node_modules/.bin:$PATH
CMD ["sh", "-c", "prisma migrate deploy && prisma db seed"]

# API в проде: только собранный код и production-зависимости
FROM node:24-slim AS api
ENV NODE_ENV=production
WORKDIR /app
COPY --from=api-build /prod/api .
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]

# Сайт. Сборке Next.js нужен работающий API, а при docker build его нет,
# поэтому сборка идёт при старте контейнера. Образ только для локального запуска:
# в проде сайт собирает Vercel.
FROM deps AS web
RUN chown -R node:node apps/web
WORKDIR /repo/apps/web
ENV PATH=/repo/apps/web/node_modules/.bin:$PATH
USER node
EXPOSE 3000
CMD ["sh", "-c", "next build && next start"]
