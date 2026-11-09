// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { initials, Monogram } from './monogram';

afterEach(cleanup);

describe('initials', () => {
  it.each([
    ['Владислав Соболь', 'ВС'],
    ['Vladislav Sobol', 'VS'],
  ])('%s -> %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});

describe('Monogram', () => {
  it('показывает инициалы', () => {
    render(<Monogram fullName="Владислав Соболь" />);

    expect(screen.getByText('ВС')).toBeTruthy();
  });
});
