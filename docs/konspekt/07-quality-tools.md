# 07. Качество кода: ESLint, Prettier, Husky, lint-staged

## Что сделали

Подключили линтер, форматтер и проверку перед коммитом, чтобы ошибки и разнобой в оформлении останавливались до попадания в репозиторий.

## Что и зачем

| Файл | Зачем нужен |
| --- | --- |
| `eslint.config.mjs` | Единый конфиг на весь монорепозиторий |
| `.prettierrc.json`, `.prettierignore` | Настройки форматирования и что не трогать |
| `.husky/pre-commit` | Запускает lint-staged перед коммитом |
| `package.json` | Скрипты `lint`, `format` и правила `lint-staged` |

Команды:

```bash
pnpm lint            # ESLint, предупреждения тоже считаются ошибкой
pnpm lint:fix        # то, что можно исправить автоматически
pnpm format          # Prettier перепишет файлы
pnpm format:check    # только проверка, для CI
```

Почему именно так, и какие были альтернативы:

- **Один конфиг в корне против конфига на приложение.** Правила общие, а `extends: [nextVitals]` с `files` применяет правила Next только к сайту. Цена: конфиг знает про структуру репозитория.
- **`recommendedTypeChecked` против обычного `recommended`.** Правила на основе типов находят то, что без типов не увидеть. Цена: линт медленнее, у нас около 10 секунд.
- **ESLint с Prettier против Biome или oxlint.** Такой стек зафиксирован в проекте, и правила Next и typescript-eslint здесь самые полные. oxlint, который предлагает `nest new`, быстрее, но правил у него пока меньше.
- **`next lint` не используем.** В Next 16 команду удалили, теперь вызывается обычный `eslint`.

## Как это работает

### Кто за что отвечает

**ESLint** ищет проблемы в логике, **Prettier** отвечает только за внешний вид. Взяли и запомнили: **линтер про ошибки, форматтер про пробелы**.

```js
// ❌ два инструмента спорят: один добавил кавычки, другой их поменял
export default defineConfig([tseslint.configs.recommended]);
```

```js
// ✅ eslint-config-prettier отключает в ESLint всё, что касается оформления
export default defineConfig([tseslint.configs.recommended, prettier]);
```

Важный, преважный момент: `prettier` должен идти последним, потому что в плоском конфиге (flat config) более поздний блок перекрывает более ранние.

### Зачем линтеру типы

```ts
// ❌ компилятор молчит, а ошибка улетит в никуда
export function caller() {
  run(); // run возвращает Promise, и никто его не ждёт
}
```

**Плавающий промис** (floating promise) это промис, результат которого никто не обрабатывает. Простыми словами: если `run` упадёт, ошибка станет необработанным отказом, а вызывающий код об этом не узнает. Обычный ESLint видит только вызов функции, а чтобы понять, что это промис, ему нужны типы.

`projectService: true` даёт линтеру доступ к TypeScript:

```ts
// Упрощённая модель - не исходный код typescript-eslint
function checkFloatingPromise(node, typeChecker) {
  const type = typeChecker.getTypeAtLocation(node.expression);
  if (isPromiseLike(type) && !isHandled(node)) {
    report(node, 'Promises must be awaited...');
  }
}
```

Отсюда важное следствие: для линта нужны сгенерированные клиент Prisma и `dist` пакета shared, поэтому `pnpm lint` сначала делает `build:deps`.

### Что линтер нашёл в нашем коде

```tsx
// ❌ handleSubmit возвращает промис, а onSubmit ждёт void
<form onSubmit={handleSubmit(onSubmit)}>
```

```tsx
// ✅ явно говорим: результат не нужен, ошибки обрабатываются внутри
<form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
```

### Как работает проверка перед коммитом

**Git-хук** (git hook) это скрипт, который Git запускает при определённом событии. Простыми словами: перед созданием коммита Git выполняет файл `pre-commit` из папки, указанной в `core.hooksPath`. Код выхода не ноль, и коммита не будет.

**Husky** прописывает `core.hooksPath=.husky/_` в настройки твоего репозитория. Делает он это через скрипт `prepare`, который сам запускается при `pnpm install`.

```text
git commit
  -> .husky/pre-commit
  -> lint-staged берёт только застейдженные файлы
  -> eslint --fix и prettier --write
  -> ошибка? коммит отменён
```

```bash
# ❌ на большом проекте это минуты на каждый коммит
pnpm lint

# ✅ только то, что реально меняется в этом коммите
lint-staged
```

Лайфхак: `git commit --no-verify` обойдёт хук. Поэтому хук это удобство для разработчика, а настоящая защита находится в CI.

В хуке написано `./node_modules/.bin/lint-staged`, а не `pnpm exec`, чтобы он работал и там, где глобального `pnpm` нет в PATH, например в некоторых IDE.

### Негативная проверка

Зелёный линтер ещё ничего не доказывает: вдруг правила просто не применяются. Поэтому мы подсунули файлы с намеренными нарушениями:

```text
ESLint на тестовом файле:   no-floating-promises -> error, no-img-element -> warning
git commit с этим файлом:   ✖ Failed to run tasks for staged files!  exit=1
```

Кстати, `no-img-element` оказался предупреждением. Обычный `eslint .` вернул бы успех, и CI пропустил бы проблему, поэтому в `pnpm lint` стоит `--max-warnings=0`.

И ещё мы поймали ловушку: `core.hooksPath` оказался пустым, потому что `pnpm add` не запустил `prepare`. Хук лежал в папке и не работал. Кайф, что проверили, а не поверили.

## Ещё раз, что мы сделали

Настроили ESLint с правилами на основе типов и отдельными правилами Next для сайта, а Prettier взял на себя оформление. Husky и lint-staged проверяют застейдженные файлы перед коммитом. Затем мы подсунули плохой код и убедились, что линтер ругается, а коммит отклоняется. Погнали к Docker.

## Вопросы на собеседовании

**Чем ESLint отличается от Prettier, и зачем оба?**
ESLint ищет потенциальные ошибки, Prettier единообразно форматирует код. `eslint-config-prettier` отключает правила оформления в ESLint, чтобы они не конфликтовали.

**Почему lint-staged, а не линт всего проекта в хуке?**
Скорость. Хук, который идёт минуты, начнут обходить через `--no-verify`. Весь проект проверяет CI.

**Зачем CI, если есть pre-commit?**
Хук работает только локально, его можно обойти или не установить. CI нельзя обойти при защищённой ветке, и он проверяет чистую копию проекта.

## Что изучить дальше

- [typescript-eslint: Linting with Type Information](https://typescript-eslint.io/getting-started/typed-linting)
- [Next.js: ESLint](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Husky: Get started](https://typicode.github.io/husky/get-started.html)
- [lint-staged](https://github.com/lint-staged/lint-staged)
