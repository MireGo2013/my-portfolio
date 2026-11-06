import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/.next/**',
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
    'apps/api/src/generated/**',
    'apps/web/src/lib/api/schema.d.ts',
    '**/next-env.d.ts',
    'private/**',
  ]),

  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    rules: {
      // const { id, ...rest } = record — обычный способ убрать поле из объекта
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true },
      ],
    },
  },

  // Обычный JS вне tsconfig: правила на основе типов тут работать не могут
  {
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Правила Next.js и React только для сайта
  {
    files: ['apps/web/**/*.{ts,tsx,mjs}'],
    extends: [nextVitals],
    settings: { next: { rootDir: 'apps/web/' } },
  },

  // В тестах ответы API и моки намеренно не типизированы
  {
    files: ['**/*.{spec,test,e2e-spec}.{ts,tsx}', 'apps/web/e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // Последним: отключает правила, которые спорят с Prettier
  prettier,
]);
