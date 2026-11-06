import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    // Все файлы работают с одной базой. Параллельно один тест создавал бы
    // сообщения, пока другой считает их по статусам
    fileParallelism: false,
  },
});
