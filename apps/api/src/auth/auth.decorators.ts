import {
  applyDecorators,
  createParamDecorator,
  SetMetadata,
  UseGuards,
  type ExecutionContext,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ADMIN_COOKIES } from '@portfolio/shared';
import { AdminRole } from '../generated/prisma/client.js';
import type { AuthenticatedRequest } from './admin-auth.guard.js';
import { AdminAuthGuard } from './admin-auth.guard.js';
import { ROLES_KEY } from './auth.constants.js';
import type { AuthUser } from './auth.service.js';
import { SameOriginGuard } from './same-origin.guard.js';

/**
 * Закрывает эндпоинт или весь контроллер админки:
 * проверка источника, сессии и роли плюс описание в Swagger.
 *
 * @param roles кому можно. По умолчанию администратору.
 */
export function AdminOnly(...roles: AdminRole[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles.length > 0 ? roles : [AdminRole.ADMIN]),
    // Порядок важен: сначала дешёвая проверка заголовка, потом запрос в базу
    UseGuards(SameOriginGuard, AdminAuthGuard),
    ApiCookieAuth(ADMIN_COOKIES.access),
    ApiUnauthorizedResponse({ description: 'Нет сессии или она истекла' }),
    ApiForbiddenResponse({ description: 'Нет прав или запрос с чужого сайта' }),
  );
}

/** Пользователь, которого положил в запрос AdminAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
