import { describe, expect, it } from 'vitest';
import { formatPeriod } from './format-period';

describe('formatPeriod', () => {
  it('форматирует завершённый период', () => {
    expect(formatPeriod('2021-12', '2026-07')).toBe('12.2021 — 07.2026');
  });

  it('показывает незавершённую работу', () => {
    expect(formatPeriod('2026-01', null)).toBe('01.2026 — настоящее время');
  });
});
