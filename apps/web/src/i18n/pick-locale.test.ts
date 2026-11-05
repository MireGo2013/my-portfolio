import { describe, expect, it } from 'vitest';
import { switchLocalePath, resumeUrl } from './config';
import { pickLocale } from './pick-locale';

describe('pickLocale', () => {
  it.each([
    ['ru-RU,ru;q=0.9,en;q=0.8', 'ru'],
    ['en-US,en;q=0.9', 'en'],
    ['de-DE,de;q=0.9', 'en'],
    ['de-DE,ru;q=0.5', 'ru'],
    ['en;q=0.5,ru;q=0.9', 'ru'],
    ['ru;q=0,en', 'en'],
    ['', 'en'],
  ])('заголовок "%s" даёт язык %s', (header, expected) => {
    expect(pickLocale(undefined, header)).toBe(expected);
  });

  it('без заголовка выбирает английский', () => {
    expect(pickLocale(undefined, null)).toBe('en');
  });

  it('выбор посетителя важнее настроек браузера', () => {
    expect(pickLocale('en', 'ru-RU')).toBe('en');
  });

  it('игнорирует подделанное значение cookie', () => {
    expect(pickLocale('de', 'ru-RU')).toBe('ru');
  });
});

describe('switchLocalePath', () => {
  it('меняет язык и сохраняет страницу', () => {
    expect(switchLocalePath('/ru/skills', 'en')).toBe('/en/skills');
  });

  it('работает на главной', () => {
    expect(switchLocalePath('/ru', 'en')).toBe('/en');
  });
});

describe('resumeUrl', () => {
  it('ведёт на PDF нужного языка', () => {
    expect(resumeUrl('ru')).toBe('/cv/Sobol_Vladislav_CV_RU.pdf');
    expect(resumeUrl('en')).toBe('/cv/Sobol_Vladislav_CV_EN.pdf');
  });
});
