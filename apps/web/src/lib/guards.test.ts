import { describe, expect, it } from 'vitest';
import { isOneOf } from './guards';

describe('isOneOf', () => {
  it('узнаёт значение из списка', () => {
    expect(isOneOf(['ru', 'en'] as const, 'en')).toBe(true);
  });

  it('отклоняет чужое значение', () => {
    expect(isOneOf(['ru', 'en'] as const, 'de')).toBe(false);
  });
});
