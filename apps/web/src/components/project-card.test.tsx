// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Project } from '@/lib/api/content-api';
import { ProjectCard } from './project-card';

const project: Project = {
  slug: 'a',
  name: 'Проект',
  kind: 'OPEN_SOURCE',
  description: 'Описание',
  stack: ['React'],
  repoUrl: 'https://github.com/test/a',
  liveUrl: null,
};

afterEach(cleanup);

describe('ProjectCard', () => {
  it('показывает ссылку на код и не показывает пустую ссылку на сайт', () => {
    render(<ProjectCard project={project} />);

    expect(screen.getByRole('link', { name: 'Код' }).getAttribute('href')).toBe(
      'https://github.com/test/a',
    );
    expect(screen.queryByRole('link', { name: 'Сайт' })).toBeNull();
  });

  it('открывает внешние ссылки в новой вкладке безопасно', () => {
    render(
      <ProjectCard
        project={{ ...project, repoUrl: null, liveUrl: 'https://example.com' }}
      />,
    );

    const link = screen.getByRole('link', { name: 'Сайт' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.queryByRole('link', { name: 'Код' })).toBeNull();
  });
});
