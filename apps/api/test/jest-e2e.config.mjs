import base from '../jest.config.mjs';

/** @type {import('jest').Config} */
export default {
  ...base,
  rootDir: '..',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
};
