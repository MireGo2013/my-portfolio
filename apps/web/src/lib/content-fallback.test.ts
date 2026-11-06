import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { snapshot, withSnapshot } from './content-fallback';

const apiDown = () => Promise.reject(new Error('fetch failed'));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('withSnapshot', () => {
  it('при сборке без API берёт данные из снимка', async () => {
    vi.stubEnv('NEXT_PHASE', PHASE_PRODUCTION_BUILD);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(withSnapshot('projects', 'en', apiDown)).resolves.toBe(
      snapshot.projects.en,
    );
  });

  it('во время работы сайта ошибку не прячет: Next.js оставит в кэше прошлую версию', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-server');

    await expect(withSnapshot('profile', 'ru', apiDown)).rejects.toThrow(
      'fetch failed',
    );
  });

  it('если API ответил, снимок не нужен', async () => {
    vi.stubEnv('NEXT_PHASE', PHASE_PRODUCTION_BUILD);
    const fresh = [{ slug: 'fresh' }] as never;

    await expect(
      withSnapshot('skills', 'ru', () => Promise.resolve(fresh)),
    ).resolves.toBe(fresh);
  });
});

describe('снимок', () => {
  it.each(['ru', 'en'] as const)('на языке %s есть весь контент', (locale) => {
    expect(snapshot.profile[locale].shortName).toBeTruthy();
    expect(snapshot.experience[locale].length).toBeGreaterThan(0);
    expect(snapshot.projects[locale].length).toBeGreaterThan(0);
    expect(snapshot.skills[locale].length).toBeGreaterThan(0);
  });
});
