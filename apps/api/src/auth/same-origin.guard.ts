import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Защита от CSRF вторым слоем после SameSite. Браузер сам ставит заголовок
 * Origin у POST, PATCH и DELETE, и страница не может его подменить. Если он
 * есть и это не адрес сайта, запрос пришёл с чужой страницы.
 *
 * Запрос без Origin пропускаем: так ходят сервер сайта, curl и тесты,
 * а у них нет cookie посетителя, которыми можно было бы злоупотребить.
 */
@Injectable()
export class SameOriginGuard implements CanActivate {
  private readonly siteOrigin: string;

  constructor(config: ConfigService) {
    this.siteOrigin = config.get<string>(
      'CORS_ORIGIN',
      'http://localhost:3000',
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const origin = req.headers.origin;
    if (
      SAFE_METHODS.has(req.method) ||
      origin === undefined ||
      origin === this.siteOrigin
    ) {
      return true;
    }
    throw new ForbiddenException('Запрос с чужого сайта');
  }
}
