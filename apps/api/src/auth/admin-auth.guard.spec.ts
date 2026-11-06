import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { ADMIN_COOKIES } from '@portfolio/shared';
import { describe, expect, it, vi } from 'vitest';
import { AdminAuthGuard } from './admin-auth.guard.js';
import type { AuthService, AuthUser } from './auth.service.js';

const user: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  role: 'ADMIN',
  sessionId: 'session-1',
};

function setup(options: { roles?: string[]; cookies?: object }) {
  const req: Record<string, unknown> = { cookies: options.cookies ?? {} };
  const context = {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
  const auth = { authenticate: vi.fn().mockResolvedValue(user) };
  const reflector = { getAllAndOverride: () => options.roles };
  const guard = new AdminAuthGuard(
    auth as unknown as AuthService,
    reflector as unknown as Reflector,
  );
  return { guard, context, req, auth };
}

const withToken = { [ADMIN_COOKIES.access]: 'token' };

describe('AdminAuthGuard', () => {
  it('без cookie отвечает 401 и не ходит в базу', async () => {
    const { guard, context, auth } = setup({ roles: ['ADMIN'] });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(auth.authenticate).not.toHaveBeenCalled();
  });

  it('с подходящей ролью пускает и кладёт пользователя в запрос', async () => {
    const { guard, context, req } = setup({
      roles: ['ADMIN'],
      cookies: withToken,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req['user']).toBe(user);
  });

  it('с чужой ролью отвечает 403', async () => {
    const { guard, context } = setup({
      roles: ['EDITOR'],
      cookies: withToken,
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('без указанных ролей не пускает никого', async () => {
    const { guard, context } = setup({ cookies: withToken });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
