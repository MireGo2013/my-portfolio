import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_COOKIES } from '@portfolio/shared';
import type { Request } from 'express';
import type { AdminRole } from '../generated/prisma/client.js';
import { ROLES_KEY } from './auth.constants.js';
import { readCookie } from './auth.cookies.js';
import { AuthService, type AuthUser } from './auth.service.js';

export type AuthenticatedRequest = Request & { user: AuthUser };

/**
 * Пускает только с действующей сессией и нужной ролью.
 * 401 значит «войди заново», 403 — «вошёл, но сюда нельзя».
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const accessToken = readCookie(req, ADMIN_COOKIES.access);
    if (!accessToken) {
      throw new UnauthorizedException('Нужно войти');
    }
    const user = await this.auth.authenticate(accessToken);

    // Роли с метода важнее ролей с класса
    const roles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    // Без ролей эндпоинт закрыт для всех: забытый декоратор не откроет доступ
    if (!roles?.includes(user.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }

    (req as AuthenticatedRequest).user = user;
    return true;
  }
}
