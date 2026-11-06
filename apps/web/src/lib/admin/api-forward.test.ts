import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientIpFrom, requestHost } from './api-forward';

afterEach(() => vi.unstubAllEnvs());

const headers = new Headers({ 'x-real-ip': '203.0.113.9' });

describe('clientIpFrom', () => {
  it('без явного разрешения не верит x-real-ip, даже с VERCEL=1', () => {
    // vercel env pull кладёт VERCEL=1 в .env.local
    vi.stubEnv('VERCEL', '1');

    expect(clientIpFrom(headers)).toBe(undefined);
  });

  it('с TRUST_X_REAL_IP=true берёт адрес из заголовка', () => {
    vi.stubEnv('TRUST_X_REAL_IP', 'true');

    expect(clientIpFrom(headers)).toBe('203.0.113.9');
  });
});

describe('requestHost', () => {
  it('берёт первый хост из цепочки прокси', () => {
    expect(
      requestHost(
        new Headers({
          'x-forwarded-host': 'site.example, cdn.example',
          host: 'web:3000',
        }),
      ),
    ).toBe('site.example');
    expect(requestHost(new Headers({ host: 'site.example' }))).toBe(
      'site.example',
    );
  });
});
