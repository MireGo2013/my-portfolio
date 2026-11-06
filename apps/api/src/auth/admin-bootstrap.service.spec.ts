import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AdminBootstrapService } from './admin-bootstrap.service.js';

function setup(options: { users: number; env: Record<string, string> }) {
  const upsert = vi.fn().mockResolvedValue({});
  const prisma = {
    adminUser: { count: () => Promise.resolve(options.users), upsert },
  } as unknown as PrismaService;
  const config = {
    get: (key: string) => options.env[key],
  } as unknown as ConfigService;
  return { service: new AdminBootstrapService(prisma, config), upsert };
}

const env = {
  ADMIN_EMAIL: ' Admin@Example.com ',
  ADMIN_PASSWORD: 'long-enough-password',
};

describe('AdminBootstrapService', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  it('создаёт администратора с хешем пароля, когда база пустая', async () => {
    const { service, upsert } = setup({ users: 0, env });

    await service.onApplicationBootstrap();

    const { create } = upsert.mock.calls[0]?.[0] as {
      create: { email: string; passwordHash: string };
    };
    expect(create.email).toBe('admin@example.com');
    expect(create.passwordHash).not.toContain(env.ADMIN_PASSWORD);
    expect(await verify(create.passwordHash, env.ADMIN_PASSWORD)).toBe(true);
  });

  it('ничего не делает, когда администратор уже есть', async () => {
    const { service, upsert } = setup({ users: 1, env });

    await service.onApplicationBootstrap();

    expect(upsert).not.toHaveBeenCalled();
  });

  it('не создаёт администратора без переменных или с коротким паролем', async () => {
    const empty = setup({ users: 0, env: {} });
    const short = setup({
      users: 0,
      env: { ...env, ADMIN_PASSWORD: 'short' },
    });

    await empty.service.onApplicationBootstrap();
    await short.service.onApplicationBootstrap();

    expect(empty.upsert).not.toHaveBeenCalled();
    expect(short.upsert).not.toHaveBeenCalled();
  });
});
