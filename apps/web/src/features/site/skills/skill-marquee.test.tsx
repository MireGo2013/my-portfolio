// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SkillMarquee } from './skill-marquee';

const logos = [{ name: 'React', path: 'M0 0h24v24H0z' }, { name: 'Zustand' }];

afterEach(cleanup);

describe('SkillMarquee', () => {
  it('скринридер видит каждый навык один раз, без копии для анимации', () => {
    render(<SkillMarquee logos={logos} label="Навыки" />);

    const region = screen.getByRole('region', { name: 'Навыки' });

    expect(within(region).getAllByRole('listitem')).toHaveLength(2);
    expect(within(region).getAllByText('React')).not.toHaveLength(0);
  });

  it('без логотипа показывает буквы названия', () => {
    render(<SkillMarquee logos={logos} label="Навыки" />);

    expect(screen.getAllByText('Zu')).not.toHaveLength(0);
  });
});
