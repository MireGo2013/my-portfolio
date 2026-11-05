import { describe, expect, it } from 'vitest';
import { isSitePath, SITE_SECTIONS } from './site-sections';

describe('isSitePath', () => {
  it.each(['', '/projects', '/skills', '/experience', '/contact'])(
    'раздел "%s" существует',
    (path) => {
      expect(isSitePath(path)).toBe(true);
    },
  );

  it.each(['/nope', '/skills/extra', '/favicon.ico', '/work'])(
    'адреса "%s" нет',
    (path) => {
      expect(isSitePath(path)).toBe(false);
    },
  );

  it('главная идёт первой, как в меню', () => {
    expect(SITE_SECTIONS[0].path).toBe('');
  });
});
