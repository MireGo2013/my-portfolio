# 08. Docker: весь проект одной командой

## Что сделали

Упаковали API и сайт в образы и описали в Compose запуск всего проекта одной командой: база, миграции, API и сайт стартуют в правильном порядке.

## Что и зачем

| Файл | Зачем нужен |
| --- | --- |
| `Dockerfile` | Один файл на монорепозиторий, нужный образ выбирается через `target` |
| `compose.yaml` | Сервисы `db`, `migrate`, `api`, `web` и порядок их запуска |
| `.dockerignore` | Что не должно попасть в образ: личные данные, секреты, `node_modules` |

Команды:

```bash
docker compose up --build   # весь проект (то же самое: pnpm dev:all)
pnpm db:up                  # только база, для обычной разработки
docker compose down         # остановить. Данные в томе сохранятся
```

После запуска сайт доступен на `http://localhost:3000`, а Swagger на `http://localhost:3001/api/docs`.

Почему именно так, и какие были альтернативы:

- **Один Dockerfile со стадиями против файла на приложение.** Общая установка зависимостей переиспользуется всеми образами. Цена: файл нужно читать целиком.
- **`node:24-slim` против Alpine.** Alpine меньше, но там musl вместо glibc, и нативные зависимости иногда ведут себя иначе. Slim надёжнее.
- **Сайт собирается при старте контейнера**, а не при `docker build`. Причина разобрана ниже.
- **`migrate` отдельным сервисом** против миграций при старте API. Если экземпляров API станет несколько, они не будут применять миграции наперегонки, а образ API не тянет CLI Prisma.

## Как это работает

### Зачем стадии

```dockerfile
# ❌ в образ едут компилятор, тесты и все devDependencies
FROM node:24-slim
COPY . .
RUN pnpm install
RUN pnpm build
CMD ["node", "dist/main.js"]
```

**Многоэтапная сборка** (multi-stage build) это несколько `FROM` в одном файле, где итоговый образ берёт из предыдущих только нужное. Простыми словами: промежуточные стадии живут на этапе сборки, а в финальный образ попадают лишь те файлы, что указаны в `COPY --from`.

```dockerfile
# ✅
FROM deps AS api-build
RUN pnpm --filter @portfolio/api build
RUN pnpm --filter @portfolio/api --prod deploy /prod/api

FROM node:24-slim AS api
COPY --from=api-build /prod/api .
USER node
```

В цифрах: образ API занимает 511 МБ, а `migrate`, где лежит весь инструментарий, 2,5 ГБ. Внутри API только `dist` и production-зависимости, причём запускается он не от root.

### Что делает pnpm deploy

В монорепозитории зависимости разложены симлинками по всему дереву, просто скопировать `apps/api` нельзя.

```ts
// Упрощённая модель - не исходный код pnpm
function deploy(project, target, { prod }) {
  copyFiles(project.files, target); // поле "files" из package.json
  const deps = prod ? project.dependencies : allDependencies(project);
  // workspace:* превращается в обычную file:-зависимость
  installInto(target, replaceWorkspaceLinks(deps));
}
```

Запомни ловушку: без поля `"files": ["dist"]` pnpm взял бы файлы по `.gitignore`, а там указан `dist/`. Собранный код не попал бы в образ.

### Кэш слоёв

```dockerfile
# ❌ любая правка кода заново качает все пакеты
COPY . .
RUN pnpm install
```

Docker кэширует каждую инструкцию как слой. Изменился вход инструкции, и она вместе со всеми следующими выполняется заново.

```dockerfile
# ✅ pnpm fetch читает только lockfile, поэтому этот слой меняется редко
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --frozen-lockfile
```

Важный, преважный момент: `--frozen-lockfile` запрещает менять lockfile, поэтому в образе именно те версии, что мы проверяли.

### Почему сайт собирается при старте

```dockerfile
# ❌ так не работает
RUN next build
# Next.js: мне нужны данные, стучусь в http://api:3001
# ECONNREFUSED: во время docker build контейнера api не существует
```

Статическая страница получает данные на этапе сборки, а при `docker build` работающего API нет. Поэтому сборка идёт в момент старта контейнера, когда `depends_on` уже дождался здорового API:

```dockerfile
CMD ["sh", "-c", "next build && next start"]
```

