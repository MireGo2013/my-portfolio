// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Experience } from '@/lib/api/content-api';
import { ExperienceItem } from './experience-item';

const item: Experience = {
  slug: 'a',
  company: 'Компания',
  project: 'Проект',
  role: 'Engineer',
  summary: 'Описание',
  startDate: '2021-12',
  endDate: '2026-07',
  highlights: ['Достижение'],
  stack: ['React'],
};

afterEach(cleanup);

describe('ExperienceItem', () => {
  it('показывает проект, роль с компанией, период и достижения', () => {
    render(<ExperienceItem item={item} />);

    expect(screen.getByRole('heading', { name: 'Проект' })).toBeTruthy();
    expect(screen.getByText('Engineer, Компания')).toBeTruthy();
    expect(screen.getByText('12.2021 — 07.2026')).toBeTruthy();
    expect(screen.getByText('Достижение')).toBeTruthy();
    expect(screen.getByText('React')).toBeTruthy();
  });

  it('показывает только роль, если компании нет', () => {
    render(<ExperienceItem item={{ ...item, company: null }} />);

    expect(screen.getByText('Engineer')).toBeTruthy();
  });

  it('не выводит пустой список достижений', () => {
    render(<ExperienceItem item={{ ...item, highlights: [], stack: [] }} />);

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
