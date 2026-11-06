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