Цена: старт дольше и образ тяжелее. Для нас это приемлемо, потому что образ только для локального запуска, а в проде сайт собирает Vercel.

Тут же живёт ещё одна тонкость. У `next build` два разных адреса API:

```yaml
API_URL: http://api:3001 # для сервера Next.js, внутри сети Docker
NEXT_PUBLIC_API_URL: http://localhost:3001 # для браузера, снаружи
```

Браузер пользователя не находится в сети Docker и имени `api` не знает.

### Порядок запуска

```ts
// Упрощённая модель - не исходный код Docker Compose
await start(db);
await waitFor(db, 'healthy'); // pg_isready прошёл
await runToCompletion(migrate); // service_completed_successfully, код 0
await start(api);
await waitFor(api, 'healthy'); // /health ответил 200
await start(web);
```

```yaml
# ❌ контейнер запущен, но Postgres внутри ещё не готов
depends_on: [db]

# ✅ ждём результат проверки здоровья
depends_on:
  db:
    condition: service_healthy
```

Взяли и запомнили: **запущенный контейнер и готовый сервис это разные вещи**.

### Лог был зелёным, а ошибка была

Контейнер `web` был здоров, тесты прошли, а в логе обнаружилось:

```text
ERR_PNPM_PACKAGE_MANAGER_REMOVE_MODULES_DIR
Failed to remove /repo/node_modules/.modules.yaml: Permission denied
```

Перед `pnpm run` pnpm сверяет `node_modules` с lockfile и при расхождении пытается доустановить зависимости. У пользователя `node` нет прав на запись, поэтому попытка падала, а pnpm продолжал работу.

```dockerfile
# ❌ менеджер пакетов во время работы контейнера
CMD ["sh", "-c", "pnpm build && pnpm start"]
```

```dockerfile
# ✅ зависимости уже установлены на этапе сборки, вызываем бинарники напрямую
ENV PATH=/repo/apps/web/node_modules/.bin:$PATH
CMD ["sh", "-c", "next build && next start"]
```

### Что не попало в образы

`.dockerignore` работает как `.gitignore` для контекста сборки. Без него `COPY . .` унёс бы в образ `private/` и `.env`. Мы проверили прямо внутри образов: `private`, `CLAUDE.md`, `.git` и `.env`-файлов там нет.

Настройки Telegram приезжают при запуске через `env_file` и в образ не записываются.

### Что проверили

```text
Запуск из чистых контейнеров:  все сервисы healthy примерно за 30 секунд
Playwright через контейнеры:   3 теста пройдены
Новый проект с пустым томом:   миграции применились с нуля, сайт собрался
down и снова up:               данные в томе сохранились
```

Новый проект с пустым томом важнее всего: так проект увидит тот, кто склонировал его в первый раз.

## Ещё раз, что мы сделали

Описали образы одним файлом со стадиями, а итоговый образ API сделали маленьким и без root. В Compose выстроили цепочку: база, миграции, API, сайт, и каждый ждёт готовности предыдущего. Сайт собирается при старте, потому что ему нужен работающий API. По пути нашли ошибку в логах зелёного контейнера и убрали pnpm из рантайма. Кайф: теперь проект поднимается одной командой.

## Вопросы на собеседовании

**Зачем многоэтапная сборка?**
Чтобы инструменты сборки и devDependencies не попали в итоговый образ. Он становится меньше, поверхность атаки сокращается, а исходников там нет.

**Как ускорить сборку образа?**
Упорядочить инструкции так, чтобы редко меняющееся шло раньше: сначала lockfile и зависимости, затем код. Изменение слоя пересобирает его и все последующие.

**Почему контейнер запускается не от root?**
Если приложение взломают, у атакующего будут права обычного пользователя внутри контейнера, а не root. Это снижает ущерб, в том числе при возможном выходе за пределы контейнера.

## Что изучить дальше

- [Docker: Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Compose: Control startup order](https://docs.docker.com/compose/how-tos/startup-order/)
- [pnpm: Working with Docker](https://pnpm.io/docker)
- [pnpm: deploy](https://pnpm.io/cli/deploy)

> Обновление с шага 10: отдельного образа `migrate` больше нет. Сервис `migrate` запускает прод-образ API командой `node --run db:release`, образ API вырос до 790 МБ. Подробности в [конспекте 10](./10-deploy.md).
