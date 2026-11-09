// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { en } from '@/i18n/dictionaries/en';
import { ru } from '@/i18n/dictionaries/ru';
import type { Profile } from '@/shared/content/content-api';
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
  cvUrl: null,
};

afterEach(cleanup);

describe('AboutHero', () => {
  it('показывает приветствие, имя и историю', () => {
    render(<AboutHero profile={profile} locale="ru" dictionary={ru.about} />);

    expect(screen.getByText('Привет, меня зовут')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Тест');
    const paragraphs = Array.from(document.querySelectorAll('p')).map(
      (p) => p.textContent,
    );
    expect(paragraphs).toContain('Первый абзац');
    expect(paragraphs).toContain('Второй абзац');
  });

  it('ведёт на контакты третьей кнопкой', () => {
    render(<AboutHero profile={profile} locale="en" dictionary={en.about} />);

    expect(
      screen.getByRole('link', { name: 'Get in touch' }).getAttribute('href'),
    ).toBe('/en/contact');
  });

  it('показывает аватар с именем в описании', () => {
    render(<AboutHero profile={profile} locale="ru" dictionary={ru.about} />);

    expect(screen.getByRole('img', { name: 'Тест Тестов' })).toBeTruthy();
  });

  it.each([
    ['ru', ru.about, '/cv/CV_Sobol_Software_Engineer_RU.pdf'],
    ['en', en.about, '/cv/CV_Sobol_Software_Engineer_EN.pdf'],
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

  it('загруженное резюме открывается из хранилища, а скачивается через ?download=1', () => {
    const cvUrl = 'https://abc.public.blob.vercel-storage.com/cv/cv-ru-x1.pdf';
    render(
      <AboutHero
        profile={{ ...profile, cvUrl }}
        locale="ru"
        dictionary={ru.about}
      />,
    );

    expect(
      screen
        .getByRole('link', { name: ru.about.viewResume })
        .getAttribute('href'),
    ).toBe(cvUrl);
    expect(
      screen
        .getByRole('link', { name: ru.about.downloadResumeLabel })
        .getAttribute('href'),
    ).toBe(`${cvUrl}?download=1`);
  });
});
