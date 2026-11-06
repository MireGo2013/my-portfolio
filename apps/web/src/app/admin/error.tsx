'use client';

/**
 * Ошибка внутри админки. Чаще всего это недоступный API: проверка сессии
 * в layout не дошла до сервера. Публичный сайт при этом работает из кэша,
 * поэтому честно говорим, что сломана только админка.
 */
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">Админка недоступна</h1>
      <p className="text-muted">
        Не получилось связаться с API. Сайт-портфолио при этом работает как
        обычно, недоступно только управление контентом.
      </p>
      <button
        type="button"
        onClick={reset}
        className="self-start rounded-sm bg-accent px-5 py-3 font-medium text-on-accent transition-opacity hover:opacity-90"
      >
        Попробовать снова
      </button>
    </main>
  );
}
