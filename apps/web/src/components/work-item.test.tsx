// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ru } from '@/i18n/dictionaries/ru';
import type { Experience } from '@/lib/api/content-api';
import { WorkItem } from './work-item';

const item: Experience = {
  slug: 'a',
  company: 'Компания',
  project: 'Проект',
  role: 'Engineer',
  summary: 'Описание',
  startDate: '2021-12',
  endDate: '2026-07',
  responsibilities: ['Обязанность'],
  achievements: ['Достижение'],
  stack: ['React'],
};

afterEach(cleanup);

describe('WorkItem', () => {
  it('показывает проект, роль, период, обязанности, достижения и стек', () => {
    render(<WorkItem item={item} labels={ru.work} />);

    expect(screen.getByRole('heading', { name: 'Проект' })).toBeTruthy();
    expect(screen.getByText('Engineer, Компания')).toBeTruthy();
    expect(screen.getByText('12.2021 — 07.2026')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: ru.work.responsibilities }),
    ).toBeTruthy();
    expect(screen.getByText('Обязанность')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: ru.work.achievements }),
    ).toBeTruthy();
    expect(screen.getByText('Достижение')).toBeTruthy();
    expect(screen.getByText('React')).toBeTruthy();
  });

  it('показывает только роль, если компании нет', () => {
    render(<WorkItem item={{ ...item, company: null }} labels={ru.work} />);

    expect(screen.getByText('Engineer')).toBeTruthy();
  });

  it('не выводит пустые разделы', () => {
    render(
      <WorkItem
        item={{ ...item, responsibilities: [], achievements: [] }}
        labels={ru.work}
      />,
    );

    expect(
      screen.queryByRole('heading', { name: ru.work.responsibilities }),
    ).toBeNull();
    expect(
      screen.queryByRole('heading', { name: ru.work.achievements }),
    ).toBeNull();
  });
});
