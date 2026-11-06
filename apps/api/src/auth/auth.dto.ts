import { ApiProperty } from '@nestjs/swagger';
import { AUTH_LIMITS } from '@portfolio/shared';
import { AdminRole } from '../generated/prisma/client.js';

// Проверку выполняет loginSchema из @portfolio/shared, классы описывают контракт

export class LoginDto {
  @ApiProperty({
    format: 'email',
    maxLength: AUTH_LIMITS.emailMax,
    example: 'admin@example.com',
  })
  email!: string;

  @ApiProperty({
    format: 'password',
    minLength: 1,
    maxLength: AUTH_LIMITS.passwordMax,
  })
  password!: string;
}

export class AdminUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: AdminRole, enumName: 'AdminRole' })
  role!: AdminRole;
}

export class MfaRequiredDto {
  @ApiProperty({ enum: [true] })
  mfaRequired!: true;
}

export class TotpCodeDto {
  @ApiProperty({
    example: '123456',
    description: 'Шесть цифр из приложения или резервный код ABCD-EFGH-JK',
  })
  code!: string;
}

export class TwoFactorStatusDto {
  @ApiProperty()
  enabled!: boolean;

  @ApiProperty({ description: 'Сколько резервных кодов ещё не использовано' })
  backupCodesLeft!: number;
}

export class TwoFactorSetupDto {
  @ApiProperty({
    description: 'Секрет в base32 — для ручного ввода в приложение',
  })
  secret!: string;

  @ApiProperty({ description: 'Ссылка otpauth:// для QR-кода' })
  otpauthUrl!: string;
}

export class BackupCodesDto {
  @ApiProperty({
    type: [String],
    description: 'Показываются один раз: в базе хранятся только хеши',
  })
  backupCodes!: string[];
}
