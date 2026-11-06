import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  ADMIN_COOKIES,
  loginSchema,
  totpCodeSchema,
  type TotpCode,
} from '@portfolio/shared';
import type { Request, Response } from 'express';
import { ClientIpThrottlerGuard } from '../common/client-ip-throttler.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ValidationErrorDto } from '../contact/contact.dto.js';
import { LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS } from './auth.constants.js';
import {
  clearAuthCookies,
  clearMfaCookie,
  readCookie,
  setAuthCookies,
  setMfaCookie,
} from './auth.cookies.js';
import { AdminOnly, CurrentUser } from './auth.decorators.js';
import {
  AdminUserDto,
  LoginDto,
  MfaRequiredDto,
  TotpCodeDto,
} from './auth.dto.js';
import { AuthService, type AuthUser } from './auth.service.js';
import { SameOriginGuard } from './same-origin.guard.js';

@ApiTags('Вход в админку')
@Controller('auth')
@UseGuards(SameOriginGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(204)
  @UseGuards(ClientIpThrottlerGuard)
  @Throttle({
    default: { ttl: LOGIN_RATE_WINDOW_MS, limit: LOGIN_RATE_LIMIT },
  })
  @ApiOperation({
    summary: 'Войти: ставит cookie сессии',
    description: `Не больше ${LOGIN_RATE_LIMIT} попыток за ${LOGIN_RATE_WINDOW_MS / 60_000} минут с одного IP.`,
  })
  @ApiNoContentResponse({ description: 'Вход выполнен' })
  @ApiOkResponse({
    type: MfaRequiredDto,
    description:
      'Пароль верный, нужен код второго фактора: POST /auth/login/totp',
  })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiUnauthorizedResponse({ description: 'Неверная почта или пароль' })
  @ApiTooManyRequestsResponse({ description: 'Слишком много попыток' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginDto,
    // passthrough: ответ по-прежнему отправляет Nest, мы только ставим cookie
    @Res({ passthrough: true }) res: Response,
  ): Promise<MfaRequiredDto | undefined> {
    const result = await this.auth.login(body);
    if (result.kind === 'session') {
      setAuthCookies(res, result.tokens);
      return undefined;
    }
    setMfaCookie(res, result.mfaToken);
    res.status(200);
    return { mfaRequired: true };
  }

  @Post('login/totp')
  @HttpCode(204)
  // Свой счётчик попыток: 6 цифр перебирать дольше, чем пароль, но не бесконечно
  @UseGuards(ClientIpThrottlerGuard)
  @Throttle({
    default: { ttl: LOGIN_RATE_WINDOW_MS, limit: LOGIN_RATE_LIMIT },
  })
  @ApiOperation({
    summary: 'Второй шаг входа: код из приложения или резервный код',
  })
  @ApiBody({ type: TotpCodeDto })
  @ApiNoContentResponse({ description: 'Вход выполнен' })
  @ApiUnauthorizedResponse({ description: 'Неверный код или шаг истёк' })
  @ApiTooManyRequestsResponse({ description: 'Слишком много попыток' })
  async loginTotp(
    @Req() req: Request,
    @Body(new ZodValidationPipe(totpCodeSchema)) body: TotpCode,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const mfaToken = readCookie(req, ADMIN_COOKIES.mfa) ?? '';
    setAuthCookies(res, await this.auth.completeMfa(mfaToken, body.code));
    clearMfaCookie(res);
  }

  @Post('refresh')
  @HttpCode(204)
  @ApiOperation({ summary: 'Обновить токены по cookie обновления' })
  @ApiNoContentResponse({ description: 'Cookie обновлены' })
  @ApiUnauthorizedResponse({ description: 'Сессия недействительна' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    // При ошибке cookie не стираем. Запрос мог прийти со старым токеном,
    // а у браузера уже лежит новый от соседнего ответа: Set-Cookie с пустым
    // значением удалил бы как раз его. Мёртвые cookie безвредны, вход их перезапишет
    const refreshToken = readCookie(req, ADMIN_COOKIES.refresh) ?? '';
    setAuthCookies(res, await this.auth.refresh(refreshToken));
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Выйти: удаляет сессию на сервере и cookie' })
  @ApiNoContentResponse({ description: 'Сессия завершена' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout({
      accessToken: readCookie(req, ADMIN_COOKIES.access),
      refreshToken: readCookie(req, ADMIN_COOKIES.refresh),
    });
    clearAuthCookies(res);
  }

  @Get('me')
  @AdminOnly()
  @ApiOperation({ summary: 'Кто вошёл' })
  @ApiOkResponse({ type: AdminUserDto })
  me(@CurrentUser() user: AuthUser): AdminUserDto {
    const { id, email, role } = user;
    return { id, email, role };
  }
}
