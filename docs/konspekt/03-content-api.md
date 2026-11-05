# 03. API контента: схема, seed и Swagger

## Что сделали

Описали контент сайта в PostgreSQL, заполнили его seed-скриптом и отдали через REST-эндпоинты с OpenAPI-документацией: профиль, опыт, проекты и навыки.

## Что и зачем

| Файл | Зачем нужен |
| --- | --- |
| `prisma/schema.prisma` | Таблицы `Profile`, `Experience`, `Project`, `SkillCategory`, `Skill` |
| `prisma/seed-data.ts` | Весь публичный текст сайта. Главный файл для правки контента |
| `prisma/seed.ts` | Записывает эти данные в базу одной транзакцией |
| `src/profile`, `experience`, `projects`, `skills` | По модулю на ресурс: контроллер, сервис, DTO |
| `src/app.setup.ts` | Подключили Swagger |
| `test/content.e2e-spec.ts` | HTTP-запросы к настоящей базе и проверка OpenAPI-документа |

Эндпоинты, все только на чтение:

```text
GET /api/v1/profile      кто я и контакты
GET /api/v1/experience   опыт работы
GET /api/v1/projects     открытые и фриланс-проекты
GET /api/v1/skills       стек по областям
GET /api/docs            Swagger UI
GET /api/docs-json       OpenAPI JSON, отсюда фронт сгенерирует типы
```

Команды:

```bash
pnpm db:migrate --name content   # миграция новых таблиц
pnpm db:seed                     # заполнили базу
pnpm test:e2e                    # e2e, нужны база и seed
```

Почему именно так, и какие были альтернативы:

- **Модуль на ресурс против одного `ContentModule`.** Сейчас хватило бы и одного, но в v2 у каждого ресурса появится свой CRUD. Цена: немного однотипных файлов.
- **Навыки отдельной таблицей, а стек в проекте массивом.** В v2 навыки редактируются поштучно, и у них есть порядок и категория. Стек проекта это просто подпись, ему хватает `String[]`.
- **`tsx` для seed.** В Node 24 есть встроенное удаление типов, но клиент Prisma импортирует файлы с `.js`, а на диске лежат `.ts`, и Node такой файл не найдёт.
- **Опыт хранится как `DATE`, наружу уходит `2021-12`.** В резюме точность до месяца, поэтому день наружу не отдаём: он выдуманный. Форматирование под пользователя сделает фронт.
- **Postman-коллекцию не заводили.** Контракт описан в OpenAPI, а поведение проверяют e2e-тесты. Второй артефакт пока дублировал бы их.

## Как это работает

### Почему нельзя просто вернуть строку из Prisma

```ts
// ❌ так не работает
@Get()
list() {
  return this.prisma.experience.findMany();
}
```

Что ушло бы клиенту: служебные `id` и `position`, а дата превратилась бы в `2021-12-01T00:00:00.000Z`. Любое новое поле таблицы, например заметка для админки, автоматически утекло бы наружу.

**DTO** (Data Transfer Object, объект передачи данных) это описание формы данных, которые API отдаёт наружу. Простыми словами: таблица может меняться как угодно, а клиент видит только то, что мы явно перечислили.

```ts
// ✅ select берёт только публичные поля, а даты форматирует сервис
const items = await this.prisma.experience.findMany({
  orderBy: { position: 'asc' },
  select: { slug: true, startDate: true /* ... */ },
});
return items.map((item) => ({ ...item, startDate: toMonth(item.startDate) }));
```

E2E-тест это закрепляет: `expect(body[0]).not.toHaveProperty('id')`. Сервис заодно гоняем в unit-тестах на формат дат и `null`.

### Откуда Swagger узнаёт форму ответа

Swagger: «покажи мне класс, я прочитаю его декораторы и составлю схему».

```ts
// ❌ схема будет неправильной
@ApiProperty()
endDate!: string | null;
```

TypeScript при компиляции стирает типы, и для объединения `string | null` в метаданных остаётся просто `Object`. Swagger не знает, что там строка и что бывает `null`.

```ts
// ✅ говорим явно
@ApiProperty({ type: String, nullable: true, example: '2025-11' })
endDate!: string | null;
```

```ts
// Упрощённая модель - не исходный код @nestjs/swagger
function ApiProperty(options = {}) {
  return (target, key) => {
    const designType = Reflect.getMetadata('design:type', target, key); // String, Object...
    const schema = { type: options.type ?? designType, ...options };
    addToSchema(target.constructor, key, schema);
  };
}
// При старте createDocument обходит контроллеры, берёт класс из @ApiOkResponse
// и превращает собранные поля в components.schemas
```

Важный, преважный момент: DTO-класс нужен Swagger в рантайме, поэтому `ProjectDto` в контроллере импортируется обычным импортом. В сервисе же он только тип, там хватает `import type`. Взяли и запомнили: **декоратору нужен класс, а типу хватает типа**.

