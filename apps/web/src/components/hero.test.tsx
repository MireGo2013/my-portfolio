// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Profile } from '@/lib/api/content-api';
import { en } from '@/i18n/dictionaries/en';
import { ru } from '@/i18n/dictionaries/ru';
import { Hero } from './hero';

const profile: Profile = {
  fullName: 'Тест Тестов',
  title: 'Engineer',
  specialization: 'TypeScript',
  summary: 'Описание',
  email: 'test@example.com',
  telegramUrl: 'https://t.me/test',
  githubUrl: 'https://github.com/test',
  linkedinUrl: 'https://www.linkedin.com/in/test',
};

afterEach(cleanup);

describe('Hero', () => {
  it('показывает имя главным заголовком и описание', () => {
    render(<Hero profile={profile} locale="ru" dictionary={ru.hero} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Тест Тестов',
    );
    expect(screen.getByText('Описание')).toBeTruthy();
  });

  it('ведёт на контакты из профиля', () => {
    render(<Hero profile={profile} locale="ru" dictionary={ru.hero} />);

    const href = (name: string) =>
      screen.getByRole('link', { name }).getAttribute('href');

    expect(href('Связаться')).toBe('/ru/contact');
    expect(href('LinkedIn')).toBe('https://www.linkedin.com/in/test');
    expect(href('Telegram')).toBe('https://t.me/test');
    expect(href('GitHub')).toBe('https://github.com/test');
  });

  it.each([
    ['ru', ru.hero, '/cv/Sobol_Vladislav_CV_RU.pdf'],
    ['en', en.hero, '/cv/Sobol_Vladislav_CV_EN.pdf'],
  ] as const)(
    'резюме на языке %s открывается и скачивается отдельно',
    (locale, dictionary, url) => {
      render(
        <Hero profile={profile} locale={locale} dictionary={dictionary} />,
      );

      const view = screen.getByRole('link', { name: dictionary.viewResume });
      const download = screen.getByRole('link', {
        name: dictionary.downloadResumeLabel,
      });

      expect(view.getAttribute('href')).toBe(url);
      expect(view.getAttribute('target')).toBe('_blank');
      expect(download.getAttribute('href')).toBe(url);
      expect(download.hasAttribute('download')).toBe(true);
    },
  );
});
