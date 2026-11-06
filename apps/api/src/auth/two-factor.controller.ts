import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { totpCodeSchema, type TotpCode } from '@portfolio/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ValidationErrorDto } from '../contact/contact.dto.js';
import { AdminOnly, CurrentUser } from './auth.decorators.js';
import {
  BackupCodesDto,
  TotpCodeDto,
  TwoFactorSetupDto,
  TwoFactorStatusDto,
} from './auth.dto.js';
import type { AuthUser } from './auth.service.js';
import { TwoFactorService } from './two-factor.service.js';

const code = () => Body(new ZodValidationPipe(totpCodeSchema));

/**
 * Второй фактор в админке. Под /admin, а не /auth: прокси сайта пропускает
 * обе ветки, но эти эндпоинты требуют уже открытой сессии.
 */
@ApiTags('Админка: безопасность')
@Controller('admin/security/totp')
@AdminOnly()
export class TwoFactorController {
  constructor(private readonly twoFactor: TwoFactorService) {}

  @Get()
  @ApiOperation({ summary: 'Включён ли второй фактор' })
  @ApiOkResponse({ type: TwoFactorStatusDto })
  status(@CurrentUser() user: AuthUser): Promise<TwoFactorStatusDto> {
    return this.twoFactor.status(user.id);
  }

  @Post('setup')
  @HttpCode(200)
  @ApiOperation({ summary: 'Начать подключение: новый секрет для приложения' })
  @ApiOkResponse({ type: TwoFactorSetupDto })
  @ApiConflictResponse({ description: 'Второй фактор уже включён' })
  setup(@CurrentUser() user: AuthUser): Promise<TwoFactorSetupDto> {
    return this.twoFactor.startSetup(user.id, user.email);
  }

  @Post('enable')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Подтвердить кодом и включить. Другие сессии завершаются',
  })
  @ApiBody({ type: TotpCodeDto })
  @ApiOkResponse({ type: BackupCodesDto })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  @ApiConflictResponse({ description: 'Второй фактор уже включён' })
  enable(
    @CurrentUser() user: AuthUser,
    @code() body: TotpCode,
  ): Promise<BackupCodesDto> {
    return this.twoFactor.enable(user.id, user.sessionId, body.code);
  }

  @Post('disable')
  @HttpCode(204)
  @ApiOperation({ summary: 'Выключить: нужен код из приложения или резервный' })
  @ApiBody({ type: TotpCodeDto })
  @ApiNoContentResponse({ description: 'Выключен' })
  @ApiBadRequestResponse({ type: ValidationErrorDto })
  disable(
    @CurrentUser() user: AuthUser,
    @code() body: TotpCode,
  ): Promise<void> {
    return this.twoFactor.disable(user.id, body.code);
  }
}