Правильность документа важна не только для красоты: из него фронт сгенерирует типы. Ошибись тут, и ошибка заедет в весь клиент. Поэтому e2e-тест проверяет сам OpenAPI-документ, например что `endDate` там `nullable`.

### Как устроен seed

```ts
// ❌ так не работает: второй запуск упадёт на уникальном slug
await prisma.experience.createMany({ data: experience });
```

**Идемпотентность** (idempotency) означает, что повторный запуск даёт тот же результат, что и первый. Простыми словами: у нас seed в транзакции удаляет весь контент и создаёт его заново, поэтому его можно запускать сколько угодно раз.

```ts
// ✅ всё или ничего
await prisma.$transaction(async (tx) => {
  await tx.experience.deleteMany();
  await tx.experience.createMany({ data /* ... */ });
});
```

Что здесь важно проверить руками: seed не должен трогать таблицу `contact_messages`, там сообщения реальных людей. Проверили: вставили сообщение, запустили seed дважды, сообщение на месте.

Ограничение: как только в v2 появится админка, контент будут править в базе, и seed затёр бы эти правки. Значит, на проде после этого его запускать нельзя.

### Ловушка: migrate больше не генерирует клиент

```bash
# ❌ в Prisma 7 здесь старый клиент
pnpm db:migrate --name content
pnpm db:seed   # упало: у клиента ещё нет новых моделей
```

Prisma 7 разделила эти шаги: `migrate dev` меняет базу, но код клиента не обновляет. Поэтому скрипт у нас такой: `"db:seed": "prisma generate && prisma db seed"`. Проверили с чистого состояния: удалили `src/generated`, запустили seed, кайф, работает.

### Каскадное удаление

```prisma
category SkillCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
```

**Каскад** (`ON DELETE CASCADE`) это правило на уровне базы: удаляешь категорию, и PostgreSQL сам удаляет её навыки. Простыми словами: это выполняет не Prisma и не наш код, а база, поэтому целостность сохранится при любом способе удаления. Благодаря этому seed просто заюзал `skillCategory.deleteMany()`.

### Навыки: два запроса или один

В базе навык лежит отдельной строкой, а клиенту нужен простой массив строк.

```ts
// ❌ N+1: один запрос на категории и по запросу на каждую из них
const categories = await prisma.skillCategory.findMany();
for (const category of categories) {
  category.skills = await prisma.skill.findMany({
    where: { categoryId: category.id },
  });
}
```

```ts
// ✅ один вызов Prisma со вложенным select, форму меняем уже в JS
const categories = await this.prisma.skillCategory.findMany({
  select: { slug: true, name: true, skills: { select: { name: true } } },
});
return categories.map((c) => ({ ...c, skills: c.skills.map((s) => s.name) }));
```

### Откуда взялся контент

Источник: файл резюме, а открытые проекты сверены с `gh repo list`. В публичный `seed-data.ts` намеренно не попали дата рождения, гражданство, полное юрлицо и заказчик Law Portal, он под NDA. Запомним: **этот файл уезжает в открытый репозиторий, поэтому всё в нём считается опубликованным**.

## Ещё раз, что мы сделали

Описали таблицы контента и сделали миграцию. Перенесли публичный текст из резюме в `seed-data.ts`, а seed в одной транзакции кладёт его в базу, не трогая сообщения из формы. Поверх сделали четыре модуля: сервис выбирает только публичные поля, а DTO описывает форму ответа для Swagger. Прогнали unit- и e2e-тесты и вживую опросили собранное приложение. Теперь у фронта есть реальные данные и контракт. Погнали делать сайт.

## Вопросы на собеседовании

**Зачем DTO, если Prisma и так генерирует типы?**
Типы Prisma описывают таблицу, а DTO описывает публичный контракт. Они меняются независимо: новое служебное поле не утечёт наружу. Кроме того, декораторы DTO дают OpenAPI-схему, ведь обычные типы в рантайме не существуют.

**Что такое проблема N+1, и как вы её избежали?**
Это один запрос за списком плюс по запросу на каждый элемент. В навыках связанные данные запрашиваются вложенным `select` в одном вызове Prisma, и ORM сам загружает их без отдельного запроса из нашего цикла.

**Почему контент в базе, а не в JSON-файле?**
По сути, сейчас, в v1, хватило бы и файла. База нужна под v2: админка редактирует контент без деплоя и с revalidate страниц. Плюс проект показывает работу с полным циклом данных.

## Что изучить дальше

- [NestJS: OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [NestJS: OpenAPI Types and Parameters](https://docs.nestjs.com/openapi/types-and-parameters)
- [PostgreSQL: Arrays](https://www.postgresql.org/docs/current/arrays.html)
- [PostgreSQL: Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)
