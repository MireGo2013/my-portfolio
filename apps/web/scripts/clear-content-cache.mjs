// Next.js сохраняет результаты `use cache` в .next/cache/fetch-cache, а Vercel
// переносит эту папку между сборками. Без очистки новая сборка взяла бы контент
// и структуру ответов API из прошлой сборки, а не из текущего API.
import { rmSync } from 'node:fs';

rmSync(new URL('../.next/cache/fetch-cache', import.meta.url), {
  recursive: true,
  force: true,
});
