import { describe, expect, it } from 'vitest';
import { fieldOf } from './use-save';

describe('fieldOf', () => {
  it.each([
    ['slug', 'slug'],
    ['translations.ru.summary', 'translations.ru.summary'],
    ['stack.2', 'stack'],
    ['translations.en.achievements.0', 'translations.en.achievements'],
  ])('ошибку %s показывает у поля %s', (path, field) => {
    expect(fieldOf(path)).toBe(field);
  });
});
