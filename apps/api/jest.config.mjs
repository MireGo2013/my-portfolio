/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  rootDir: '.',
  testRegex: 'src/.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  // В ESM импорты пишутся с .js, а на диске лежит .ts
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.json' }],
  },
};
