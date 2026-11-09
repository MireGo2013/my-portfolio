// Резервный снимок публичного контента: им сайт собирается, если API не отвечает.
//
// Запуск — после крупных правок в админке, против прода:
//   API_URL=https://<api> pnpm --filter @portfolio/web content:snapshot
// Без API_URL берётся адрес из apps/web/.env.local, как у dev-сервера.
//
// Снимок — это копия на момент запуска. Правки в админке после него
// в снимок не попадут, пока его не обновить и не закоммитить.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LOCALES = ['ru', 'en'];
const SECTIONS = ['profile', 'experience', 'projects', 'skills'];
const target = fileURLToPath(
  new URL('../src/shared/content/content-snapshot.json', import.meta.url),
);

function apiUrlFromEnvFile() {
  try {
    const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    return env.match(/^API_URL=(.+)$/m)?.[1]?.trim();
  } catch {
    return undefined;
  }
}

const apiUrl = process.env.API_URL || apiUrlFromEnvFile();
if (!apiUrl) {
  console.error('Не задан API_URL');
  process.exit(1);
}

const snapshot = { generatedAt: new Date().toISOString(), source: apiUrl };
for (const section of SECTIONS) {
  snapshot[section] = {};
  for (const locale of LOCALES) {
    const url = `${apiUrl}/api/v1/${section}?locale=${locale}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`${url}: API ответил ${response.status}`);
      process.exit(1);
    }
    snapshot[section][locale] = await response.json();
  }
}

writeFileSync(target, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Снимок контента записан: ${target}`);
