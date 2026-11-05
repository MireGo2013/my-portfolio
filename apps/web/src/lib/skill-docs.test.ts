import { describe, expect, it } from 'vitest';
import { SKILL_DOCS_URLS, skillDocsUrl } from './skill-docs';

describe('skillDocsUrl', () => {
  it('находит документацию навыка', () => {
    expect(skillDocsUrl('React')).toBe('https://react.dev/');
  });

  it('не обращает внимания на версию в названии', () => {
    expect(skillDocsUrl('Next.js 16')).toBe('https://nextjs.org/docs');
  });

  it('у общих понятий ссылки нет', () => {
    expect(skillDocsUrl('SOLID')).toBeUndefined();
  });

  it('все ссылки защищённые', () => {
    for (const url of SKILL_DOCS_URLS) {
      expect(url).toMatch(/^https:\/\//);
    }
  });
});
