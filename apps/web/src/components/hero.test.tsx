// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Profile } from '@/lib/api/content-api';
import { Hero } from './hero';

const profile: Profile = {
  fullName: 'Тест Тестов',
  title: 'Engineer',
  specialization: 'TypeScript',
  summary: 'Описание',
  email: 'test@example.com',
  telegramUrl: 'https://t.me/test',
  githubUrl: 'https://github.com/test',
};

afterEach(cleanup);

describe('Hero', () => {
  it('показывает имя главным заголовком и описание', () => {
    render(<Hero profile={profile} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Тест Тестов',
    );
    expect(screen.getByText('Описание')).toBeTruthy();
  });

  it('ведёт на контакты из профиля', () => {
    render(<Hero profile={profile} />);

    const href = (name: string) =>
      screen.getByRole('link', { name }).getAttribute('href');

    expect(href('Связаться')).toBe('/contact');
    expect(href('Скачать резюме')).toBe('/cv/Sobol_Vladislav_CV_RU.pdf');
    expect(href('Telegram')).toBe('https://t.me/test');
    expect(href('GitHub')).toBe('https://github.com/test');
  });
});
