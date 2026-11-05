// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NavLink } from './nav-link';

vi.mock('next/navigation', () => ({ usePathname: () => '/projects' }));

afterEach(cleanup);

describe('NavLink', () => {
  it('отмечает ссылку на текущую страницу', () => {
    render(<NavLink href="/projects" label="Проекты" />);

    expect(
      screen.getByRole('link', { name: 'Проекты' }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('не отмечает остальные ссылки', () => {
    render(<NavLink href="/skills" label="Стек" />);

    const link = screen.getByRole('link', { name: 'Стек' });
    expect(link.getAttribute('aria-current')).toBeNull();
    expect(link.getAttribute('href')).toBe('/skills');
  });
});
