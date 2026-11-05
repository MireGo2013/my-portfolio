// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { en } from '@/i18n/dictionaries/en';
import { ru } from '@/i18n/dictionaries/ru';
import type { Profile } from '@/lib/api/content-api';
import { AboutHero } from './about-hero';

const profile: Profile = {
  fullName: 'Тест Тестов',
  shortName: 'Тест',
  title: 'Engineer',
  specialization: 'TypeScript',
  summary: 'Кратко',
  about: ['Первый абзац', 'Второй абзац'],
  email: 'test@example.com',
  telegramUrl: 'https://t.me/test',
  githubUrl: 'https://github.com/test',
  linkedinUrl: 'https://www.linkedin.com/in/test',
};

afterEach(cleanup);

describe('AboutHero', () => {
  it('показывает приветствие, имя и историю', () => {
    render(<AboutHero profile={profile} locale="ru" dictionary={ru.about} />);

    expect(screen.getByText('Привет, меня зовут')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Тест');
    expect(screen.getByText('Первый абзац')).toBeTruthy();
    expect(screen.getByText('Второй абзац')).toBeTruthy();
  });

  it('показывает аватар с именем в описании', () => {
    render(<AboutHero profile={profile} locale="ru" dictionary={ru.about} />);

    expect(screen.getByRole('img', { name: 'Тест Тестов' })).toBeTruthy();
  });

  it.each([
    ['ru', ru.about, '/cv/Sobol_Vladislav_CV_RU.pdf'],
    ['en', en.about, '/cv/Sobol_Vladislav_CV_EN.pdf'],
  ] as const)(
    'резюме на языке %s открывается и скачивается отдельно',
    (locale, dictionary, url) => {
      render(
        <AboutHero profile={profile} locale={locale} dictionary={dictionary} />,
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
